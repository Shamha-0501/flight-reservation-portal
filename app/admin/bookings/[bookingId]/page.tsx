"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchBookingDetails, type BookingListItem } from "@/src/api/routes/orders/bookings";
import { useAuth } from "@/src/shared/auth/AuthProvider";
import { AdminButton, AdminPage, LoadingSkeleton, StatusBadge, SurfaceCard } from "@/src/shared/components/admin/AdminUI";

export default function BookingDetailsPage() {
  const params = useParams<{ bookingId: string }>();
  const { selectedTenant } = useAuth();
  const [booking, setBooking] = useState<BookingListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const bookingId = params?.bookingId;
    const tenantKey = selectedTenant?.key;
    if (!bookingId || !tenantKey) {
      setLoading(false);
      return;
    }
    let active = true;
    async function loadBooking() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchBookingDetails({ id: bookingId, tenantKey: tenantKey as string });
        if (active) setBooking(result);
      } catch (requestError) {
        if (active) setError(requestError instanceof Error ? requestError.message : "Failed to load booking details.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadBooking();
    return () => { active = false; };
  }, [params?.bookingId, selectedTenant?.key]);

  if (loading) {
    return <AdminPage title="Booking details" description="Loading booking information..."><LoadingSkeleton /></AdminPage>;
  }
  if (error || !booking) {
    return <AdminPage title="Booking details" description="Unable to load this booking."><div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error ?? "Booking details were not found."}</div></AdminPage>;
  }

  const offer = booking.meta?.offer as OfferData | null | undefined;
  const firstSlice = offer?.slices?.[0];
  const route = firstSlice?.origin?.iata_code && firstSlice.destination?.iata_code
    ? `${firstSlice.origin.iata_code} → ${firstSlice.destination.iata_code}` : "Route unavailable";
  const total = booking.amounts?.customer_total ?? booking.amounts?.grand_total ?? booking.amounts?.total;

  return (
    <AdminPage
      title={`Booking ${booking.booking_reference ?? `#${booking.id}`}`}
      description="Review reservation data, traveller details, payment information, and request status."
      eyebrow="Booking details"
      actions={<><AdminButton variant="secondary">Cancel Booking</AdminButton><AdminButton variant="secondary">Reschedule Booking</AdminButton><AdminButton>Send Email</AdminButton></>}
    >
      <div className="grid gap-5 xl:grid-cols-2">
        <SurfaceCard title="Booking Information">
          <DetailGrid rows={[
            ["Booking ID", String(booking.id)],
            ["Booking Reference", booking.booking_reference ?? "N/A"],
            ["Customer", booking.user?.name ?? booking.user?.email ?? "Guest"],
            ["Customer Email", booking.user?.email ?? "N/A"],
            ["Status", <StatusBadge key="status" value={booking.status ?? "Unknown"} />],
            ["Booked At", formatDateTime(booking.created_at)],
          ]} />
        </SurfaceCard>
        <SurfaceCard title="Flight Details">
          <DetailGrid rows={[
            ["Route", route],
            ["Travel Date", firstSlice?.departure_date ?? firstSlice?.departing_at?.slice(0, 10) ?? "N/A"],
            ["Departure", firstSlice?.departing_at ?? "N/A"],
            ["Arrival", firstSlice?.arriving_at ?? "N/A"],
            ["Duffel Order ID", booking.duffel_order_id ?? "N/A"],
            ["Passengers", String(booking.passengers?.length ?? 0)],
          ]} />
        </SurfaceCard>
      </div>

      <SurfaceCard title="Passenger List">
        {booking.passengers?.length ? <div className="grid gap-3 lg:grid-cols-2">
          {booking.passengers.map((passenger) => <div key={passenger.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-extrabold text-slate-950">{[passenger.title, passenger.given_name, passenger.family_name].filter(Boolean).join(" ") || "Passenger"}</h3>
            <p className="mt-2 text-sm text-slate-600">Type: {passenger.type ?? "N/A"}</p>
            <p className="mt-1 text-sm text-slate-600">Date of birth: {passenger.dob ?? "N/A"}</p>
            <p className="mt-1 text-sm text-slate-600">Email: {passenger.email ?? "N/A"}</p>
          </div>)}
        </div> : <p className="text-sm text-slate-600">No passenger information is available.</p>}
      </SurfaceCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <SurfaceCard title="Payment Summary"><DetailGrid rows={[
          ["Total Amount", formatMoney(total?.amount, total?.currency)],
          ["Currency", total?.currency ?? "N/A"],
          ["Cancellation Status", booking.cancellation_status ?? "None"],
          ["Refund Status", booking.refund_status ?? "None"],
        ]} /></SurfaceCard>
        <SurfaceCard title="Request Status"><DetailGrid rows={[
          ["Cancellation Request", booking.meta?.cancellation?.status ?? "No request"],
          ["Reschedule Request", booking.meta?.change?.status ?? "No request"],
          ["Request Date", booking.meta?.change?.requested_at ?? booking.meta?.cancellation?.requested_at ?? "N/A"],
          ["Last Updated", formatDateTime(booking.updated_at)],
        ]} /></SurfaceCard>
      </div>
    </AdminPage>
  );
}

function DetailGrid({ rows }: { rows: [string, React.ReactNode][] }) {
  return <div className="grid gap-3 sm:grid-cols-2">{rows.map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</div><div className="mt-2 break-words text-sm font-semibold text-slate-900">{value}</div></div>)}</div>;
}

function formatDateTime(value?: string) {
  return value ? new Date(value).toLocaleString("en-LK") : "N/A";
}

function formatMoney(amount?: string | number | null, currency?: string | null) {
  const numeric = Number(amount ?? 0);
  return new Intl.NumberFormat("en-LK", { style: "currency", currency: currency || "LKR", maximumFractionDigits: 2 }).format(Number.isFinite(numeric) ? numeric : 0);
}

type OfferData = {
  slices?: Array<{
    departure_date?: string;
    departing_at?: string;
    arriving_at?: string;
    origin?: { iata_code?: string };
    destination?: { iata_code?: string };
  }>;
};
