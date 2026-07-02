"use client";

import {
  BadgeDollarSign,
  CalendarClock,
  ChartNoAxesColumn,
  Plane,
  ReceiptText,
  TicketX,
  Users,
  WalletCards,
} from "lucide-react";
import {
  AdminPage,
  AdminButton,
  PaginationPlaceholder,
  StatCard,
  StatusBadge,
  SurfaceCard,
  TableShell,
} from "@/src/shared/components/admin/AdminUI";
import { adminStats, bookings, recentActivity } from "@/src/shared/components/admin/adminData";

const statIcons = [
  { icon: Plane, iconTone: "bg-blue-50 text-blue-600" },
  { icon: ChartNoAxesColumn, iconTone: "bg-emerald-50 text-emerald-600" },
  { icon: TicketX, iconTone: "bg-rose-50 text-rose-600" },
  { icon: ReceiptText, iconTone: "bg-amber-50 text-amber-600" },
  { icon: CalendarClock, iconTone: "bg-sky-50 text-sky-600" },
  { icon: Users, iconTone: "bg-teal-50 text-teal-600" },
  { icon: WalletCards, iconTone: "bg-indigo-50 text-indigo-600" },
  { icon: BadgeDollarSign, iconTone: "bg-violet-50 text-violet-600" },
] as const;

export default function AdminDashboardPage() {
  const recentBookings = bookings.slice(0, 5);

  return (
    <AdminPage
      title="Portal overview"
      description="Track booking operations, customer movements, requests, and revenue across your travel workspace."
      actions={
        <>
          <AdminButton variant="secondary">Download Snapshot</AdminButton>
          <AdminButton>New Booking</AdminButton>
        </>
      }
    >
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {adminStats.map((card, index) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            note={card.note}
            icon={statIcons[index]?.icon}
            iconTone={statIcons[index]?.iconTone}
          />
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
        <SurfaceCard
          title="Recent Bookings"
          description="Latest reservations across the selected tenant."
        >
          <TableShell
            columns={[
              "Booking Ref",
              "Customer",
              "Route",
              "Travel Date",
              "Status",
              "Amount",
            ]}
          >
            {recentBookings.map((booking) => (
              <tr key={booking.id}>
                <td className="px-4 py-4 text-sm font-bold text-slate-950">
                  {booking.bookingRef}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">{booking.customer}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{booking.route}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{booking.travelDate}</td>
                <td className="px-4 py-4">
                  <StatusBadge value={booking.status} />
                </td>
                <td className="px-4 py-4 text-sm font-bold text-slate-950">
                  {booking.amount}
                </td>
              </tr>
            ))}
          </TableShell>
          <div className="mt-4">
            <PaginationPlaceholder />
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="Recent Activity"
          description="A live operations snapshot for bookings, refunds, and changes."
        >
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-950">
                      {activity.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {activity.detail}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                    {activity.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </AdminPage>
  );
}
