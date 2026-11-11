# Access-control foundation (source only)

Migration: 20261111061000_access_foundation.sql. It has NOT been applied or
executed. The SQL integration assertions have NOT been run. Do not describe
these policies as security-tested until they pass against disposable Supabase.
No existing application pages or scheduling files are changed by this increment.

## Permission model
An active Admin manages communities, jobs, memberships and job assignments in
that Admin's division. PJMs can read assigned jobs and their communities only.
PJMs cannot yet edit jobs or schedules. Vendors have no job or community access
until step-specific vendor grants exist. An inactive member cannot read jobs.
Users can read their own membership, including its disabled status, but cannot
promote themselves. Anonymous roles have no grants on these tables.
Composite foreign keys enforce same-division community/job/member assignments.
Private security-definer helpers have an empty search_path, fully qualified
relations and explicitly restricted execution grants. Keep jobsight_private
out of the Supabase exposed API schemas. Helpers intentionally use their
owner's table access to avoid recursive membership policies.

## Bootstrap and deployment
First commit the migration to GitHub, then test it on a disposable LOCAL
Supabase database with auth.users available. Run the SQL test as a local
privileged owner using the command at its top; it creates fictional fixtures
inside a transaction and rolls them back. Never use it against production.
Only after reviewing test results request separate approval to apply this exact
migration to the connected JobSight project. No automatic database deploy exists.
A trusted operator must bootstrap the first division and Admin membership for
an existing, verified Auth user. No browser self-promotion or automatic Admin
signup is provided. Never commit credentials or use a service-role client for
ordinary user requests. Subsequent Auth user creation must be an Admin-only
server operation; membership management alone does not create Auth accounts.

## Remaining work and limitations
No login UI, SSR client, session refresh proxy, user provisioning, generated
database types, schedules, audit log, storage or Auth configuration is included.
Membership writes are Admin-only but have no last-Admin protection yet.
The revision field is reserved; no concurrency or audit mechanism uses it yet.
Division timezone validation and construction lifecycle invariants need further
validation. Current SQL tests cover representative access paths, not the full
acceptance matrix: cross-division mutation, grants, helper permissions, all
INSERT/DELETE paths and vendor step access need expanded coverage.
Existing CI executes JavaScript scheduling tests and attempts Next.js checks;
it does not yet start Supabase or execute these SQL assertions. CI/build status
for the existing branch is still unverified. No merge or deployment occurred.
