// Merge two logs entry-by-entry, newest loggedAt wins.
// Cleared entries are kept as tombstones so a delete on one device
// propagates instead of being resurrected by a stale copy.
// Shared between api/log.js (server) and script.js (client) — see
// CLAUDE.md's "Sync/logging architecture" section for why this must
// stay a single implementation.
export function mergeLogs(a = {}, b = {}) {
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
