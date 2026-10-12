# Deploying so the admin actually works

A one-page answer to *“the admin is not working when I deploy”*. Full detail is in
[README §9](../README.md); this is the ordering that gets it live.

---

## The one thing to understand first

The public site is static files and will run anywhere. **The admin is not static.**
It stores your content, your password, your images and your enquiries as *files on the
server*, through a small Node process. So a deploy needs three things a plain website
does not:

1. a **Node process** that keeps running (not just files on a CDN);
2. a **writable, persistent directory** for that state;
3. a **build step** — `dist/` is deliberately not in the repository.

Any host that gives all three will run the site and the admin. Vercel, Netlify, Cloudflare
Pages and GitHub Pages give (1) and (3) but not (2): they can serve the website beautifully
and **cannot run this admin at all**. That is not a bug to fix — it is what those products are.
Move the deployment to a Node host (below) and the admin works there.

---

## Check before you guess

On the host, in the project directory, with the same environment the app runs with:

```bash
npm run doctor
```

Eight checks, each **PASS** or **FAIL**, each failure with the fix printed underneath.
Blockers (build missing, storage not writable, content file unreadable) are separated from
recommendations (`SESSION_SECRET`, `TRUST_PROXY`). It exits non-zero on a blocker, and it
never prints a secret — only whether one is set.

---

## The deploy, in order

```bash
# 1. code
git clone git@github.com:murithador-a/toc.git && cd toc
npm ci

# 2. configuration — start from the documented template
cp .env.example .env
#    set:   API_PORT (or let the host set PORT)
#           HOST=0.0.0.0
#           DATA_DIR=/var/data            <- a persistent mounted volume
#           UPLOADS_DIR=/var/data/uploads
#           SESSION_SECRET=<openssl rand -hex 32>
#           TRUST_PROXY=true              <- if a proxy or load balancer is in front
#    leave: ADMIN_PASSWORD=                <- empty means "use the first-run screen at /admin"

# 3. build and verify
npm run build
npm run doctor          # every blocker must pass before you go further

# 4. run
npm start               # serves the built site AND /api AND /admin on one port
```

Then open `https://your-domain/admin`. The very first visit shows **“Set up the admin
password”** — set it, and that is your sign-in from then on.

### Host command cheat-sheet

| Host | Build command | Start command | Storage |
| --- | --- | --- | --- |
| Render, Railway, Fly.io, Heroku-style | `npm ci && npm run build` | `npm start` | Add a **disk/volume** and set `DATA_DIR` to its mount path — without it, every restart starts empty |
| VPS (Ubuntu + Nginx/Caddy) | `npm ci && npm run build` | `npm start` under `systemd` or `pm2` | `DATA_DIR=server/data` is fine when the service user owns the folder |
| Docker / container host | included `Dockerfile` | `node tools/start.mjs` | The image declares `/var/data` as a volume: `docker run -p 8787:8787 -v toc-data:/var/data toc-site` |
| Vercel / Netlify / Pages | — | — | **The admin cannot run here.** Either host the whole thing on a Node host, or publish the site statically and edit `content/site.json` in the repository |

---

## If it still misbehaves

| What you see | What it means | What to do |
| --- | --- | --- |
| Something saves nothing; the message mentions `EACCES`, `EROFS`, `read-only`, or *“is not writable on this deployment”* | The filesystem is read-only or disposable — a container image, a serverless platform, a read-only mount | Mount a persistent disk, set `DATA_DIR` and `UPLOADS_DIR` to it, restart |
| `/admin` shows **“Set up the admin password”** although you have been using the site for weeks | The deployment's data directory is new. `server/data/` is not in the repository, by design | Either set the password again there, or copy `server/data/auth.json` from your working installation (keep it `chmod 600`) |
| `/admin` says the API cannot be reached, but the site is fine | There is no Node process — a static host, or the app is not running | Deploy on a Node host, or start the process |
| The site shows the API's plain text *“API is running…”* on every page | `dist/` was never built on the host | Add `npm run build` to the deploy, or upload `dist/` |
| Every page returns the site's own 404 page | SPA fallback missing on a static host | Rewrite unknown paths to `/index.html` |
| Signed out after every deploy | `SESSION_SECRET` changes between deploys, or is unset | Set `SESSION_SECRET` once in the host's environment and leave it alone |
| Nobody can sign in after a few attempts | The login lockout is counting the proxy's IP, not the visitor's | Set `TRUST_PROXY=true` |
| The admin loads but the site shows old content | A CDN or the host is caching HTML | Cache `/images/*` and `/fonts/*` hard; leave HTML uncached (the server already sends `no-cache` on the API) |

**Settings → This installation** inside the admin answers the two questions that matter about any
deployment at a glance: *Saving changes* (writable or not) and *Site build* (serving `dist/` or not).

---

## What to back up

Only four things hold state:

```
content/site.json                     your content
server/data/auth.json                 the administrator credential (mode 600)
server/data/uploads/                  uploaded images
server/data/submissions.json          enquiries from the forms
```

`server/data/backups/` keeps the last 30 versions of the content file automatically. Nothing else
in the project is stateful — the rest can be rebuilt from the repository.
