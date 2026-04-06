export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="h-48 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800" />
      <div className="mx-auto max-w-6xl px-6 -mt-16">
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="h-6 w-40 rounded bg-slate-200 animate-pulse" />
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            <div className="h-64 rounded bg-slate-100 animate-pulse" />
            <div className="space-y-3">
              <div className="h-20 rounded bg-slate-100 animate-pulse" />
              <div className="h-20 rounded bg-slate-100 animate-pulse" />
              <div className="h-20 rounded bg-slate-100 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
