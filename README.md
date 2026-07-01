# 🌳 Guerilla Planting

A small web app for guerilla gardeners to **map, track and care for the trees they plant**.

- Sign up with an email-confirmed account (no anonymous edits).
- See every recorded tree on an interactive map.
- Tap a tree for its species, planting date, who planted it, notes, photos and care history.
- Add a tree using your **phone's GPS** (or by tapping the map), so you can find it again.
- Log watering & check-ups, flag a tree as **needing attention**, update its health, and add photos over time — so saplings actually survive.

Built with **Next.js (App Router) + TypeScript**, **Supabase** (auth + Postgres + photo storage),
**Leaflet + OpenStreetMap** (free, no API key) and **Tailwind CSS**.

---

## What you need

- A free [Supabase](https://supabase.com) account (database, auth, photo storage).
- A free [Vercel](https://vercel.com) account (hosting) — or run it locally.
- Node.js (this repo was developed and tested on **Node 16**; Node 18+ also works).

---

## 1. Set up Supabase (~5 minutes)

1. Go to [supabase.com](https://supabase.com) → **New project**. Pick a name and a database
   password (save it somewhere). Wait for it to finish provisioning.
2. In the dashboard, open **SQL Editor → New query**, paste the entire contents of
   [`supabase/schema.sql`](./supabase/schema.sql), and click **Run**. This creates the
   tables, security rules, the photo storage bucket, and the new-user trigger. It's safe
   to re-run.
3. Open **Project Settings → API** and copy two values:
   - **Project URL**
   - **Project API key** → the **`anon` / `public`** key (not the secret service key).
4. Email confirmation is **on by default** in Supabase, which is exactly what we want.
   - On the free tier, Supabase's built-in email sender is rate-limited and only sends to
     a few addresses — fine for a prototype. For real use, add your own SMTP under
     **Authentication → Emails → SMTP Settings**.
   - Under **Authentication → URL Configuration**, set **Site URL** to your deployed URL
     (e.g. `https://your-app.vercel.app`) and add it (plus `http://localhost:3000`) to
     **Redirect URLs**, so the confirmation link returns users to the right place.

## 2. Run it locally

```bash
# 1. install dependencies
npm install

# 2. create your env file from the template and fill in the two values
cp env.example .env.local
#   NEXT_PUBLIC_SUPABASE_URL=...        (your Project URL)
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=...   (your anon/public key)

# 3. start the dev server
npm run dev
```

Open <http://localhost:3000>, create an account, confirm via the email link, then sign in.

> **Note on GPS:** browsers only allow location access over **HTTPS** (or on
> `localhost`). On a deployed Vercel URL it works automatically. To test phone GPS during
> local dev, either use `localhost` on the phone via port-forwarding, or just tap the map
> to place pins.

## 3. Deploy to Vercel (free)

1. Push this repo to GitHub.
2. In Vercel, **Add New → Project**, import the repo (Vercel auto-detects Next.js).
3. Under **Environment Variables**, add the same two variables from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Deploy.** Then go back to Supabase → **Authentication → URL Configuration** and make
   sure your `https://<your-app>.vercel.app` is set as the Site URL and Redirect URL.

That's it — share the URL with your fellow planters.

---

## How it works

| Area | Choice |
| --- | --- |
| Auth | Supabase email/password with **email confirmation**. A Postgres trigger auto-creates a `profiles` row with the display name on signup. |
| Map | Leaflet + OpenStreetMap tiles. Markers are colour-coded by health, with a 🚩 badge when a tree needs attention. |
| Add tree | Uses the browser Geolocation API for phone GPS; falls back to tapping/dragging a pin on the map. |
| Photos | Uploaded to a public Supabase Storage bucket (`tree-photos`); metadata in the `tree_photos` table. |
| Security | Row Level Security: any signed-in member can view everything and collaboratively log care; only a tree's creator can delete it. See `supabase/schema.sql`. |

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
    format.ts             status colours, labels, marker HTML, dates
  middleware.ts           refreshes the session and guards /map
supabase/
  schema.sql              run this once in the Supabase SQL editor
```

## Ideas for later

- Public read-only map (members add, anyone views).
- Filter/search by species or "needs attention".
- Survival-rate stats per planter or per area.
- "Trees near me" / route-to-tree for watering rounds.
