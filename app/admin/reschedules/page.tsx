import {
  AdminPage,
  KebabMenu,
  StatusBadge,
  SurfaceCard,
  TableShell,
} from "@/src/shared/components/admin/AdminUI";
import { rescheduleRequests } from "@/src/shared/components/admin/adminData";

export default function AdminReschedulesPage() {
  return (
    <AdminPage
      title="Reschedule requests"
      description="Review itinerary change requests, fare differences, and approval status."
    >
      <SurfaceCard title="Reschedule queue" description="Static UI preview for change operations.">
        <TableShell
          columns={[
            "Booking Ref",
            "Customer",
            "Current Flight",
            "Requested Flight",
            "Fare Difference",
            "Status",
            "Actions",
          ]}
        >
          {rescheduleRequests.map((row) => (
            <tr key={row.id}>
              <td className="px-4 py-4 text-sm font-bold text-slate-950">{row.bookingRef}</td>
              <td className="px-4 py-4 text-sm text-slate-600">{row.customer}</td>
              <td className="px-4 py-4 text-sm text-slate-600">{row.currentFlight}</td>
              <td className="px-4 py-4 text-sm text-slate-600">{row.requestedFlight}</td>
              <td className="px-4 py-4 text-sm font-bold text-slate-950">{row.fareDifference}</td>
              <td className="px-4 py-4">
                <StatusBadge value={row.status} />
              </td>
                <td className="px-4 py-4">
                  <KebabMenu
                    items={[
                      { label: "View", href: `/admin/reschedules/${row.id}` },
                      { label: "Approve" },
                      { label: "Reject", tone: "danger" },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </TableShell>
      </SurfaceCard>
    </AdminPage>
  );
}
