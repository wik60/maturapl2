-- Matura Quest – cloud persistence schema (Supabase / PostgreSQL)
-- STATUS: prepared, NOT yet applied or tested. The current app stores progress
-- locally (localStorage). This migration is the documented path to accounts
-- and cross-device sync. Apply with `supabase db push` once a project exists.

create extension if not exists pgcrypto;

-- One row per user; mirrors AppState's scalar fields.
create table if not exists public.profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 24),
  time_zone    text not null default 'Europe/Warsaw',
  xp           integer not null default 0 check (xp >= 0),
  coins        integer not null default 0 check (coins >= 0),
  settings     jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now()
);

-- Every scored answer (practice, map, diagnostic, exam). Content stays in the app bundle;
-- item/group ids + content_version identify it.
create table if not exists public.attempts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  item_id         text not null,
  group_id        text not null,
  format          text not null,
  skill           text not null,
  section         text not null,
  tag             text,
  given           text not null default '',
  verdict         text not null check (verdict in ('correct','incorrect','unanswered')),
  mode            text not null check (mode in ('practice','map','mistakes','diagnostic','exam','transcript')),
  session_id      text not null,
  content_version integer not null,
  created_at      timestamptz not null default now(),
  unique (user_id, session_id, item_id)        -- idempotent re-submission
);
create index if not exists attempts_user_time on public.attempts (user_id, created_at desc);
create index if not exists attempts_user_skill on public.attempts (user_id, skill);

-- Idempotent reward ledger: the same key can only pay once per user.
create table if not exists public.reward_ledger (
  user_id    uuid not null references auth.users(id) on delete cascade,
  key        text not null,
  xp         integer not null check (xp >= 0),
  created_at timestamptz not null default now(),
  primary key (user_id, key)
);

create table if not exists public.mistakes (
  user_id    uuid not null references auth.users(id) on delete cascade,
  item_id    text not null,
  group_id   text not null,
  skill      text not null,
  last_given text not null default '',
  count      integer not null default 1,
  mastered   boolean not null default false,
  card       jsonb not null,               -- SM-2 state {ease, interval, reps, lapses, due}
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create table if not exists public.vocab_progress (
  user_id    uuid not null references auth.users(id) on delete cascade,
  vocab_id   text not null,
  card       jsonb not null,
  known      boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, vocab_id)
);

create table if not exists public.level_progress (
  user_id      uuid not null references auth.users(id) on delete cascade,
  level_id     text not null,
  best         real not null default 0,
  attempts     integer not null default 0,
  completed_at timestamptz,
  mastered_at  timestamptz,
  primary key (user_id, level_id)
);

create table if not exists public.daily_activity (
  user_id  uuid not null references auth.users(id) on delete cascade,
  day      date not null,               -- in the user's time zone
  items    integer not null default 0,
  sessions integer not null default 0,
  vocab    integer not null default 0,
  primary key (user_id, day)
);

create table if not exists public.user_achievements (
  user_id        uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null,
  earned_at      timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table if not exists public.exam_sessions (
  id              text primary key,
  user_id         uuid not null references auth.users(id) on delete cascade,
  blueprint_id    text not null,
  assembled       jsonb not null,
  answers         jsonb not null default '{}'::jsonb,
  writing         jsonb not null default '{}'::jsonb,
  started_at      timestamptz not null,
  deadline        timestamptz not null,
  submitted_at    timestamptz,
  result          jsonb,
  content_version integer not null
);
create index if not exists exam_sessions_user on public.exam_sessions (user_id, started_at desc);

create table if not exists public.writing_submissions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  prompt_id  text not null,
  text       text not null check (char_length(text) <= 5000),
  words      integer not null,
  estimate   integer not null check (estimate between 0 and 12),
  criteria   jsonb not null,
  created_at timestamptz not null default now()
);

-- Row Level Security: every table is private to its owner.
do $$
declare t text;
begin
  foreach t in array array['profiles','attempts','reward_ledger','mistakes','vocab_progress','level_progress',
                           'daily_activity','user_achievements','exam_sessions','writing_submissions']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists own_rows on public.%I', t);
    execute format('create policy own_rows on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;
end $$;

-- XP must only change through the ledger: clients cannot write profiles.xp directly.
revoke update (xp, coins) on public.profiles from authenticated;

create or replace function public.grant_reward(p_key text, p_xp integer)
returns integer language plpgsql security definer set search_path = public as $$
declare inserted integer;
begin
  if p_xp < 0 or p_xp > 200 then raise exception 'invalid reward'; end if;
  insert into reward_ledger(user_id, key, xp) values (auth.uid(), p_key, p_xp)
  on conflict do nothing;
  get diagnostics inserted = row_count;
  if inserted = 1 then
    update profiles set xp = xp + p_xp, coins = coins + (p_xp / 10), updated_at = now() where user_id = auth.uid();
    return p_xp;
  end if;
  return 0;
end $$;
grant execute on function public.grant_reward(text, integer) to authenticated;
