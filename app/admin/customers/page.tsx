import {
  AdminPage,
  KebabMenu,
  StatusBadge,
  SurfaceCard,
  TableShell,
} from "@/src/shared/components/admin/AdminUI";
import { customers } from "@/src/shared/components/admin/adminData";

export default function AdminCustomersPage() {
  return (
    <AdminPage
      title="Customers"
      description="View customer health, booking volumes, and trip history across the portal."
    >
      <SurfaceCard title="Customer directory" description="Static profile data for management workflows.">
        <TableShell
          columns={[
            "Customer Name",
            "Email",
            "Phone",
            "Total Bookings",
            "Completed Trips",
            "Cancelled Trips",
            "Status",
              "Actions",
            ]}
          >
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td className="px-4 py-4 text-sm font-bold text-slate-950">{customer.name}</td>
              <td className="px-4 py-4 text-sm text-slate-600">{customer.email}</td>
              <td className="px-4 py-4 text-sm text-slate-600">{customer.phone}</td>
              <td className="px-4 py-4 text-sm text-slate-600">{customer.totalBookings}</td>
              <td className="px-4 py-4 text-sm text-slate-600">{customer.completedTrips}</td>
              <td className="px-4 py-4 text-sm text-slate-600">{customer.cancelledTrips}</td>
              <td className="px-4 py-4">
                <StatusBadge value={customer.status} />
              </td>
              <td className="px-4 py-4">
                <KebabMenu
                  items={[
                    {
                      label: "View Profile",
                      href: `/admin/customers/${customer.id}`,
                    },
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
