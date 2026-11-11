export default function Home() {
  return <main className="mx-auto max-w-5xl p-6 md:p-12">
    <p className="text-xs uppercase tracking-widest text-slate-500">Residential construction operations</p>
    <h1 className="mt-2 text-4xl font-semibold">JobSight</h1>
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-semibold">Development foundation</h2>
      <p className="mt-3 text-slate-600">The application shell is being established. Authentication, job access, schedules and persistence are not connected yet.</p>
      <p className="mt-3 rounded bg-amber-50 p-3 text-sm text-amber-900">Not production ready. Do not enter real construction or vendor information.</p>
    </section>
  </main>;
}
