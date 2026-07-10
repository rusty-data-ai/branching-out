# Handover — Guerilla Planter

A working handover for whoever (human or agent) picks this project up on a new
machine. Read this first, then `README.md` and `DEPLOY.md`.

## What this is

A members-only web app for guerilla gardeners to **map, track and care for
plants they've planted** (and record other plants "of interest"). Interactive
map, click-a-plant detail view, add-a-plant via phone GPS, care logs, photos,
health-over-time, kid-friendly features and a printable "treasure map".

- **Live:** deployed on Vercel (free) — user confirmed working.
- **Repo:** `rusty-chris/guerilla-planter` (private). Default branch `main`;
  active dev on `chris-dev`. Deploy = merge `chris-dev → main`, Vercel
  auto-builds.
- **Owner:** Chris McWilliams (`tophermcw@gmail.com`). Python/Streamlit-native,
  comfortable with React, wants **free hosting**, **autonomy** (do the work,
  don't hand back homework), and **email-confirmed auth is a hard requirement —
  no anonymous edits**.

## Stack

- **Next.js 13.5** (App Router, TypeScript) + **Tailwind**
- **Supabase** — auth (email confirmation), Postgres, Storage. Project ref
  `aqhaszlaptttgovankfg`.
- **Leaflet 1.9 + react-leaflet 4.2 + OpenStreetMap** tiles (no API key)
- `@supabase/ssr` + `@supabase/supabase-js`

## ⚠️ Environment constraint (read before you `npm install`)

The **old** machine could only run **Node 16** (Ubuntu 18.04 / glibc 2.27 —
Node 18+ needs glibc 2.28). That's why **Next is pinned to 13.5**. Locally:

```bash
nvm use 16          # Node 16.20.2 — anything newer failed to run
npm install
npm run dev         # http://localhost:3000
```

**On your NEW machine:** if it has a modern glibc, Node 18/20 will run fine —
but **keep Next at 13.5 unless you deliberately upgrade** (an upgrade means
reworking the `@supabase/ssr` cookie API, `metadata`/`viewport` exports, etc.).
Vercel already builds with modern Node in the cloud regardless; the Node-16
limit was only the old workstation.

## Local env vars

Create `.env.local` (note: on the old machine a safety hook **blocked writing
`.env*` files** — use `env.example` as the template and copy it manually):

```
NEXT_PUBLIC_SUPABASE_URL=https://aqhaszlaptttgovankfg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<the anon / publishable key>
```

Get the anon key from **Supabase → Project Settings → API** (it's the
`sb_publishable_…` / `anon` key — safe in the browser, guarded by RLS). **Never**
put the `service_role` secret in a `NEXT_PUBLIC_*` var.

## Database setup (run these in Supabase → SQL Editor, in order, all idempotent)

1. `supabase/schema.sql` — tables, RLS, storage bucket *(already applied to prod)*
2. `supabase/migrations/002_plant_types_features_observed.sql` — plant types,
   fun features, "of interest" records *(already applied; required by the app)*
3. `supabase/migrations/003_test_user.sql` — **shared test login** *(run this if
   not already done — see below)*

## Test login

On the login page, type **`test`** / **`test`**. The form maps the literal
username `test` → `test@guerilla.test` (`src/app/login/page.tsx`); the account is
created by migration `003_test_user.sql`. It's a **shared, trivially-guessable
account on a public site** — fine for testing, deliberately not advertised in the
UI. Delete it before the registry matters:
`delete from auth.users where email='test@guerilla.test';`

## Repo map (key files)

- `src/app/page.tsx` — landing page (signed-out)
- `src/app/login`, `/signup`, `/forgot-password`, `/account` — auth pages
- `src/app/auth/callback/route.ts` — handles both `code` (PKCE) and
  `token_hash` (verifyOtp) email-confirmation flows
- `src/middleware.ts` — session refresh + route protection
  (`PROTECTED_PREFIXES = ["/map","/account","/print"]`)
- `src/components/MapApp.tsx` — main client orchestrator (map + panels + filters).
  Default center **Bristol UK** `[51.4545, -2.5879]`, zoom 12.
- `src/components/MapView.tsx` — Leaflet map + custom `divIcon` markers
- `src/components/AddTreePanel.tsx` — add-plant form (planted vs observed)
- `src/components/TreeDetailPanel.tsx` — detail view, care log, photos, health
- `src/components/PrintMap.tsx` + `src/app/print/[id]/page.tsx` — printable kid's
  treasure map. Start point = **GPS or manually tapped on the map** (toggle).
- `src/lib/` — `supabase/` (client/server), `api.ts`, `format.ts` (marker HTML,
  plant-type/feature/status metadata, `normalizeTree`), `geo.ts` (haversine,
  bearing), `database.types.ts` (hand-written types)
- `supabase/` — `schema.sql` + `migrations/`

## Marker / data conventions

- `origin`: `planted` (guerilla-planted by a member) vs `observed` ("of
  interest", auto-attributed to planter name "Wild").
- Marker badge: **🦍 = guerilla-planted**; "of interest" is the plain default.
  🚩 = needs attention, ✨ = has kid features, health dot bottom-right.
- RLS is **collaborative**: any member can view + add + log care on any plant;
  only the creator can delete.

## Deploy

Full steps in `DEPLOY.md`. Short version: push to `main` → Vercel auto-builds.
After deploy, set Supabase → Auth → URL Configuration **Site URL** + **Redirect
URLs** to the Vercel domain so confirmation/reset emails point at the live site.

## Status & what's open

**Done & deployed:** auth + email confirmation, map, add-via-GPS, detail view,
care logs, photos, health, password reset/change, plant types beyond trees,
kid-friendly features, "of interest" records, printable treasure map (now with
manual start point), 🦍 marker convention. Issues #1–#5 closed.

**Open issues (don't start without the owner's go-ahead):**
- **#6 — Ko-fi donation link.** Not built yet; needs Chris's Ko-fi handle. Plan:
  read URL from `NEXT_PUBLIC_KOFI_URL`, hide the link if unset; place on landing
  + signed-in header + account page. (Confirmed via Vercel Fair Use terms that
  asking for donations is **not** commercial use — allowed on Hobby.)
- **#8 (optional) — client-side photo compression.** Downscale to ~1600px +
  re-encode (`canvas.toBlob`, ~0.8 quality) in `src/lib/api.ts uploadPhoto`
  before upload. **Highest-leverage lever for staying on Supabase free** — the
  1 GB storage / 5 GB egress from full-res photos is the real ceiling, not user
  or DB counts. Respect EXIF orientation.
- **Floated, not filed:** a scheduled Supabase usage-alert monitor (GitHub
  Action hitting the Supabase Management API).

## Gotchas / lessons

- **Phone GPS needs HTTPS** (secure context) — works on Vercel, not on a plain
  `http://` LAN dev server.
- **Supabase free projects auto-pause after ~7 days idle** early on — click
  restore in the dashboard.
- Email confirmation had a PKCE-vs-token_hash mismatch across contexts; the
  callback route now handles both and falls back to `/login?confirmed=1`.
- Leaflet tiles render as patchwork unless you call `invalidateSize()` after
  mount/resize (see `InvalidateSize` in `MapView.tsx`, `Fit` in `PrintMap.tsx`).
- Don't name a plain helper `useSomething` — ESLint's rules-of-hooks treats the
  `use` prefix as a hook.
- Verify locally with `npx tsc --noEmit` and
  `npx next lint --file <changed files>` before committing (both must be clean).
