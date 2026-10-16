-- Run once in the Supabase SQL editor after the project is restored.
-- Safe to re-run. Adds a single row that GitHub Actions updates on a schedule.
-- Does not touch vaults or recipes.

create table if not exists public.keepalive (
  id        int primary key,
  last_ping timestamptz not null default now()
);

insert into public.keepalive (id) values (1) on conflict (id) do nothing;

alter table public.keepalive enable row level security;
revoke all on public.keepalive from anon, authenticated;

create or replace function public.rv_keepalive()
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_at timestamptz := now();
begin
  insert into public.keepalive (id, last_ping)
  values (1, v_at)
  on conflict (id) do update set last_ping = excluded.last_ping;
  return v_at;
end;
$$;

revoke all on function public.rv_keepalive() from public;
grant execute on function public.rv_keepalive() to anon;
