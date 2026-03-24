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

/** Increment vote. Returns new count. */
export async function upvote(packageName: string): Promise<number> {
  const result = await redis<number>(["INCR", `votes:${packageName}`]);
  return result ?? 0;
}

/** Decrement vote (undo). Returns new count, min 0. */
export async function downvote(packageName: string): Promise<number> {
  // DECR then clamp to 0
  const result = await redis<number>(["DECR", `votes:${packageName}`]);
  if (result !== null && result < 0) {
    await redis(["SET", `votes:${packageName}`, "0"]);
    return 0;
  }
  return result ?? 0;
}
