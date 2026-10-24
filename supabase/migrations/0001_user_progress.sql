-- Matura Quest – cloud sync of player progress (Supabase / PostgreSQL)
--
-- Model: one row per user holding the app's progress snapshot (JSON), with a
-- revision number for optimistic concurrency. Clients never write the table
-- directly; they call save_progress(), which only succeeds when the client
-- saw the latest revision. A stale device gets a 'conflict' error and the app
-- asks the player which progress to keep (or merges) – nothing is silently
-- overwritten.
--
-- Apply: Supabase Dashboard → SQL Editor → paste & run, or `supabase db push`.

create table if not exists public.user_progress (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  state          jsonb not null,
  schema_version integer not null default 1,
  xp             integer not null default 0 check (xp >= 0),
  revision       bigint not null default 1,
  device_id      text,
  updated_at     timestamptz not null default now(),
  constraint state_size check (octet_length(state::text) < 3000000)
);

alter table public.user_progress enable row level security;

-- Players can read and delete only their own row.
drop policy if exists "read own progress" on public.user_progress;
create policy "read own progress" on public.user_progress
  for select using (auth.uid() = user_id);

drop policy if exists "delete own progress" on public.user_progress;
create policy "delete own progress" on public.user_progress
  for delete using (auth.uid() = user_id);

-- No insert/update policy: writes go only through save_progress().
revoke insert, update on public.user_progress from anon, authenticated;

-- Atomic compare-and-set save.
--   p_expected_revision = 0  → first save (fails if a row already exists)
--   p_expected_revision = n  → succeeds only if the stored revision is n
create or replace function public.save_progress(
  p_state jsonb,
  p_expected_revision bigint,
  p_device text default null
)
returns table (revision bigint, updated_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  uid uuid := auth.uid();
  cur bigint;
  new_xp integer := greatest(0, coalesce((p_state->>'xp')::integer, 0));
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if jsonb_typeof(p_state) <> 'object' then
    raise exception 'invalid state' using errcode = '22023';
  end if;

  select up.revision into cur from user_progress up where up.user_id = uid for update;

  if cur is null then
    if p_expected_revision <> 0 then
      raise exception 'conflict' using errcode = 'P0001', detail = 'no remote row';
    end if;
    insert into user_progress (user_id, state, schema_version, xp, revision, device_id)
    values (uid, p_state, coalesce((p_state->>'schemaVersion')::integer, 1), new_xp, 1, p_device);
    return query select 1::bigint, now();
  else
    if cur <> p_expected_revision then
      raise exception 'conflict' using errcode = 'P0001', detail = format('remote revision %s', cur);
    end if;
    update user_progress up
       set state = p_state,
           schema_version = coalesce((p_state->>'schemaVersion')::integer, 1),
           xp = new_xp,
           revision = cur + 1,
           device_id = p_device,
           updated_at = now()
     where up.user_id = uid;
    return query select cur + 1, now();
  end if;
end;
$$;

revoke all on function public.save_progress(jsonb, bigint, text) from public, anon;
grant execute on function public.save_progress(jsonb, bigint, text) to authenticated;
grant select, delete on public.user_progress to authenticated;
