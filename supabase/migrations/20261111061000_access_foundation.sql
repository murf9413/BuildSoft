-- Initial access foundation. No users, credentials or production data are created.
create schema if not exists jobsight_private;
revoke all on schema jobsight_private from public, anon;
grant usage on schema jobsight_private to authenticated;

create table public.divisions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  timezone text not null default 'America/New_York',
  day_count_mode text not null default 'calendar' check (day_count_mode in ('calendar', 'working')),
  created_at timestamptz not null default now()
);
create table public.division_memberships (
  division_id uuid not null references public.divisions(id),
  user_id uuid not null references auth.users(id),
  role text not null check (role in ('admin', 'pjm', 'vendor')),
  active boolean not null default true,
  primary key (division_id, user_id)
);
create table public.communities (
  id uuid primary key default gen_random_uuid(),
  division_id uuid not null references public.divisions(id),
  name text not null check (length(trim(name)) between 1 and 120),
  unique (division_id, id),
  unique (division_id, name)
);
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  division_id uuid not null,
  community_id uuid not null,
  lot_number text not null check (length(trim(lot_number)) between 1 and 40),
  street_address text not null default '',
  permit_number text not null default '',
  construction_status text not null default 'planned' check (construction_status in ('planned', 'active', 'complete')),
  construction_start date,
  completed_on date,
  allowed_days integer check (allowed_days between 0 and 36525),
  revision bigint not null default 0 check (revision >= 0),
  unique (division_id, id),
  unique (community_id, lot_number),
  foreign key (division_id, community_id) references public.communities(division_id, id),
  check (completed_on is null or (construction_start is not null and completed_on >= construction_start))
);
create table public.job_assignments (
  division_id uuid not null,
  job_id uuid not null,
  user_id uuid not null,
  primary key (job_id, user_id),
  foreign key (division_id, job_id) references public.jobs(division_id, id),
  foreign key (division_id, user_id) references public.division_memberships(division_id, user_id)
);
create index memberships_user_idx on public.division_memberships(user_id, division_id);
create index jobs_community_idx on public.jobs(division_id, community_id);
create index assignments_user_idx on public.job_assignments(user_id, division_id, job_id);

create function jobsight_private.is_admin(division uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.division_memberships m
    where m.division_id = division and m.user_id = (select auth.uid()) and m.role = 'admin' and m.active);
$$;
create function jobsight_private.can_read_job(division uuid, job uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select jobsight_private.is_admin(division) or exists (
    select 1 from public.job_assignments a join public.division_memberships m
      on m.division_id = a.division_id and m.user_id = a.user_id
    where a.division_id = division and a.job_id = job and a.user_id = (select auth.uid())
      and m.role = 'pjm' and m.active);
$$;
create function jobsight_private.can_read_community(division uuid, community uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select jobsight_private.is_admin(division) or exists (
    select 1 from public.jobs j where j.division_id = division and j.community_id = community
      and jobsight_private.can_read_job(division, j.id));
$$;
revoke all on function jobsight_private.is_admin(uuid) from public, anon;
revoke all on function jobsight_private.can_read_job(uuid, uuid) from public, anon;
revoke all on function jobsight_private.can_read_community(uuid, uuid) from public, anon;
grant execute on function jobsight_private.is_admin(uuid), jobsight_private.can_read_job(uuid, uuid), jobsight_private.can_read_community(uuid, uuid) to authenticated;

alter table public.divisions enable row level security;
alter table public.division_memberships enable row level security;
alter table public.communities enable row level security;
alter table public.jobs enable row level security;
alter table public.job_assignments enable row level security;
revoke all on public.divisions, public.division_memberships, public.communities, public.jobs, public.job_assignments from public, anon, authenticated;
grant select, update on public.divisions to authenticated;
grant select, insert, update, delete on public.division_memberships, public.communities, public.jobs, public.job_assignments to authenticated;
grant all on public.divisions, public.division_memberships, public.communities, public.jobs, public.job_assignments to service_role;

create policy divisions_read on public.divisions for select to authenticated using (
  exists (select 1 from public.division_memberships m where m.division_id = id and m.user_id = (select auth.uid()) and m.active)
);
create policy divisions_update on public.divisions for update to authenticated
  using (jobsight_private.is_admin(id)) with check (jobsight_private.is_admin(id));
create policy memberships_read on public.division_memberships for select to authenticated
  using (user_id = (select auth.uid()) or jobsight_private.is_admin(division_id));
create policy memberships_admin on public.division_memberships for all to authenticated
  using (jobsight_private.is_admin(division_id)) with check (jobsight_private.is_admin(division_id));
create policy communities_read on public.communities for select to authenticated
  using (jobsight_private.can_read_community(division_id, id));
create policy communities_admin on public.communities for all to authenticated
  using (jobsight_private.is_admin(division_id)) with check (jobsight_private.is_admin(division_id));
create policy jobs_read on public.jobs for select to authenticated
  using (jobsight_private.can_read_job(division_id, id));
create policy jobs_admin on public.jobs for all to authenticated
  using (jobsight_private.is_admin(division_id)) with check (jobsight_private.is_admin(division_id));
create policy assignments_read on public.job_assignments for select to authenticated
  using (user_id = (select auth.uid()) and jobsight_private.can_read_job(division_id, job_id));
create policy assignments_admin on public.job_assignments for all to authenticated
  using (jobsight_private.is_admin(division_id)) with check (jobsight_private.is_admin(division_id));
