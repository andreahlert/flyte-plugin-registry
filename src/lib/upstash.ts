const REST_URL = process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL || "";
const REST_TOKEN = process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN || "";

async function redis<T = unknown>(
  command: string[],
): Promise<T | null> {
  if (!REST_URL || !REST_TOKEN) return null;
  try {
    const res = await fetch(`${REST_URL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.result as T;
  } catch {
    return null;
  }
}

/** Get vote count for a single package */
export async function getVotes(packageName: string): Promise<number> {
  const result = await redis<string>(["GET", `votes:${packageName}`]);
  return result ? parseInt(result, 10) : 0;
}

/** Get vote counts for multiple packages in one round-trip */
export async function getVotesBulk(
  packageNames: string[],
): Promise<Record<string, number>> {
  if (packageNames.length === 0) return {};
  const keys = packageNames.map((n) => `votes:${n}`);
  const results = await redis<(string | null)[]>(["MGET", ...keys]);
  const map: Record<string, number> = {};
  if (results) {
    packageNames.forEach((name, i) => {
      map[name] = results[i] ? parseInt(results[i]!, 10) : 0;
    });
  }
  return map;
}

/** Check if a fingerprint already voted on a package */
export async function hasFingerprint(packageName: string, fp: string): Promise<boolean> {
  const result = await redis<number>(["SISMEMBER", `fp:${packageName}`, fp]);
  return result === 1;
}

/** Get all fingerprinted packages for a fingerprint (bulk check on load) */
export async function getFingerprintedVotes(fp: string, packageNames: string[]): Promise<Set<string>> {
  const voted = new Set<string>();
  // Pipeline: SISMEMBER for each package
  for (const name of packageNames) {
    const result = await redis<number>(["SISMEMBER", `fp:${name}`, fp]);
    if (result === 1) voted.add(name);
  }
  return voted;
}

/** Increment vote with fingerprint guard. Returns new count or -1 if already voted. */
export async function upvote(packageName: string, fp: string): Promise<number> {
  // Add fingerprint to set, returns 1 if new, 0 if already existed
  const added = await redis<number>(["SADD", `fp:${packageName}`, fp]);
  if (added === 0) return -1; // already voted
  const result = await redis<number>(["INCR", `votes:${packageName}`]);
  return result ?? 0;
}

/** Decrement vote and remove fingerprint. Returns new count, min 0. */
export async function downvote(packageName: string, fp: string): Promise<number> {
  // Remove fingerprint
  await redis(["SREM", `fp:${packageName}`, fp]);
  const result = await redis<number>(["DECR", `votes:${packageName}`]);
  if (result !== null && result < 0) {
    await redis(["SET", `votes:${packageName}`, "0"]);
    return 0;
  }
  return result ?? 0;
}
