/**
 * Upstash Redis client for vote management.
 *
 * KNOWN LIMITATION: The REST token is embedded in the client bundle (NEXT_PUBLIC_*).
 * This is inherent to the fully static (output: "export") deployment model on GitHub Pages.
 * Anyone inspecting the JS bundle can extract the token and call the API directly.
 * For a community wishlist this risk is accepted: the worst case is vote manipulation,
 * not data breach. To fully mitigate, move write operations behind a Cloudflare Worker
 * or similar edge proxy that keeps the token server-side.
 */

const REST_URL = process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL || "";
const REST_TOKEN = process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN || "";

async function redis<T = unknown>(command: string[]): Promise<T | null> {
  if (!REST_URL || !REST_TOKEN) return null;
  try {
    const res = await fetch(REST_URL, {
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

/** Execute multiple commands in a single HTTP request via Upstash pipeline */
async function pipeline<T = unknown>(commands: string[][]): Promise<(T | null)[]> {
  if (!REST_URL || !REST_TOKEN) return commands.map(() => null);
  try {
    const res = await fetch(`${REST_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commands),
    });
    if (!res.ok) return commands.map(() => null);
    const data: { result: T }[] = await res.json();
    return data.map((d) => d.result ?? null);
  } catch {
    return commands.map(() => null);
  }
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

/** Check which packages a fingerprint has voted on (single HTTP request via pipeline) */
export async function getFingerprintedVotes(
  fp: string,
  packageNames: string[],
): Promise<Set<string>> {
  if (packageNames.length === 0) return new Set();
  const commands = packageNames.map((name) => ["SISMEMBER", `fp:${name}`, fp]);
  const results = await pipeline<number>(commands);
  const voted = new Set<string>();
  results.forEach((result, i) => {
    if (result === 1) voted.add(packageNames[i]);
  });
  return voted;
}

/** Upvote atomically: SADD fingerprint + INCR count in a single pipeline. Returns new count or -1 if already voted. */
export async function upvote(packageName: string, fp: string): Promise<number> {
  const results = await pipeline<number>([
    ["SADD", `fp:${packageName}`, fp],
    ["INCR", `votes:${packageName}`],
  ]);
  const added = results[0];
  const newCount = results[1];

  if (added === 0) {
    // Fingerprint already existed, undo the INCR
    await redis(["DECR", `votes:${packageName}`]);
    return -1;
  }

  return newCount ?? 0;
}

/** Downvote atomically: SREM fingerprint + DECR count in a single pipeline. Clamps to 0. */
export async function downvote(packageName: string, fp: string): Promise<number> {
  const results = await pipeline<number>([
    ["SREM", `fp:${packageName}`, fp],
    ["DECR", `votes:${packageName}`],
  ]);

  const newCount = results[1];
  if (newCount !== null && newCount < 0) {
    await redis(["SET", `votes:${packageName}`, "0"]);
    return 0;
  }
  return newCount ?? 0;
}
