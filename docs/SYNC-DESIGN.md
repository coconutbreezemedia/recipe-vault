# Recipe Vault — Cloud Sync Design (Approach A: Vault-Key Sync)

> Approved by Juli 2026-07-22. Supabase-backed sync + public sharing for a local-first static PWA.

## Goals
- Backup + multi-device sync of recipes, meal plan, grocery list. IndexedDB stays source of truth; app never blocks on network.
- No accounts: a generated high-entropy **vault key** links devices. Key stored per-device (IndexedDB) = "stays logged in".
- Sharing: per-recipe public read-only page at `https://recipevault.coconutbreeze.app/share/#<id>`.
- Free tier friendly: photos capped ~300KB each, stored inside recipe JSONB.

## Supabase schema (see `supabase/migration.sql`)
- `vaults(id uuid pk, key_hash text, created_at)`
- `synced_records(vault_id, kind text check in ('recipe','plan','grocery'), local_id text, data jsonb, updated_at timestamptz, deleted bool, pk (vault_id, kind, local_id))`
- `public_recipes` view: recipes where `data->>'shared' = 'true'` and not deleted, exposing only id + data.
- RLS: all direct access denied to `anon`. Access only via SECURITY DEFINER RPCs:
  - `rv_create_vault(key text) -> uuid`
  - `rv_auth(key)` (internal) — vault lookup via `key_hash = crypt(key, key_hash)` (pgcrypto).
  - `rv_push(key text, changes jsonb) -> timestamptz` — upsert batch, LWW on `updated_at`.
  - `rv_pull(key text, since timestamptz) -> jsonb` — records changed since cursor.
  - `rv_get_public_recipe(recipe_id text) -> jsonb` — via view semantics, no key.

## Client
- `lib/sync.ts`: enableSync (generate key: 8 words from EFF-style wordlist), linkDevice(key), pushDebounced (2s after any store mutation), pullOnOpen, status events. Cursor + key persisted in IndexedDB meta store.
- Conflict: last-write-wins per record on `updated_at` (client stamps on save).
- Offline: failed push keeps dirty flags; retried next open/online event.
- Config: `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Vercel Supabase integration injects; fallback constants in `lib/supa-config.ts` for GitHub Pages build).
- Settings UI: Cloud Sync card — enable / show-key-once / enter-key-to-link / status / disable (forgets key locally only).
- Recipe detail: Share toggle → sets `shared` flag (syncs), copies share URL.
- `app/share/page.tsx`: static route; reads `#<recipeId>`, fetches via `rv_get_public_recipe`, renders read-only (no PIN gate, no tabs).

## Testing
Staging schema on Supabase project `sdrcuangazrfpppsldkg` (Coconut Create). Two vault keys, two browser contexts: create→link→bidirectional edit→offline edit→delete propagation→share page. Production migration applied to `cbm-supa-base` via SQL editor (Juli) or provided credentials.
