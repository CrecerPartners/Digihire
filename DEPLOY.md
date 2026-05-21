# Deployment

This monorepo deploys as **five independent Vercel projects**, one per app.
Each project must have its **Root Directory** in the Vercel dashboard set to
the app folder it owns. Per-app deploys are driven by each app's own
`vercel.json` — nothing at the repo root should be required.

## Vercel project map

| Vercel project | Root Directory (set in dashboard) | Config file | Domain |
|---|---|---|---|
| `digihire-landing` | `apps/landing` | `apps/landing/vercel.json` | digihire.io |
| `digihire-brands` | `apps/brands` | `apps/brands/vercel.json` | brands.digihire.io |
| `digihire-voltsquad` | `apps/voltsquad` | `apps/voltsquad/vercel.json` | voltsquad.digihire.io |
| `digihire-talentpool` | `apps/talentpool` | `apps/talentpool/vercel.json` | talents.digihire.io |
| `digihire-admin` | `apps/admin` | `apps/admin/vercel.json` | served via `digihire.io/admin/*` proxy |

Set Root Directory under: **Vercel dashboard → Project → Settings → General → Root Directory**.

## Why this matters

If a project's Root Directory is left as the repo root (`.`), Vercel ignores
the per-app `vercel.json` and falls back to root config. This caused two
historical incidents:

- `revert: remove buildCommand from root vercel.json to unbreak brands/talentpool` (2edc8aa)
- `fix(deploy): restore root vercel.json to unbreak voltsquad deploy` (7dc01a3)

Each time, root-level config built the wrong app or no app at all.
**Fixing the Root Directory in the dashboard is the permanent solution.**

## Removing the root `vercel.json`

A root `vercel.json` currently exists as a temporary patch for the
`digihire-voltsquad` project (which still has Root Directory = repo root in
the dashboard). Once that project's Root Directory is updated to
`apps/voltsquad`:

1. Confirm the next deploy succeeds.
2. `git rm vercel.json && git commit -m "chore: remove temporary root vercel.json"`.

## Per-app routing notes

- **voltsquad** is multi-entry: `index.html` is the static marketing
  landing, `app.html` is the React SPA. `vercel.json` splits routing:
  `/` → `index.html`, `/:path*` → `app.html`. Don't replace this with a
  generic SPA catch-all to `index.html`.
- **admin** is served at `/admin/*` via the landing proxy. The router uses
  `basename="/admin"` and Vite uses `base: "/admin/"`. Both must move
  together if the prefix ever changes.
- **landing** is multi-page static (about, blog, contact, events, voltsquad,
  sales-activations, index). New static pages need to be added both to
  `vite.config.ts` `rollupOptions.input` AND to `vercel.json` rewrites
  (e.g., `/foo` → `/foo.html`). SPA paths (`/login`, `/dashboard`, etc.)
  are 302-redirected to the correct subdomain app.

## Local development

```bash
# From repo root
npm install

# Run any single app
npm run dev:landing       # http://localhost:8080
npm run dev:voltsquad     # http://localhost:8081
npm run dev:admin         # http://localhost:8082
npm run dev:talentpool    # http://localhost:8083
npm run dev:brands        # http://localhost:8084

# Build any single app
npm run build:landing
npm run build:voltsquad
# etc.

# Build everything
npm run build:all
```

## Shared nav

`public/nav-partial.html` + `public/nav-loader.js` are the canonical
shared nav. Copies live in `apps/{brands,voltsquad,landing}/public/` and
must be kept in sync. When editing the shared nav, mirror the change in
all four locations.
