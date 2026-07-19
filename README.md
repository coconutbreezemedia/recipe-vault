# Recipe Vault

A private, **offline-first** recipe & meal-planning app built for Reba — a Pinterest-style photo gallery, meal planner, and auto-generated grocery list. Installable to the phone home screen (PWA).

Everything is stored **on the device** (IndexedDB) — no accounts, no servers, no data leaves the phone. A one-tap **Backup / Restore** (Settings) keeps recipes safe across devices.

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
