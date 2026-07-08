"use client";

import { useEffect, useState } from "react";
import { getTenantCustomers, type TenantCustomer } from "@/src/api/routes/tenant/customers";
import { useAuth } from "@/src/shared/auth/AuthProvider";
import {
  AdminPage,
  EmptyState,
  KebabMenu,
  StatusBadge,
  SurfaceCard,
  TableShell,
} from "@/src/shared/components/admin/AdminUI";
import { rescheduleRequests } from "@/src/shared/components/admin/adminData";

export default function AdminReschedulesPage() {
  const { selectedTenant } = useAuth();
  const tenantKey = selectedTenant?.key ?? "";
  const [customers, setCustomers] = useState<TenantCustomer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customersError, setCustomersError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantKey) {
      setCustomers([]);
      return;
    }

    let active = true;

    async function run() {
      setLoadingCustomers(true);
      setCustomersError(null);

      try {
        const response = await getTenantCustomers({
          tenantKey,
          per_page: 8,
        });

        if (!active) return;
        setCustomers(Array.isArray(response.data) ? response.data : []);
      } catch (requestError) {
        if (!active) return;
        setCustomersError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to load tenant customers.",
        );
      } finally {
        if (active) {
          setLoadingCustomers(false);
        }
      }
    }

    void run();

    return () => {
      active = false;
    };
  }, [tenantKey]);

  return (
    <AdminPage
      title="Reschedule requests"
      description="Review itinerary change requests, fare differences, and approval status."
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_320px]">
        <SurfaceCard
          title="Reschedule queue"
          description="Reschedule workflows will be connected next. This queue remains the current preview."
        >
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

        <SurfaceCard
          title="Customers"
          description="Tenant customers shown in the sidebar under reschedule requests."
        >
          {loadingCustomers ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Loading customers...
            </div>
          ) : customersError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {customersError}
            </div>
          ) : customers.length === 0 ? (
            <EmptyState
              title="No customers found"
              description="Customer activity will appear here once tenant orders exist."
            />
          ) : (
            <div className="space-y-3">
              {customers.map((customer) => (
                <div key={customer.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-950">{customer.name}</h3>
                      <p className="mt-1 text-sm text-slate-600">{customer.email}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {customer.total_bookings} bookings, {customer.active_bookings} active
                      </p>
                    </div>
                    <StatusBadge value={customer.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>
      </div>
    </AdminPage>
  );
}
