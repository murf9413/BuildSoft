-- LOCAL disposable Supabase database only. All fixtures are rolled back.
-- Run after the migration: psql "$LOCAL_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/access.sql
begin;
select set_config('test.division', gen_random_uuid()::text, true);
select set_config('test.other_division', gen_random_uuid()::text, true);
select set_config('test.admin', gen_random_uuid()::text, true);
select set_config('test.pjm', gen_random_uuid()::text, true);
select set_config('test.vendor', gen_random_uuid()::text, true);
select set_config('test.community', gen_random_uuid()::text, true);
select set_config('test.other_community', gen_random_uuid()::text, true);
select set_config('test.job', gen_random_uuid()::text, true);
insert into auth.users(id) values (current_setting('test.admin')::uuid), (current_setting('test.pjm')::uuid), (current_setting('test.vendor')::uuid);
insert into public.divisions(id, name) values (current_setting('test.division')::uuid, 'Fictional North'), (current_setting('test.other_division')::uuid, 'Fictional South');
insert into public.division_memberships(division_id, user_id, role) values
  (current_setting('test.division')::uuid, current_setting('test.admin')::uuid, 'admin'),
  (current_setting('test.division')::uuid, current_setting('test.pjm')::uuid, 'pjm'),
  (current_setting('test.division')::uuid, current_setting('test.vendor')::uuid, 'vendor');
insert into public.communities(id, division_id, name) values
  (current_setting('test.community')::uuid, current_setting('test.division')::uuid, 'Cedar Hollow'),
  (current_setting('test.other_community')::uuid, current_setting('test.other_division')::uuid, 'Maple Ridge');
insert into public.jobs(id, division_id, community_id, lot_number) values
  (current_setting('test.job')::uuid, current_setting('test.division')::uuid, current_setting('test.community')::uuid, '104');
insert into public.jobs(division_id, community_id, lot_number) values
  (current_setting('test.division')::uuid, current_setting('test.community')::uuid, '105'),
  (current_setting('test.other_division')::uuid, current_setting('test.other_community')::uuid, '201');
insert into public.job_assignments(division_id, job_id, user_id) values
  (current_setting('test.division')::uuid, current_setting('test.job')::uuid, current_setting('test.pjm')::uuid);

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.admin'), true);
do $$ begin
  if (select count(*) from public.jobs) <> 2 then raise exception 'Admin division isolation failed'; end if;
  if (select count(*) from public.division_memberships) <> 3 then raise exception 'Admin membership visibility failed'; end if;
end $$;
select set_config('request.jwt.claim.sub', current_setting('test.pjm'), true);
do $$ declare affected integer; begin
  if (select count(*) from public.jobs) <> 1 then raise exception 'PJM job isolation failed'; end if;
  if (select count(*) from public.division_memberships) <> 1 then raise exception 'Membership privacy failed'; end if;
  if (select count(*) from public.communities) <> 1 then raise exception 'Community isolation failed'; end if;
  update public.division_memberships set role = 'admin' where user_id = (select auth.uid());
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Privilege escalation allowed'; end if;
  update public.jobs set lot_number = 'UNAUTHORIZED';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Unauthorized PJM job write allowed'; end if;
end $$;
select set_config('request.jwt.claim.sub', current_setting('test.vendor'), true);
do $$ begin
  if exists (select 1 from public.jobs) then raise exception 'Vendor job access must remain denied'; end if;
  if exists (select 1 from public.communities) then raise exception 'Vendor community access must remain denied'; end if;
end $$;
reset role;
update public.division_memberships set active = false where user_id = current_setting('test.pjm')::uuid;
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.pjm'), true);
do $$ begin
  if exists (select 1 from public.jobs) then raise exception 'Inactive user retained job access'; end if;
end $$;
reset role;
set local role anon;
do $$ begin
  begin
    perform 1 from public.jobs;
    raise exception 'Anonymous SELECT was allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
rollback;
