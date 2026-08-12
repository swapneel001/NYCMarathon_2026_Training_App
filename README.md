# NYC Marathon 2026 — Training Tracker

17-week adapted Hal Higdon Novice 2 plan, Singapore-based training, race day
Sunday 1 November 2026. Includes run logging that syncs across devices, and a
running-focused upper/lower gym split.

- `index.html` / `styles.css` / `script.js` — the app (plan, gym tab, logging UI)
- `api/log.js` — serverless function backing multi-device sync
- `lib/mergeLogs.js` — merge logic shared by `script.js` and `api/log.js`
- `package.json` — only there to mark these files as ESM

---

## Deploy


### Git + auto-deploy (best if you'll keep editing)

```bash
git init
git add .
git commit -m "Marathon tracker"
git branch -M main
git remote add origin https://github.com/<you>/marathon-tracker.git
git push -u origin main
```

Then in Vercel: **Add New → Project → Import Git Repository**.
Framework preset **Other**, no build command, no output directory.

Every `git push` redeploys automatically. Given you'll likely tweak paces and
distances as training goes on, this is the one I'd choose.

----

## Add the database (required for sync)

Vercel KV was retired and folded into Upstash Redis, so this now comes from the
Marketplace:

1. Project → **Storage** → browse Marketplace → **Upstash Redis** → create.
2. Connect it to this project. Vercel injects the credentials automatically.
3. **Redeploy.** Env vars aren't picked up by an already-built deployment.

The function accepts either naming convention, so it works whichever the
integration sets:

| Primary | Fallback |
|---|---|
| `UPSTASH_REDIS_REST_URL` | `KV_REST_API_URL` |
| `UPSTASH_REDIS_REST_TOKEN` | `KV_REST_API_TOKEN` |

Free tier is far more than enough — the whole log is a few KB.

**Without the database** the app still works; logging just stays local to each
browser and the sync bar shows an offline error.

---

## How syncing works

- Every entry carries a `loggedAt` timestamp.
- Saving pushes local state; the server merges entry-by-entry, newest wins, and
  returns the authoritative log. Two devices editing different runs never
  clobber each other.
- Clearing a run writes a tombstone rather than deleting it, so the clear
  propagates instead of being resurrected by a stale device.
- `localStorage` is an offline cache — log a run with no signal and it saves
  locally, then pushes the next time you press Sync. Sync is manual only,
  never automatic.
- Gym variation selections sync too, under `gym:*` keys, kept separate so they
  never count toward run progress.

---

## Local development

```bash
vercel dev
vercel env pull   # fetches Upstash credentials into .env.local
```
