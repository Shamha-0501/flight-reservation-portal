import { notFound } from "next/navigation";
import { agencies, bookings } from "@/src/shared/components/admin/adminData";
import { AdminPage, StatusBadge, SurfaceCard } from "@/src/shared/components/admin/AdminUI";

export default async function AgencyDetailsPage({
  params,
}: {
  params: Promise<{ agencyId: string }>;
}) {
  const { agencyId } = await params;
  const agency = agencies.find((item) => item.id === agencyId);

  if (!agency) notFound();

  return (
    <AdminPage
      title={agency.name}
      description="Agency profile, key statistics, and recent booking movement."
      eyebrow="Agency details"
    >
      <div className="grid gap-5 xl:grid-cols-2">
        <SurfaceCard title="General information">
          <Grid rows={[["Owner", agency.owner], ["Email", agency.email], ["Phone", agency.phone], ["Address", agency.address], ["City", agency.city]]} />
        </SurfaceCard>
        <SurfaceCard title="Statistics">
          <Grid rows={[["Total Bookings", String(agency.totalBookings)], ["Revenue", agency.revenue], ["Status", agency.status]]} status={agency.status} />
        </SurfaceCard>
      </div>

      <SurfaceCard title="Recent bookings">
        <div className="space-y-3">
          {bookings.slice(0, 4).map((booking) => (
            <div key={booking.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-extrabold text-slate-950">
                    {booking.bookingRef}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    {booking.customer} · {booking.route}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-bold text-slate-950">{booking.amount}</div>
                  <StatusBadge value={booking.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </SurfaceCard>
    </AdminPage>
  );
}

function Grid({
  rows,
  status,
}: {
  rows: [string, string][];
  status?: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            {label}
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-900">
            {label === "Status" && status ? <StatusBadge value={status} /> : value}
          </div>
        </div>
      ))}
    </div>
  );
}
