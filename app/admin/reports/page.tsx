"use client";

import {
  BadgeDollarSign,
  CalendarRange,
  ReceiptText,
  TicketX,
  Users,
  WalletCards,
} from "lucide-react";
import {
  AdminPage,
  StatCard,
  SurfaceCard,
  TableShell,
} from "@/src/shared/components/admin/AdminUI";
import { monthlyReportRows } from "@/src/shared/components/admin/adminData";

const reportCards = [
  {
    label: "Total Revenue",
    value: "$184,320",
    note: "Across all active agencies",
    icon: WalletCards,
    iconTone: "bg-indigo-50 text-indigo-600",
  },
  {
    label: "Bookings",
    value: "1,284",
    note: "YTD confirmed and completed",
    icon: BadgeDollarSign,
    iconTone: "bg-blue-50 text-blue-600",
  },
  {
    label: "Cancellations",
    value: "78",
    note: "Includes refunds and no-refund cases",
    icon: TicketX,
    iconTone: "bg-rose-50 text-rose-600",
  },
  {
    label: "Refunds",
    value: "$12,480",
    note: "Processed and pending combined",
    icon: ReceiptText,
    iconTone: "bg-amber-50 text-amber-600",
  },
  {
    label: "Customers",
    value: "796",
    note: "Unique traveler profiles",
    icon: Users,
    iconTone: "bg-emerald-50 text-emerald-600",
  },
  {
    label: "Monthly Bookings",
    value: "312",
    note: "Current month snapshot",
    icon: CalendarRange,
    iconTone: "bg-sky-50 text-sky-600",
  },
] as const;

export default function AdminReportsPage() {
  return (
    <AdminPage
      title="Reports"
      description="Static management reporting views for revenue, bookings, refunds, and customer volume."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reportCards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            note={card.note}
            icon={card.icon}
            iconTone={card.iconTone}
          />
        ))}
      </div>

      <SurfaceCard title="Monthly performance" description="Dummy month-over-month operational summary.">
        <TableShell columns={["Month", "Bookings", "Revenue", "Cancellations"]}>
          {monthlyReportRows.map((row) => (
            <tr key={row.month}>
              <td className="px-4 py-4 text-sm font-bold text-slate-950">{row.month}</td>
              <td className="px-4 py-4 text-sm text-slate-600">{row.bookings}</td>
              <td className="px-4 py-4 text-sm font-bold text-slate-950">{row.revenue}</td>
              <td className="px-4 py-4 text-sm text-slate-600">{row.cancellations}</td>
            </tr>
          ))}
        </TableShell>
      </SurfaceCard>
    </AdminPage>
  );
}
