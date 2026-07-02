import Link from "next/link";

export default function AgencyLandingPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,116,144,0.16),transparent_30%),linear-gradient(180deg,#eef7ff_0%,#f8fbff_42%,#ffffff_100%)]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-sky-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
          <div className="grid gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:px-10 lg:py-12">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">
                Agent Workspace
              </div>
              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950">
                Run your travel agency from a tenant-aware booking workspace
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Create a pending agency workspace, assign tenant owners and tenant admins,
                manage bookings and cancellations, and unlock access after platform approval.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/agency/register"
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-sky-600 px-5 text-sm font-bold text-white shadow-[0_14px_34px_rgba(2,132,199,0.22)] transition hover:bg-sky-700"
                >
                  Register as an Agent
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Login
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              <InfoCard
                title="Approval-aware onboarding"
                text="New agencies stay pending until an admin, super admin, or system developer activates the workspace."
              />
              <InfoCard
                title="Role-based dashboard access"
                text="Customers stay in booking views, while tenant and platform roles reach the appropriate admin workspace."
              />
              <InfoCard
                title="Tenant-level operations"
                text="Manage bookings, cancellations, reports, and user access for your own agency records."
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
      <div className="text-lg font-extrabold text-slate-950">{title}</div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}
