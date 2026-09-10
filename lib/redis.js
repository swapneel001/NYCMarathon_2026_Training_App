// Upstash Redis (REST) access, shared by the API functions.
//
// Env vars (either naming works — Vercel's KV integration uses KV_*,
// the Upstash marketplace integration uses UPSTASH_*):
//   UPSTASH_REDIS_REST_URL   | KV_REST_API_URL
//   UPSTASH_REDIS_REST_TOKEN | KV_REST_API_TOKEN

const REDIS_URL =
  process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

export async function redis(command) {
  if (!REDIS_URL || !REDIS_TOKEN) {
    throw new Error("Redis env vars not configured");
  }
  const res = await fetch(REDIS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) {
    throw new Error(`Redis error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

// Sync codes identify a dataset. Keep them tame so they can't be used
// to stuff arbitrary keys into Redis.
export function keyFor(code) {
  const clean = String(code || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
  if (clean.length < 4 || clean.length > 64) return null;
  return `marathon:log:${clean}`;
}

// Read a sync code's stored log. Missing key reads as an empty log.
export async function readLog(key) {
  const { result } = await redis(["GET", key]);
  return result ? JSON.parse(result) : {};
}
