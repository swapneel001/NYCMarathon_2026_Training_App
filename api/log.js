// Vercel serverless function — training log sync backed by Upstash Redis (REST).
//
// Env vars (either naming works — Vercel's KV integration uses KV_*,
// the Upstash marketplace integration uses UPSTASH_*):
//   UPSTASH_REDIS_REST_URL   | KV_REST_API_URL
//   UPSTASH_REDIS_REST_TOKEN | KV_REST_API_TOKEN

const REDIS_URL =
  process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

async function redis(command) {
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
function keyFor(code) {
  const clean = String(code || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
  if (clean.length < 4 || clean.length > 64) return null;
  return `marathon:log:${clean}`;
}

// Merge two logs entry-by-entry, newest loggedAt wins.
// Cleared entries are kept as tombstones so a delete on one device
// propagates instead of being resurrected by a stale copy.
function mergeLogs(a = {}, b = {}) {
  const out = { ...a };
  for (const [cellId, entry] of Object.entries(b)) {
    const existing = out[cellId];
    if (!existing) {
      out[cellId] = entry;
      continue;
    }
    const tExisting = Date.parse(existing.loggedAt || 0) || 0;
    const tIncoming = Date.parse(entry.loggedAt || 0) || 0;
    if (tIncoming >= tExisting) out[cellId] = entry;
  }
  return out;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const code = req.query.code;
  const key = keyFor(code);
  if (!key) {
    return res
      .status(400)
      .json({ error: "Invalid sync code (4–64 chars, letters/numbers/-/_)" });
  }

  try {
    if (req.method === "GET") {
      const { result } = await redis(["GET", key]);
      const data = result ? JSON.parse(result) : {};
      return res.status(200).json({ data });
    }

    if (req.method === "POST") {
      let body = req.body;
      if (typeof body === "string") body = JSON.parse(body || "{}");
      const incoming = (body && body.data) || {};

      // Read-merge-write so two devices saving close together don't
      // clobber each other.
      const { result } = await redis(["GET", key]);
      const current = result ? JSON.parse(result) : {};
      const merged = mergeLogs(current, incoming);

      await redis(["SET", key, JSON.stringify(merged)]);
      return res.status(200).json({ data: merged });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
