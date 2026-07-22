-- Recipe Vault — Supabase migration
-- Idempotent, RLS deny-all, SECURITY DEFINER RPCs

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.vaults (
  id         uuid primary key default gen_random_uuid(),
  key_hash   text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.synced_records (
  vault_id   uuid not null references public.vaults(id) on delete cascade,
  kind       text not null check (kind in ('recipe','plan','grocery')),
  local_id   text not null,
  data       jsonb not null,
  updated_at timestamptz not null,
  deleted    boolean not null default false,
  primary key (vault_id, kind, local_id)
);

create index if not exists idx_synced_records_vault_updated
  on public.synced_records (vault_id, updated_at);

create index if not exists idx_synced_records_recipe_shared
  on public.synced_records (local_id)
  where kind = 'recipe' and not deleted and data->>'shared' = 'true';

-- ---------------------------------------------------------------------------
-- RLS: deny-all for direct table access
-- ---------------------------------------------------------------------------

alter table public.vaults enable row level security;
alter table public.synced_records enable row level security;

revoke all on public.vaults from anon, authenticated;
revoke all on public.synced_records from anon, authenticated;

-- ---------------------------------------------------------------------------
-- View: public_recipes (id + data only)
-- ---------------------------------------------------------------------------

create or replace view public.public_recipes as
  select local_id as id, data
  from public.synced_records
  where kind = 'recipe'
    and not deleted
    and data->>'shared' = 'true';

-- ---------------------------------------------------------------------------
-- Functions
-- ---------------------------------------------------------------------------

-- rv_create_vault ----------------------------------------------------------
create or replace function public.rv_create_vault(p_key text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
begin
  if p_key is null or length(p_key) < 20 then
    raise exception 'invalid key';
  end if;

  insert into public.vaults (key_hash)
  values (crypt(p_key, gen_salt('bf')))
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.rv_create_vault(text) to anon;

-- rv_push ------------------------------------------------------------------
create or replace function public.rv_push(p_key text, p_changes jsonb)
returns timestamptz
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_vault public.vaults%rowtype;
  rec jsonb;
begin
  if p_key is null then
    raise exception 'invalid key';
  end if;

  select * into v_vault from public.vaults where key_hash = crypt(p_key, key_hash);
  if not found then
    raise exception 'invalid key';
  end if;

  if jsonb_typeof(p_changes) = 'array' then
    for rec in select * from jsonb_array_elements(p_changes)
    loop
      insert into public.synced_records (vault_id, kind, local_id, data, updated_at, deleted)
      values (
        v_vault.id,
        rec->>'kind',
        rec->>'local_id',
        coalesce(rec->'data', '{}'::jsonb),
        coalesce((rec->>'updated_at')::timestamptz, now()),
        coalesce((rec->>'deleted')::boolean, false)
      )
      on conflict (vault_id, kind, local_id)
      do update
        set data       = excluded.data,
            updated_at = excluded.updated_at,
            deleted    = excluded.deleted
        where excluded.updated_at >= public.synced_records.updated_at;
    end loop;
  end if;

  return now();
end;
$$;

grant execute on function public.rv_push(text, jsonb) to anon;

-- rv_pull ------------------------------------------------------------------
create or replace function public.rv_pull(p_key text, p_since timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_vault public.vaults%rowtype;
  v_records jsonb;
  v_cursor timestamptz := now();
begin
  if p_key is null then
    raise exception 'invalid key';
  end if;

  select * into v_vault from public.vaults where key_hash = crypt(p_key, key_hash);
  if not found then
    raise exception 'invalid key';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'kind',       kind,
    'local_id',   local_id,
    'data',       data,
    'updated_at', to_jsonb(updated_at),
    'deleted',    deleted
  )), '[]'::jsonb) into v_records
  from public.synced_records
  where vault_id = v_vault.id
    and updated_at > coalesce(p_since, '-infinity'::timestamptz);

  return jsonb_build_object('cursor', to_jsonb(v_cursor), 'records', v_records);
end;
$$;

grant execute on function public.rv_pull(text, timestamptz) to anon;

-- rv_get_public_recipe -----------------------------------------------------
create or replace function public.rv_get_public_recipe(p_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_data jsonb;
begin
  select data into v_data
  from public.synced_records
  where kind = 'recipe'
    and local_id = p_id
    and not deleted
    and data->>'shared' = 'true'
  limit 1;

  return v_data;
end;
$$;

grant execute on function public.rv_get_public_recipe(text) to anon;

-- Clients use rv_get_public_recipe; no direct view access needed.
revoke all on public.public_recipes from anon, authenticated;
