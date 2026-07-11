import { notFound } from "next/navigation";
import { bookings, customers } from "@/src/shared/components/admin/adminData";
import { AdminPage, StatusBadge, SurfaceCard } from "@/src/shared/components/admin/AdminUI";

export default async function CustomerProfilePage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const customer = customers.find((item) => item.id === customerId);

  if (!customer) notFound();

  const customerBookings = bookings.filter((booking) => booking.customerId === customer.id);

  return (
    <AdminPage
      title={customer.name}
      description="Customer profile, booking history, and upcoming travel snapshot."
      eyebrow="Customer profile"
    >
      <SurfaceCard title="Customer information">
        <InfoGrid
          rows={[
            ["Email", customer.email],
            ["Phone", customer.phone],
            ["Location", customer.location],
            ["Tier", customer.tier],
          ]}
          status={customer.status}
        />
      </SurfaceCard>

      <SurfaceCard title="Booking history">
        <div className="space-y-3">
          {customerBookings.map((booking) => (
            <div key={booking.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-extrabold text-slate-950">{booking.bookingRef}</div>
                  <div className="mt-1 text-sm text-slate-600">
                    {booking.route} · {booking.travelDate}
                  </div>
                </div>
                <StatusBadge value={booking.status} />
              </div>
            </div>
          ))}
        </div>
      </SurfaceCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <SurfaceCard title="Upcoming trips">
          <TripList rows={customer.upcomingTrips} emptyCopy="No upcoming trips scheduled." />
        </SurfaceCard>
        <SurfaceCard title="Cancelled trips">
          <TripList rows={customer.cancelledTripsList} emptyCopy="No cancelled trips on record." />
        </SurfaceCard>
      </div>
    </AdminPage>
  );
}

function InfoGrid({
  rows,
  status,
}: {
  rows: [string, string][];
  status: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            {label}
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-900">{value}</div>
        </div>
      ))}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
          Status
        </div>
        <div className="mt-2">
          <StatusBadge value={status} />
        </div>
      </div>
    </div>
  );
}

function TripList({
  rows,
  emptyCopy,
}: {
  rows: { route: string; date: string; bookingRef: string }[];
  emptyCopy: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">{emptyCopy}</p>;
  }

  return (
    <div className="space-y-3">
      {rows.map((trip) => (
        <div key={trip.bookingRef} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-extrabold text-slate-950">{trip.route}</div>
          <div className="mt-1 text-sm text-slate-600">
            {trip.date} · {trip.bookingRef}
          </div>
        </div>
      ))}
    </div>
  );
}
