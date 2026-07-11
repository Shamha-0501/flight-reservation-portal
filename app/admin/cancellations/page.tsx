"use client";

import { useEffect, useMemo, useState } from "react";
import {
  approveOrderCancellationWorkflow,
  confirmOrderRefund,
  rejectOrderCancellationWorkflow,
} from "@/src/api/routes/orders/cancellation";
import { fetchBookings, type BookingListItem } from "@/src/api/routes/orders/bookings";
import { getTenantCustomers, type TenantCustomer } from "@/src/api/routes/tenant/customers";
import { useAuth } from "@/src/shared/auth/AuthProvider";
import {
  AdminPage,
  Drawer,
  EmptyState,
  FilterSelect,
  LoadingSkeleton,
  KebabMenu,
  SearchInput,
  StatusBadge,
  SurfaceCard,
  TableShell,
} from "@/src/shared/components/admin/AdminUI";

export default function AdminCancellationsPage() {
  const { selectedTenant } = useAuth();
  const tenantKey = selectedTenant?.key ?? "";
  const [approvalStatusFilter, setApprovalStatusFilter] = useState("All Statuses");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [dateFilter, setDateFilter] = useState("All Dates");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [rows, setRows] = useState<BookingListItem[]>([]);
  const [customers, setCustomers] = useState<TenantCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvalActionKey, setApprovalActionKey] = useState<string | null>(null);
  const [approvalError, setApprovalError] = useState<string | null>(null);

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

  const approvalRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const monthStart = getMonthStart();

    return rows.filter((row) => {
      const approvalState = getCancellationApprovalState(row);
      const requestedAt =
        row.meta?.cancellation?.requested_at ??
        null;
      const reviewedAt =
        row.meta?.cancellation?.approved_at ??
        row.meta?.cancellation?.rejected_at ??
        null;
      const searchText = [
        row.booking_reference,
        row.user?.name,
        row.user?.email,
        row.duffel_order_id,
        approvalState,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesStatus =
        approvalStatusFilter === "All Statuses" ||
        (approvalStatusFilter === "Cancellation Requested" &&
          approvalState === "requested") ||
        (approvalStatusFilter === "Approved" && approvalState === "approved") ||
        (approvalStatusFilter === "Rejected" && approvalState === "rejected");
      const isCancellationRequested = approvalState === "requested";
      const matchesDate =
        dateFilter === "All Dates" ||
        (dateFilter === "This Month" &&
          ((typeof requestedAt === "string" && requestedAt >= monthStart) ||
            (typeof reviewedAt === "string" && reviewedAt >= monthStart))) ||
        (dateFilter === "Older" &&
          (!requestedAt || requestedAt < monthStart) &&
          (!reviewedAt || reviewedAt < monthStart));

      return (
        isCancellationRequested &&
        matchesStatus &&
        matchesDate &&
        (!query || searchText.includes(query))
      );
    });
  }, [approvalStatusFilter, dateFilter, rows, search]);

  const selected = rows.find((item) => item.id === selectedId) ?? null;

  async function handleCancellationApprovalAction(
    row: BookingListItem,
    action: "approve" | "reject"
  ) {
    if (!tenantKey) {
      setApprovalError("Tenant key is missing.");
      return;
    }

    const actionId = `${row.id}:${action}`;
    setApprovalActionKey(actionId);
    setApprovalError(null);

    try {
      if (action === "approve") {
        await approveOrderCancellationWorkflow({ orderId: row.id, tenantKey });
      } else {
        await rejectOrderCancellationWorkflow({
          orderId: row.id,
          tenantKey,
          reason: "Rejected by tenant admin.",
        });
      }

      await loadCancellationData(tenantKey);
    } catch (requestError) {
      setApprovalError(
        requestError instanceof Error ? requestError.message : "Failed to update cancellation approval."
      );
    } finally {
      setApprovalActionKey(null);
    }
  }

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
        <div className="space-y-5">
          <SurfaceCard
            title="Cancellation approvals"
            description="Review customer cancellation requests and approve or reject them before the refund desk updates."
          >
            <div className="grid gap-3 lg:grid-cols-[180px_180px_minmax(0,1fr)]">
              <FilterSelect
                value={approvalStatusFilter}
                onChange={setApprovalStatusFilter}
                options={["All Statuses", "Cancellation Requested", "Approved", "Rejected"]}
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

            {approvalError ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {approvalError}
              </div>
            ) : null}

            <div className="mt-5">
              {loading ? (
                <LoadingSkeleton />
              ) : approvalRows.length === 0 ? (
                <EmptyState
                  title="No cancellation approvals"
                  description="Customer cancellation requests will appear here before refund confirmation runs."
                />
              ) : (
                <TableShell
                  columns={[
                    "Booking Ref",
                    "Customer",
                    "Request Status",
                    "Requested At",
                    "Reviewed At",
                    "Actions",
                  ]}
                >
                  {approvalRows.map((row) => {
                    const approvalState = getCancellationApprovalState(row);
                    const isReviewed = approvalState === "approved" || approvalState === "rejected";
                    return (
                      <tr key={row.id}>
                        <td className="px-4 py-4 text-sm font-semibold text-slate-950">
                          {row.booking_reference ?? "N/A"}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          {row.user?.name ?? row.user?.email ?? "Guest"}
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge
                            value={
                              approvalState === "approved"
                                ? "Approved"
                                : approvalState === "rejected"
                                  ? "Rejected"
                                  : row.cancellation_status ?? "Not Cancelled"
                            }
                          />
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          {getCancellationWorkflowDate(row, "requested")}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          {getCancellationWorkflowDate(row, "reviewed")}
                        </td>
                        <td className="px-4 py-4">
                          {isReviewed ? (
                            <StatusBadge value={approvalState === "approved" ? "Approved" : "Rejected"} />
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => void handleCancellationApprovalAction(row, "approve")}
                                disabled={approvalActionKey === `${row.id}:approve`}
                                className="inline-flex h-9 items-center justify-center rounded-xl bg-emerald-600 px-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {approvalActionKey === `${row.id}:approve`
                                  ? "Approving..."
                                  : "Approve"}
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleCancellationApprovalAction(row, "reject")}
                                disabled={approvalActionKey === `${row.id}:reject`}
                                className="inline-flex h-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {approvalActionKey === `${row.id}:reject`
                                  ? "Rejecting..."
                                  : "Reject"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </TableShell>
              )}
            </div>
          </SurfaceCard>

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
              <LoadingSkeleton />
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
                    <td className="px-4 py-4 text-sm font-semibold text-slate-950">
                      {row.booking_reference ?? "N/A"}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {row.user?.name ?? row.user?.email ?? "Guest"}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-950">
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
        </div>

        <SurfaceCard
          title="Customers"
          description="Tenant customers with booking activity connected to cancellations."
        >
          {customersLoading ? (
            <LoadingSkeleton />
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
                      <h3 className="text-sm font-semibold text-slate-950">{customer.name}</h3>
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
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
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

function getCancellationApprovalState(booking: BookingListItem) {
  const cancellation = booking.meta?.cancellation ?? null;
  const approvedAt = typeof cancellation?.approved_at === "string" ? cancellation.approved_at : null;
  const rejectedAt = typeof cancellation?.rejected_at === "string" ? cancellation.rejected_at : null;
  const status = normalizeStatus(booking.cancellation_status);

  if (approvedAt) return "approved";
  if (rejectedAt) return "rejected";
  if (status === "cancellation requested") return "requested";
  return status || "unknown";
}

function getCancellationWorkflowDate(booking: BookingListItem, kind: "requested" | "reviewed") {
  const field =
    kind === "requested"
      ? booking.meta?.cancellation?.requested_at
      : booking.meta?.cancellation?.approved_at ?? booking.meta?.cancellation?.rejected_at;

  if (field) return field.slice(0, 10);
  return "N/A";
}

function normalizeStatus(value?: string | null) {
  return (value ?? "").toLowerCase().trim();
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
