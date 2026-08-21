-- ============================================================
-- Scout Leader App — Supabase init migration
-- Run in: Supabase Dashboard > SQL Editor > New query
-- Model: ALL access goes through your Replit server using the
--        SERVICE_ROLE key. Anon/authenticated get ZERO direct
--        access (RLS deny-by-default + explicit revokes).
-- ============================================================

create extension if not exists pg_cron;

-- ------------------------------------------------------------
-- 1. Tables
-- ------------------------------------------------------------

create table public.events (
  id         text primary key,
  name       text not null,
  name_en    text,
  unit       text,
  event_date text not null,
  helpers    integer not null default 4 check (helpers between 1 and 20),
  created_at timestamptz not null default now()
);

create table public.submissions (
  id                   uuid primary key default gen_random_uuid(),
  reference            text generated always as (upper(left(id::text, 8))) stored,
  user_id              uuid references auth.users (id) on delete set null,
  full_name            text not null,
  gender               text,
  unit                 text not null,
  years_exp            integer not null check (years_exp >= 0),
  is_senior            boolean not null default false,
  target_ic_count      integer not null default 2 check (target_ic_count between 1 and 5),
  skills               text[] not null default '{}',
  preferred_ic_events  text[] not null default '{}',
  helper_events        text[] not null default '{}',
  preferred_partners   text[] not null default '{}',
  notes                text not null default '',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index idx_submissions_created_at on public.submissions (created_at desc);
create index idx_submissions_user_id    on public.submissions (user_id);
create index idx_submissions_unit       on public.submissions (unit);

-- ------------------------------------------------------------
-- 2. Lock down: enable RLS + FORCE it (even table owner obeys)
-- ------------------------------------------------------------

alter table public.events      enable row level security;
alter table public.events      force  row level security;
alter table public.submissions enable row level security;
alter table public.submissions force  row level security;

-- Remove Supabase's default grants so anon/authenticated have no
-- direct table privileges at all (service_role keeps its own).
revoke all on public.events      from anon, authenticated;
revoke all on public.submissions from anon, authenticated;
revoke usage on schema public    from anon;

-- ------------------------------------------------------------
-- 3. Policies (intentionally NONE for anon = default deny).
--    Uncomment when leaders get login accounts (Supabase Auth),
--    enabling them to view/update only their own submission:
--
-- create policy "own_submission_select"
--   on public.submissions for select to authenticated
--   using (auth.uid() = user_id);
-- create policy "own_submission_update"
--   on public.submissions for update to authenticated
--   using (auth.uid() = user_id)
--   with check (auth.uid() = user_id);
-- ------------------------------------------------------------
-- (no policies created yet)

-- ------------------------------------------------------------
-- 4. updated_at trigger
-- ------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_submissions_touch
  before update on public.submissions
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- 5. PDPO retention: purge submissions after 180 days
--    (makes the privacy-policy claim in your chatbot true)
-- ------------------------------------------------------------

select cron.schedule(
  'purge_submissions_after_180d',
  '17 3 * * *',
  $$delete from public.submissions where created_at < now() - interval '180 days'$$
);

-- ------------------------------------------------------------
-- 6. Verify after running:
--    a) both tables must show rls_enabled = true, force_rls = true
--    b) policy_count = 0
--    c) anon REST probe must return empty error, never data
-- ------------------------------------------------------------

select c.relname,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as force_rls,
       count(p.policyname) as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p on p.schemaname = n.nspname and p.tablename = c.relname
where n.nspname = 'public' and c.relkind = 'table'
group by c.relname, c.relrowsecurity, c.relforcerowsecurity
order by c.relname;
