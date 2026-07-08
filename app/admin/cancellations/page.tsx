"use client";

import { useEffect, useMemo, useState } from "react";
import { confirmOrderRefund } from "@/src/api/routes/orders/cancellation";
import { fetchBookings, type BookingListItem } from "@/src/api/routes/orders/bookings";
import { getTenantCustomers, type TenantCustomer } from "@/src/api/routes/tenant/customers";
import { useAuth } from "@/src/shared/auth/AuthProvider";
import {
  AdminPage,
  Drawer,
  EmptyState,
  FilterSelect,
  KebabMenu,
  SearchInput,
  StatusBadge,
  SurfaceCard,
  TableShell,
} from "@/src/shared/components/admin/AdminUI";

export default function AdminCancellationsPage() {
  const { selectedTenant } = useAuth();
  const tenantKey = selectedTenant?.key ?? "";
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [dateFilter, setDateFilter] = useState("All Dates");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [rows, setRows] = useState<BookingListItem[]>([]);
  const [customers, setCustomers] = useState<TenantCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadCancellationData(currentTenantKey: string) {
    const [bookingsResponse, customersResponse] = await Promise.all([
      fetchBookings({
        tenantKey: currentTenantKey,
        search: search.trim() || undefined,
        cancellation_scope: "all",
        per_page: 100,
      }),
      getTenantCustomers({
        tenantKey: currentTenantKey,
        per_page: 8,
      }),
    ]);

    setRows(Array.isArray(bookingsResponse.data) ? bookingsResponse.data : []);
    setCustomers(Array.isArray(customersResponse.data) ? customersResponse.data : []);
  }

  useEffect(() => {
    if (!tenantKey) {
      setRows([]);
      setCustomers([]);
      return;
    }

    let active = true;

    async function run() {
      setLoading(true);
      setCustomersLoading(true);
      setError(null);

      try {
        const [bookingsResponse, customersResponse] = await Promise.all([
          fetchBookings({
            tenantKey,
            search: search.trim() || undefined,
            cancellation_scope: "all",
            per_page: 100,
          }),
          getTenantCustomers({
            tenantKey,
            per_page: 8,
          }),
        ]);

        if (!active) return;

        setRows(Array.isArray(bookingsResponse.data) ? bookingsResponse.data : []);
        setCustomers(Array.isArray(customersResponse.data) ? customersResponse.data : []);
      } catch (requestError) {
        if (!active) return;
        setError(requestError instanceof Error ? requestError.message : "Failed to load cancellations.");
      } finally {
        if (active) {
          setLoading(false);
          setCustomersLoading(false);
        }
      }
    }

    void run();

    return () => {
      active = false;
    };
  }, [search, tenantKey]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const currentStatus = getCancellationCurrentStatus(row);
      const cancellationDate = getCancellationDate(row);

      const matchesStatus =
        statusFilter === "All Statuses" || currentStatus === statusFilter;
      const matchesDate =
        dateFilter === "All Dates" ||
        (dateFilter === "This Month" && cancellationDate >= getMonthStart()) ||
        (dateFilter === "Older" && cancellationDate < getMonthStart());

      return matchesStatus && matchesDate;
    });
  }, [dateFilter, rows, statusFilter]);

  const selected = rows.find((item) => item.id === selectedId) ?? null;

  async function handleConfirmRefund(orderId: number) {
    if (!tenantKey) return;

    try {
      await confirmOrderRefund({ orderId, tenantKey });
      await loadCancellationData(tenantKey);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to confirm refund.");
    }
  }

  return (
    <AdminPage
      title="Cancellation requests"
      description={`Manage cancellations and refunds for ${selectedTenant?.name ?? "this tenant"} using tenant order records.`}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_320px]">
        <SurfaceCard title="Refund desk" description="Review tenant cancellation and refund states.">
          <div className="grid gap-3 lg:grid-cols-[180px_180px_minmax(0,1fr)]">
            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={["All Statuses", "Cancellation Requested", "Cancelled"]}
            />
            <FilterSelect
              value={dateFilter}
              onChange={setDateFilter}
              options={["All Dates", "This Month", "Older"]}
            />
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search booking reference or customer"
            />
          </div>

          <div className="mt-5">
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Loading cancellation requests...
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {error}
              </div>
            ) : filteredRows.length === 0 ? (
              <EmptyState
                title="No cancellation requests found"
                description="No tenant orders currently match the cancellation filters."
              />
            ) : (
              <TableShell
                columns={[
                  "Booking Ref",
                  "Customer",
                  "Refund Amount",
                  "Refund Status",
                  "Cancellation Date",
                  "Current Status",
                  "Actions",
                ]}
              >
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-4 text-sm font-bold text-slate-950">
                      {row.booking_reference ?? "N/A"}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {row.user?.name ?? row.user?.email ?? "Guest"}
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-slate-950">
                      {formatMoney(
                        row.meta?.cancellation?.refund_amount,
                        row.meta?.cancellation?.refund_currency,
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge value={row.refund_status ?? "No Refund"} />
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">{getCancellationDate(row)}</td>
                    <td className="px-4 py-4">
                      <StatusBadge value={getCancellationCurrentStatus(row)} />
                    </td>
                    <td className="px-4 py-4">
                      <KebabMenu
                        items={[
                          { label: "View", onClick: () => setSelectedId(row.id) },
                          ...(row.refund_status === "Refund Pending"
                            ? [{ label: "Confirm Refund", onClick: () => void handleConfirmRefund(row.id) }]
                            : []),
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </TableShell>
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="Customers"
          description="Tenant customers with booking activity connected to cancellations."
        >
          {customersLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Loading customers...
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
                        {customer.total_bookings} bookings, {customer.cancelled_bookings} cancelled
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

      <Drawer
        open={Boolean(selected)}
        title={selected ? `${selected.booking_reference ?? "Booking"} cancellation` : "Cancellation details"}
        description="Tenant cancellation details from the order record."
        onClose={() => setSelectedId(null)}
      >
        {selected ? (
          <div className="space-y-5">
            <InfoGrid
              rows={[
                ["Customer", selected.user?.name ?? selected.user?.email ?? "Guest"],
                [
                  "Refund Amount",
                  formatMoney(
                    selected.meta?.cancellation?.refund_amount,
                    selected.meta?.cancellation?.refund_currency,
                  ),
                ],
                ["Refund Status", selected.refund_status ?? "No Refund"],
                ["Current Status", getCancellationCurrentStatus(selected)],
                ["Cancellation Date", getCancellationDate(selected)],
              ]}
            />
            <SurfaceCard title="Cancellation Metadata">
              <p className="text-sm leading-6 text-slate-600">
                Cancellation ID: {selected.meta?.cancellation?.cancellation_id ?? "Unavailable"}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Confirmed at: {selected.meta?.cancellation?.confirmed_at ?? "Pending"}
              </p>
            </SurfaceCard>
          </div>
        ) : null}
      </Drawer>
    </AdminPage>
  );
}

function InfoGrid({ rows }: { rows: [string, string][] }) {
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

function getCancellationCurrentStatus(booking: BookingListItem) {
  return booking.cancellation_status ?? "Not Cancelled";
}

function getCancellationDate(booking: BookingListItem) {
  return (
    booking.meta?.cancellation?.confirmed_at?.slice(0, 10) ??
    booking.updated_at?.slice(0, 10) ??
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
