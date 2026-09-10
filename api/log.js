// Vercel serverless function — training log sync backed by Upstash Redis.
// Read-only performance records for outside tools live in records.js.

import { mergeLogs } from "../lib/mergeLogs.js";
import { redis, keyFor, readLog } from "../lib/redis.js";

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
      return res.status(200).json({ data: await readLog(key) });
    }

    if (req.method === "POST") {
      let body = req.body;
      if (typeof body === "string") body = JSON.parse(body || "{}");
      const incoming = (body && body.data) || {};

      // Read-merge-write so two devices saving close together don't
      // clobber each other.
      const merged = mergeLogs(await readLog(key), incoming);

      await redis(["SET", key, JSON.stringify(merged)]);
      return res.status(200).json({ data: merged });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
