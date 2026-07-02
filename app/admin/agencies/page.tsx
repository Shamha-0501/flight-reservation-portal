import { agencies } from "@/src/shared/components/admin/adminData";
import { AdminButton, AdminPage, StatusBadge, SurfaceCard } from "@/src/shared/components/admin/AdminUI";

export default function AdminAgenciesPage() {
  return (
    <AdminPage
      title="Agencies"
      description="Monitor agency performance, account status, and booking contribution across the portal."
    >
      <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {agencies.map((agency) => (
          <SurfaceCard key={agency.id} className="h-full">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-lg font-extrabold text-blue-700">
                  {agency.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight text-slate-950">
                    {agency.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">{agency.owner}</p>
                </div>
              </div>
              <StatusBadge value={agency.status} />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <AgencyMetric label="Email" value={agency.email} />
              <AgencyMetric label="Phone" value={agency.phone} />
              <AgencyMetric label="Total Bookings" value={String(agency.totalBookings)} />
              <AgencyMetric label="Revenue" value={agency.revenue} />
            </div>

            <div className="mt-5">
              <AdminButton href={`/admin/agencies/${agency.id}`} variant="secondary">
                View Details
              </AdminButton>
            </div>
          </SurfaceCard>
        ))}
      </div>
    </AdminPage>
  );
}

function AgencyMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}
