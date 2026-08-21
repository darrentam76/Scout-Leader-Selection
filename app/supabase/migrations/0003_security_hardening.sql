-- 0003_security_hardening.sql
-- Fixes: retention cron targeted the wrong table (public.submissions).
-- Adds: audit_log table + trigger on leaders_preferences, plus its own purge job.

-- 1) Re-point the 180-day retention job at the real data table.
-- cron.unschedule errors if the job does not exist, so guard both calls.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'purge_submissions_after_180d') then
    perform cron.unschedule('purge_submissions_after_180d');
  end if;
end $$;

select cron.schedule(
  'purge_leaders_preferences_after_180d',
  '17 3 * * *',
  $$delete from public.leaders_preferences where created_at < now() - interval '180 days'$$
);

-- 2) Audit log for leaders_preferences (insert / update / delete).
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  action text not null,
  table_name text not null,
  row_id uuid,
  row_data jsonb,
  acted_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;
alter table public.audit_log force row level security;

revoke all on public.audit_log from anon, authenticated;

create or replace function public.audit_leaders_preferences()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log (action, table_name, row_id, row_data)
  values (
    tg_op,
    tg_table_name,
    case when tg_op = 'DELETE' then old.id else new.id end,
    case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists audit_leaders_preferences_trigger on public.leaders_preferences;
create trigger audit_leaders_preferences_trigger
after insert or update or delete on public.leaders_preferences
for each row execute function public.audit_leaders_preferences();

-- 3) Purge audit entries after 180 days as well.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'purge_audit_log_after_180d') then
    perform cron.unschedule('purge_audit_log_after_180d');
  end if;
end $$;

select cron.schedule(
  'purge_audit_log_after_180d',
  '23 3 * * *',
  $$delete from public.audit_log where acted_at < now() - interval '180 days'$$
);
