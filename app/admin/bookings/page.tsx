"use client";

import { useMemo, useState } from "react";
import {
  AdminButton,
  AdminPage,
  FilterSelect,
  KebabMenu,
  PaginationPlaceholder,
  SearchInput,
  StatusBadge,
  SurfaceCard,
  TableShell,
} from "@/src/shared/components/admin/AdminUI";
import { bookings } from "@/src/shared/components/admin/adminData";

export default function AdminBookingsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [dateFilter, setDateFilter] = useState("All Dates");

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        booking.bookingRef.toLowerCase().includes(query) ||
        booking.customer.toLowerCase().includes(query) ||
        booking.route.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "All Statuses" || booking.status === statusFilter;
      const matchesDate =
        dateFilter === "All Dates" ||
        (dateFilter === "This Week" && booking.travelDate >= "2026-07-01") ||
        (dateFilter === "Past Travel" && booking.travelDate < "2026-07-01");

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [dateFilter, search, statusFilter]);

  return (
    <AdminPage
      title="Flight bookings"
      description="Browse current and historical reservations, customer records, and fulfillment status."
    >
      <SurfaceCard
        title="Booking Operations"
        description="Search, filter, and review booking records before connecting live backend data."
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
              "Confirmed",
              "Cancelled",
              "Refund Pending",
              "Refunded",
              "Rescheduled",
              "Completed",
            ]}
          />
          <FilterSelect
            value={dateFilter}
            onChange={setDateFilter}
            options={["All Dates", "This Week", "Past Travel"]}
          />
          <AdminButton variant="secondary" disabled>
            Export
          </AdminButton>
        </div>

        <div className="mt-5">
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
                  {booking.bookingRef}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">{booking.customer}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{booking.route}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{booking.travelDate}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{booking.passengers}</td>
                <td className="px-4 py-4 text-sm font-bold text-slate-950">
                  {booking.amount}
                </td>
                <td className="px-4 py-4">
                  <StatusBadge value={booking.status} />
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
        </div>

        <div className="mt-4">
          <PaginationPlaceholder />
        </div>
      </SurfaceCard>
    </AdminPage>
  );
}
