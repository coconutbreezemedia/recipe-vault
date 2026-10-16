# Recipe Vault

A private, **offline-first** recipe & meal-planning app built for Reba — a Pinterest-style photo gallery, meal planner, and auto-generated grocery list. Installable to the phone home screen (PWA).

Recipes live **on the device** (IndexedDB). The app still works with no network. Settings has a one-tap **Backup / Restore** file, and an optional **Cloud sync** card.

## Why Supabase is here

Supabase is the optional cloud copy. It is not required to cook from the phone.

- **Cloud sync** stores recipes, the meal plan, and the grocery list under a vault key you generate in Settings. Another phone enters that key and pulls the same vault. There is no account.
- **Shared recipes** are the ones you mark shared. The public page at `/share/#<id>` reads that one recipe from Supabase.

Photos and the vault stay in your Supabase project (`synced_records`). The anon key in the app can only call the sync functions; it cannot read the tables directly.

A free Supabase project **pauses after a quiet week** (the dashboard calls this inactive or resting). Opening the dashboard does not count. The database needs a few real queries on most days. `.github/workflows/supabase-keepalive.yml` does that once a day by updating one timestamp. Before the first run, restore the project if it is paused and run `supabase/keepalive.sql` in the Supabase SQL editor. The workflow can also be started by hand from the Actions tab.

## Stack
- Next.js 14 (static export) + React + TypeScript + Tailwind
- On-device storage: IndexedDB (recipes, meal plan, grocery list)
- PWA: service worker (offline) + web manifest (installable)
- Optional local passcode lock (salted SHA-256, stored only on device)

## Develop
```bash
npm install
npm run dev        # http://localhost:3000
```

## Build (static)
```bash
npm run build      # → ./out  (also generates a precache service worker)
```

## Deploy
Pushes to `main` deploy to GitHub Pages via `.github/workflows/deploy.yml`
(built with `NEXT_PUBLIC_BASE_PATH=/recipe-vault`).

---
Platform developed by [Coconut Breeze Media](https://coconutbreezemedia.com).
