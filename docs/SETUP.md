# JobSight initial scaffold

Source repository: murf9413/BuildSoft. Product: JobSight.

## Local development
Use Node.js 22 and npm. Run `npm install`, then `npm run dev`.
Run `npm run typecheck` and `npm run build` before deployment.
Review resolved dependencies and security advisories. Generate and commit a
package-lock.json after successful installation; this environment did not
install dependencies or execute the application build.

## Scope
This commit adds only the Next.js, React, TypeScript and Tailwind shell,
environment examples, and this setup document. Existing README is preserved.
No Auth, Supabase client, database schema, RLS, Storage, scheduling engine,
calendar, tests, CI, PWA, reporting, or deployment configuration is included.
No feature should be described as production ready or execution-verified.
Environment examples contain no credentials and are not consumed yet.
Never expose service-role keys through NEXT_PUBLIC_ variables.

## Deployment
After a successful local build, a Vercel project may use the Next.js preset.
No Vercel project or automated deployment has been configured. The source
can also be built with npm run build and served with npm start on a compatible
Node host. Production hosting requires separate security and configuration review.

## Next increment
Add the separately prepared scheduling engine, automated tests and CI. Then
implement versioned database migrations, authentication, database-enforced
job access, and transactional schedule persistence. DUC sign/color semantics
remain unresolved and must be confirmed before production.
