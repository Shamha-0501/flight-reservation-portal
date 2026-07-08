"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchBookings, type BookingListItem } from "@/src/api/routes/orders/bookings";
import { useAuth } from "@/src/shared/auth/AuthProvider";
import {
  AdminButton,
  AdminPage,
  EmptyState,
  FilterSelect,
  KebabMenu,
  PaginationPlaceholder,
  SearchInput,
  StatusBadge,
  SurfaceCard,
  TableShell,
} from "@/src/shared/components/admin/AdminUI";

export default function AdminBookingsPage() {
  const { selectedTenant } = useAuth();
  const tenantKey = selectedTenant?.key ?? "";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [dateFilter, setDateFilter] = useState("All Dates");
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantKey) {
      setBookings([]);
      return;
    }

    let active = true;

    async function loadBookings() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchBookings({
          tenantKey,
          search: search.trim() || undefined,
          status: statusFilter === "All Statuses" ? undefined : mapBookingStatusFilter(statusFilter),
          per_page: 100,
        });

        if (!active) return;
        setBookings(Array.isArray(response.data) ? response.data : []);
      } catch (requestError) {
        if (!active) return;
        setError(requestError instanceof Error ? requestError.message : "Failed to load bookings.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadBookings();

    return () => {
      active = false;
    };
  }, [search, statusFilter, tenantKey]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const travelDate = getBookingTravelDate(booking);

      if (dateFilter === "This Month") {
        return travelDate >= getMonthStart();
      }

      if (dateFilter === "Older") {
        return travelDate < getMonthStart();
      }

      return true;
    });
  }, [bookings, dateFilter]);

  return (
    <AdminPage
      title="Flight bookings"
      description={`Browse tenant booking records and reservation status for ${selectedTenant?.name ?? "this workspace"}.`}
    >
      <SurfaceCard
        title="Booking Operations"
        description="Search, filter, and review booking records from the tenant order table."
      >
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_180px_180px_auto]">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search booking reference, customer, or route"
          />
          <FilterSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              "All Statuses",
              "Booked",
              "Cancellation Requested",
              "Cancelled",
              "Refunded",
            ]}
          />
          <FilterSelect
            value={dateFilter}
            onChange={setDateFilter}
            options={["All Dates", "This Month", "Older"]}
          />
          <AdminButton variant="secondary" disabled>
            Export
          </AdminButton>
        </div>

        <div className="mt-5">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Loading bookings...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          ) : filteredBookings.length === 0 ? (
            <EmptyState
              title="No bookings found"
              description="No tenant bookings matched the current filters."
            />
          ) : (
            <TableShell
              columns={[
                "Booking Ref",
                "Customer",
                "Route",
                "Travel Date",
                "Passengers",
                "Amount",
                "Booking Status",
                "Actions",
              ]}
            >
              {filteredBookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="px-4 py-4 text-sm font-bold text-slate-950">
                    {booking.booking_reference ?? "N/A"}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {booking.user?.name ?? booking.user?.email ?? "Guest"}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">{getBookingRoute(booking)}</td>
                  <td className="px-4 py-4 text-sm text-slate-600">{getBookingTravelDate(booking)}</td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {booking.passengers?.length ?? 0}
                  </td>
                  <td className="px-4 py-4 text-sm font-bold text-slate-950">
                    {formatMoney(
                      booking.amounts?.total?.amount,
                      booking.amounts?.total?.currency,
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge value={booking.status ?? "Unknown"} />
                  </td>
                  <td className="px-4 py-4">
                    <KebabMenu
                      items={[
                        {
                          label: "View Details",
                          href: `/admin/bookings/${booking.id}`,
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </TableShell>
          )}
        </div>

        <div className="mt-4">
          <PaginationPlaceholder />
        </div>
      </SurfaceCard>
    </AdminPage>
  );
}

function mapBookingStatusFilter(value: string) {
  return value;
}

function getBookingRoute(booking: BookingListItem) {
  const slices = ((booking.meta?.offer as {
    slices?: Array<{ origin?: { iata_code?: string }; destination?: { iata_code?: string } }>;
  } | null)?.slices) ?? [];
  const firstSlice = slices[0];

  if (firstSlice?.origin?.iata_code && firstSlice?.destination?.iata_code) {
    return `${firstSlice.origin.iata_code} -> ${firstSlice.destination.iata_code}`;
  }

  return "Route unavailable";
}

function getBookingTravelDate(booking: BookingListItem) {
  const slices = ((booking.meta?.offer as {
    slices?: Array<{ departure_date?: string; departing_at?: string }>;
  } | null)?.slices) ?? [];
  const firstSlice = slices[0];

  return (
    firstSlice?.departure_date ??
    firstSlice?.departing_at?.slice(0, 10) ??
    booking.created_at?.slice(0, 10) ??
    "N/A"
  );
}

function formatMoney(amount?: string | number | null, currency?: string | null) {
  const numeric = Number(amount ?? 0);

  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: currency || "LKR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numeric) ? numeric : 0);
}

function getMonthStart() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return monthStart.toISOString().slice(0, 10);
}
