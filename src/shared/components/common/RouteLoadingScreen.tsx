type RouteLoadingScreenProps = {
  title: string;
  description?: string;
  variant?: "default" | "compact" | "dashboard";
};

export function RouteLoadingScreen({
  title,
  description,
  variant = "default",
}: RouteLoadingScreenProps) {
  const shellClass =
    variant === "dashboard"
      ? "mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 lg:py-8"
      : "mx-auto w-full max-w-screen-xl px-4 py-6 sm:px-6 lg:py-8";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_34%),linear-gradient(180deg,#f8fbff_0%,#f8fafc_45%,#ffffff_100%)]">
      <div className={shellClass}>
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-800 p-6 text-white sm:p-8">
            <div className="max-w-3xl space-y-3">
              <div className="h-3 w-20 animate-pulse rounded-full bg-white/20" />
              <div className="h-9 w-2/3 animate-pulse rounded-2xl bg-white/15" />
              {description ? <div className="h-4 w-4/5 animate-pulse rounded-full bg-white/15" /> : null}
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: variant === "compact" ? 2 : 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="h-3 w-20 animate-pulse rounded-full bg-slate-200" />
              <div className="mt-4 h-8 w-24 animate-pulse rounded-2xl bg-slate-200" />
              <div className="mt-3 h-4 w-3/4 animate-pulse rounded-full bg-slate-100" />
            </div>
          ))}
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="h-6 w-48 animate-pulse rounded-full bg-slate-200" />
            <div className="h-11 w-full max-w-sm animate-pulse rounded-xl bg-slate-100" />
          </div>

          <div className="mt-5 space-y-3">
            {Array.from({ length: variant === "compact" ? 2 : 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200" />
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div className="h-10 animate-pulse rounded-xl bg-white" />
                  <div className="h-10 animate-pulse rounded-xl bg-white" />
                  <div className="h-10 animate-pulse rounded-xl bg-white" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
