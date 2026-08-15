# 🌳 Guerilla Planter

A web app for guerilla gardeners to **map, track and care for the trees they plant** —
add a tree with your phone's GPS, log watering and check-ups, and flag saplings that
need attention, so they actually survive.

**Live demo:** <https://guerilla-planter.vercel.app>

## What this demonstrates

- **Full-stack TypeScript** — Next.js (App Router) with server-loaded data,
  protected routes via middleware, and typed database access end to end.
- **Backend-as-a-service done properly** — Supabase auth (email confirmation),
  Postgres with **Row Level Security**, storage for photos, and a signup trigger —
  the whole schema ships as one idempotent [`supabase/schema.sql`](./supabase/schema.sql).
- **Maps & geolocation UX** — Leaflet + OpenStreetMap (no API key), browser
  Geolocation API with a tap-the-map fallback, health-coded markers.
- **Product thinking** — collaborative care logs, needs-attention flags, photo
  history; documented handover (`HANDOVER.md`) and deployment (`DEPLOY.md`) guides.

## Features

- Sign up with an email-confirmed account (no anonymous edits).
- See every recorded tree on an interactive map.
- Tap a tree for its species, planting date, who planted it, notes, photos and care history.
- Add a tree using your **phone's GPS** (or by tapping the map), so you can find it again.
- Log watering & check-ups, flag a tree as **needing attention**, update its health,
  and add photos over time.

## Quick start

You need a free [Supabase](https://supabase.com) project (database, auth, storage)
and Node.js 16+.

```bash
# 1. Create a Supabase project, then run supabase/schema.sql in its SQL editor
#    (creates tables, RLS policies, the photo bucket and the new-user trigger).

# 2. Install and configure
npm install
cp env.example .env.local
#   NEXT_PUBLIC_SUPABASE_URL=...        (Project URL)
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=...   (anon/public key)

# 3. Run
npm run dev       # http://localhost:3000
```

In Supabase, set **Authentication → URL Configuration** so the email-confirmation
link returns users to your URL (add `http://localhost:3000` for local dev).

> **GPS note:** browsers only allow location access over HTTPS (or `localhost`).
> On the deployed URL it works automatically; locally, tap the map to place pins.

## Deploying (free)

Import the repo into [Vercel](https://vercel.com) (auto-detects Next.js), add the two
environment variables, deploy, then set the Vercel URL as the Supabase Site URL and
redirect URL. Full walkthrough in [`DEPLOY.md`](./DEPLOY.md).

## How it works

| Area | Choice |
| --- | --- |
| Auth | Supabase email/password with **email confirmation**. A Postgres trigger auto-creates a `profiles` row on signup. |
| Map | Leaflet + OpenStreetMap tiles. Markers colour-coded by health, with a 🚩 badge when a tree needs attention. |
| Add tree | Browser Geolocation API for phone GPS; falls back to tapping/dragging a pin. |
| Photos | Supabase Storage bucket (`tree-photos`); metadata in the `tree_photos` table. |
| Security | Row Level Security: any signed-in member can view everything and log care collaboratively; only a tree's creator can delete it. |

### Project structure

```
src/
  app/
    page.tsx              landing page
    login/  signup/       auth screens (email confirmation)
    auth/callback/        exchanges the email link for a session
    map/                  the protected app (server-loads trees, renders MapApp)
  components/
    MapApp.tsx            client orchestrator (state, GPS, panels)
    MapView.tsx           Leaflet map (markers, draft pin, fly-to)
    AddTreePanel.tsx      add-a-tree form
    TreeDetailPanel.tsx   details, care log, photos, health, delete
  lib/
    supabase/             browser + server clients
    api.ts                all data reads/writes
    database.types.ts     typed schema
  middleware.ts           refreshes the session and guards /map
supabase/
  schema.sql              run once in the Supabase SQL editor
```

## Ideas for later

- Public read-only map (members add, anyone views).
- Filter/search by species or "needs attention".
- Survival-rate stats per planter or per area.
- "Trees near me" / route-to-tree for watering rounds.
