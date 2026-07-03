# Deploying Guerilla Planter (free)

This puts the app online for real, on a public HTTPS URL, using two free
services: **Vercel** (hosts the Next.js app) and **Supabase** (auth + database +
photo storage, which you already set up). Total time ~15 minutes.

> Why Vercel? It's made by the Next.js team, has a genuinely free "Hobby" tier,
> auto-builds from GitHub on every push, and gives you HTTPS out of the box (so
> the phone **GPS** button works, unlike the plain-HTTP LAN server).

---

## Step 0 — Get all the work onto the `main` branch

All the features live on the **`chris-dev`** branch. `main` (the branch Vercel
deploys by default) is still the first prototype. So before deploying, merge
`chris-dev` into `main`:

- Open a pull request `chris-dev → main` on GitHub and merge it, **or** ask
  Claude to open/merge it for you, **or**
- In Vercel later, set the **Production Branch** to `chris-dev` instead (Project
  → Settings → Git). Merging to `main` is the cleaner option.

## Step 1 — Make sure the database is up to date

In the Supabase dashboard → **SQL Editor**, run these once (safe to re-run):

1. `supabase/schema.sql` — base tables, security, storage bucket *(already done)*
2. `supabase/migrations/002_plant_types_features_observed.sql` — plant types,
   fun features, and "of interest" records **(required for the current app)**

## Step 2 — Deploy on Vercel

1. Go to **[vercel.com](https://vercel.com)** and **sign up / log in with GitHub**
   (the `rusty-chris` account).
2. **Add New… → Project**. Find **`guerilla-planter`** and click **Import**.
   - It's a private repo, so if prompted, **grant Vercel access** to it (install
     the Vercel GitHub app on the repo).
3. Vercel auto-detects **Next.js** — leave the build settings at their defaults.
4. Expand **Environment Variables** and add these two (from Supabase →
   Project Settings → API):

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://aqhaszlaptttgovankfg.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your `anon` / publishable key (`sb_publishable_…`) |

5. Click **Deploy** and wait 1–2 minutes. You'll get a URL like
   **`https://guerilla-planter.vercel.app`** (yours may have a random suffix —
   note the exact one).

## Step 3 — Point Supabase auth at the live URL (important)

So email-confirmation and password-reset links go to the live site, in Supabase
→ **Authentication → URL Configuration**:

- **Site URL:** `https://your-app.vercel.app`
- **Redirect URLs:** add `https://your-app.vercel.app/**`

(Leave your LAN URL in there too if you still test locally.)

## Step 4 — Test it

Open the Vercel URL on your phone and computer:

- Sign up → confirm via the email link (now points at the live domain) → sign in.
- Add a plant — the **"Use my GPS"** button now works (HTTPS).
- Try the treasure-map print and the filters.

---

## Good to know

- **Auto-deploys:** every push to `main` redeploys production automatically;
  pushes to other branches get their own preview URL.
- **Node version:** Vercel builds with a modern Node automatically — the local
  Node-16 requirement was only for this workstation and doesn't apply online.
- **Costs:** Vercel Hobby + Supabase Free are enough for a small community. On
  Supabase's free tier the built-in email sender is rate-limited; for higher
  volume add your own SMTP under Authentication → Emails.
- **Secrets:** only the *public* Supabase URL + anon key are used (safe in the
  browser, guarded by the row-level-security rules). Never put the Supabase
  `service_role` secret in these `NEXT_PUBLIC_*` vars.
- **Custom domain:** optional — add one anytime in Vercel → Settings → Domains.
- **Env changes** (e.g. adding a future `NEXT_PUBLIC_KOFI_URL`) are done in
  Vercel → Settings → Environment Variables, then redeploy — no code change.
