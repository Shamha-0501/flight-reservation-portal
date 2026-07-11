type BookingFlowSkeletonProps = {
  withStepper?: boolean;
};

export function BookingFlowSkeleton({ withStepper = true }: BookingFlowSkeletonProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_34%),linear-gradient(180deg,#f8fbff_0%,#f8fafc_42%,#ffffff_100%)]">
      {withStepper ? (
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="space-y-4">
              <div className="hidden md:grid md:grid-cols-5 md:gap-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200" />
                    <div className="h-3 w-14 animate-pulse rounded-full bg-slate-200" />
                    <div className="h-4 w-20 animate-pulse rounded-full bg-slate-100" />
                  </div>
                ))}
              </div>

              <div className="md:hidden">
                <div className="h-2 animate-pulse rounded-full bg-slate-200" />
                <div className="mt-4 h-4 w-32 animate-pulse rounded-full bg-slate-200" />
                <div className="mt-2 h-3 w-20 animate-pulse rounded-full bg-slate-100" />
              </div>
            </div>
          </div>
        </header>
      ) : null}

      <div className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_384px]">
          <main className="min-w-0 space-y-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <section
                key={index}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="h-3 w-28 animate-pulse rounded-full bg-slate-200" />
                <div className="mt-4 h-7 w-56 animate-pulse rounded-full bg-slate-200" />
                <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded-full bg-slate-100" />

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
                  <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
                </div>
              </section>
            ))}
          </main>

          <aside className="self-start lg:sticky lg:top-28">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="bg-gradient-to-r from-blue-600 to-sky-500 px-5 py-4">
                <div className="h-3 w-24 animate-pulse rounded-full bg-white/30" />
                <div className="mt-3 h-7 w-40 animate-pulse rounded-full bg-white/25" />
                <div className="mt-2 h-4 w-28 animate-pulse rounded-full bg-white/20" />
                <div className="mt-1 h-4 w-24 animate-pulse rounded-full bg-white/20" />
              </div>

              <div className="p-5">
                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                  <div className="h-3 w-28 animate-pulse rounded-full bg-blue-200" />
                  <div className="mt-2 h-4 w-36 animate-pulse rounded-full bg-blue-100" />
                </div>

                <div className="mt-5 space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between gap-4">
                      <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
                      <div className="h-4 w-20 animate-pulse rounded-full bg-slate-100" />
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl bg-slate-950 px-4 py-4">
                  <div className="h-3 w-12 animate-pulse rounded-full bg-white/20" />
                  <div className="mt-3 h-8 w-32 animate-pulse rounded-full bg-white/15" />
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="h-3 w-full animate-pulse rounded-full bg-slate-200" />
                  <div className="mt-2 h-3 w-4/5 animate-pulse rounded-full bg-slate-100" />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <footer className="sticky bottom-0 z-30 border-t border-slate-200/80 bg-white/95 shadow-[0_-10px_34px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="h-11 w-20 animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
          <div className="hidden h-4 w-52 animate-pulse rounded-full bg-slate-200 sm:block" />
          <div className="h-11 w-28 animate-pulse rounded-xl bg-blue-200" />
        </div>
      </footer>
    </div>
  );
}

export function BookingSectionSkeleton() {
  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4 sm:px-6">
          <div className="h-3 w-28 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-3 h-7 w-44 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded-full bg-slate-100" />
        </div>

        <div className="grid gap-3 p-5 sm:p-6">
          <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4 sm:px-6">
          <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-3 h-5 w-64 animate-pulse rounded-full bg-slate-200" />
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
                <div className="mt-3 h-4 w-32 animate-pulse rounded-full bg-slate-100" />
                <div className="mt-4 h-10 w-full animate-pulse rounded-xl bg-white" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function BookingDetailsSkeleton() {
  return (
    <div className="mt-5 space-y-5">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-[linear-gradient(90deg,rgba(30,64,175,1),rgba(37,99,235,1),rgba(14,165,233,1))] px-6 py-6 text-white">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="h-3 w-24 animate-pulse rounded-full bg-white/25" />
              <div className="h-9 w-64 max-w-full animate-pulse rounded-full bg-white/20" />
              <div className="h-4 w-80 max-w-full animate-pulse rounded-full bg-white/15" />
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4">
              <div className="h-3 w-20 animate-pulse rounded-full bg-white/20" />
              <div className="mt-3 h-8 w-32 animate-pulse rounded-full bg-white/25" />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <section
              key={index}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-5">
                <div className="h-3 w-28 animate-pulse rounded-full bg-slate-200" />
                <div className="mt-3 h-6 w-56 animate-pulse rounded-full bg-slate-200" />
                <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded-full bg-slate-100" />
              </div>

              <div className="space-y-3 px-6 py-5">
                {Array.from({ length: 4 }).map((_, rowIndex) => (
                  <div
                    key={rowIndex}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200" />
                    <div className="h-4 w-36 animate-pulse rounded-full bg-slate-100" />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="space-y-5">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-blue-600 to-sky-500 px-5 py-4">
              <div className="h-3 w-24 animate-pulse rounded-full bg-white/25" />
              <div className="mt-3 h-8 w-40 animate-pulse rounded-full bg-white/20" />
              <div className="mt-2 h-4 w-28 animate-pulse rounded-full bg-white/15" />
            </div>
            <div className="space-y-3 p-5">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                <div className="h-3 w-28 animate-pulse rounded-full bg-blue-200" />
                <div className="mt-2 h-4 w-36 animate-pulse rounded-full bg-blue-100" />
              </div>
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between gap-4">
                  <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-4 w-20 animate-pulse rounded-full bg-slate-100" />
                </div>
              ))}
              <div className="rounded-2xl bg-slate-950 px-4 py-4">
                <div className="h-3 w-12 animate-pulse rounded-full bg-white/20" />
                <div className="mt-3 h-8 w-32 animate-pulse rounded-full bg-white/15" />
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export function BookingInlineSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="h-4 w-48 animate-pulse rounded-full bg-slate-200" />
      <div className="mt-2 h-3 w-72 max-w-full animate-pulse rounded-full bg-slate-100" />
    </div>
  );
}
