"use client";

import { useEffect, useState } from "react";
import { getTenantCustomers, type TenantCustomer } from "@/src/api/routes/tenant/customers";
import { useAuth } from "@/src/shared/auth/AuthProvider";
import {
  AdminPage,
  EmptyState,
  SearchInput,
  StatusBadge,
  SurfaceCard,
  TableShell,
} from "@/src/shared/components/admin/AdminUI";

export default function AdminCustomersPage() {
  const { selectedTenant } = useAuth();
  const tenantKey = selectedTenant?.key ?? "";
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<TenantCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantKey) {
      setCustomers([]);
      return;
    }

    let active = true;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const response = await getTenantCustomers({
          tenantKey,
          search: search.trim() || undefined,
          per_page: 100,
        });

        if (!active) return;
        setCustomers(Array.isArray(response.data) ? response.data : []);
      } catch (requestError) {
        if (!active) return;
        setError(requestError instanceof Error ? requestError.message : "Failed to load customers.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void run();

    return () => {
      active = false;
    };
  }, [search, tenantKey]);

  return (
    <AdminPage
      title="Customers"
      description={`View customer booking activity for ${selectedTenant?.name ?? "this tenant"}.`}
    >
      <SurfaceCard title="Customer directory" description="Tenant-scoped customer records aggregated from orders.">
        <div className="mb-5 max-w-xl">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search customer name, email, phone, or booking reference"
          />
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Loading customers...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        ) : customers.length === 0 ? (
          <EmptyState
            title="No customers found"
            description="Customer records will appear here once tenant orders exist."
          />
        ) : (
          <TableShell
            columns={[
              "Customer Name",
              "Email",
              "Phone",
              "Total Bookings",
              "Active Bookings",
              "Cancelled Bookings",
              "Refund Pending",
              "Status",
            ]}
          >
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td className="px-4 py-4 text-sm font-bold text-slate-950">{customer.name}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{customer.email}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{customer.phone ?? "-"}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{customer.total_bookings}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{customer.active_bookings}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{customer.cancelled_bookings}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{customer.refund_pending_bookings}</td>
                <td className="px-4 py-4">
                  <StatusBadge value={customer.status} />
                </td>
              </tr>
            ))}
          </TableShell>
        )}
      </SurfaceCard>
    </AdminPage>
  );
}
