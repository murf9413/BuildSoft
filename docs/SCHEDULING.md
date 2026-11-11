# Scheduling increment 1

Pure scheduling proposals; no UI wiring, persistence, authorization or autosave.
The dependency-free ESM runtime has a TypeScript declaration interface. Node's
built-in test runner executes the actual runtime without package installation.
Run `npm test`. The application remains React/TypeScript.

Dates use UTC date-only arithmetic. Counts include both endpoints. Working-day
mode excludes Saturday, Sunday and supplied holiday dates. Callers must supply
division-local today when computing active-job actual days. Finish dates use
inclusive working-day duration. Nonworking starts are accepted; UI holiday
warnings and explicit override behavior remain to be built.

Following means input/list order, not dependency descendants. Selected means
explicit IDs including the moved step. Every candidate move is immutable and
validated before return; any locked-step movement or broken dependency rejects
the entire proposal. There is no lock override or general dependency solver.
Dependencies currently constrain start-to-start dates exactly: same, next or
previous working day. Completed-step rules and finish-to-start links are pending.

DUC is allowed minus actual. Negative is green, zero neutral, positive red as
requested. This conflicts with ahead/behind semantics; production is blocked
until the product decision is confirmed. Building averages are not implemented.

CI runs domain tests independently of installation and also attempts application
typecheck/build. No CI result or full application build has been verified here.
Application dependencies remain unlocked; generate, review and commit the lockfile
and switch application installation to npm ci before release. SETUP.md describes
the earlier scaffold; this increment adds tests and CI beyond that initial scope.

Supabase schema, Auth, RLS, document access, vendor workflows, FullCalendar,
transactional saves, concurrency controls and deployment remain unimplemented.
