import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import {
  AdminButton,
  AdminPage,
  StatusBadge,
  SurfaceCard,
} from "@/src/shared/components/admin/AdminUI";
import { bookings } from "@/src/shared/components/admin/adminData";

export default async function BookingDetailsPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const booking = bookings.find((item) => item.id === bookingId);

  if (!booking) notFound();

  return (
    <AdminPage
      title={`Booking ${booking.bookingRef}`}
      description="Review reservation data, travel details, payment information, and order status."
      eyebrow="Booking details"
      actions={
        <>
          <AdminButton variant="secondary">Cancel Booking</AdminButton>
          <AdminButton variant="secondary">Reschedule Booking</AdminButton>
          <AdminButton variant="secondary">Download Ticket</AdminButton>
          <AdminButton>Send Email</AdminButton>
        </>
      }
    >
      <div className="grid gap-5 xl:grid-cols-2">
        <SurfaceCard title="Booking Information">
          <DetailGrid
            rows={[
              ["Booking Reference", booking.bookingRef],
              ["Customer", booking.customer],
              ["Status", <StatusBadge key="status" value={booking.status} />],
              ["Booked At", booking.bookedAt],
            ]}
          />
        </SurfaceCard>

        <SurfaceCard title="Flight Details">
          <DetailGrid
            rows={[
              ["Route", booking.route],
              ["Flight Number", booking.flightDetails.flightNumber],
              ["Cabin", booking.flightDetails.cabin],
              ["Departure", booking.flightDetails.departure],
              ["Arrival", booking.flightDetails.arrival],
              ["Terminal", booking.flightDetails.terminal],
            ]}
          />
        </SurfaceCard>
      </div>

      <SurfaceCard title="Passenger List">
        <div className="grid gap-3 lg:grid-cols-2">
          {booking.passengersList.map((passenger) => (
            <div key={passenger.ticketNumber} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-extrabold text-slate-950">{passenger.name}</h3>
              <p className="mt-2 text-sm text-slate-600">{passenger.type}</p>
              <p className="mt-1 text-sm text-slate-600">Seat {passenger.seat}</p>
              <p className="mt-1 text-sm text-slate-600">
                Ticket {passenger.ticketNumber}
              </p>
            </div>
          ))}
        </div>
      </SurfaceCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <SurfaceCard title="Payment Summary">
          <DetailGrid
            rows={[
              ["Amount", booking.amount],
              ["Payment Method", booking.paymentMethod],
              ["Passengers", String(booking.passengers)],
            ]}
          />
        </SurfaceCard>

        <SurfaceCard title="Duffel Information">
          <DetailGrid
            rows={[
              ["Duffel Order ID", booking.duffelOrderId],
              ["Provider Status", "Placeholder synced state"],
              ["Ancillaries", "Seat and baggage mapping pending integration"],
            ]}
          />
        </SurfaceCard>
      </div>

      <SurfaceCard title="Order Timeline">
        <div className="space-y-4">
          {booking.timeline.map((item) => (
            <div key={item.label + item.timestamp} className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <span
                className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                  item.tone === "success"
                    ? "bg-emerald-500"
                    : item.tone === "warn"
                      ? "bg-amber-500"
                      : "bg-blue-500"
                }`}
              />
              <div>
                <h3 className="text-sm font-extrabold text-slate-950">{item.label}</h3>
                <p className="mt-1 text-sm text-slate-600">{item.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </SurfaceCard>
    </AdminPage>
  );
}

function DetailGrid({
  rows,
}: {
  rows: [string, ReactNode][];
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
    </div>
  );
}
