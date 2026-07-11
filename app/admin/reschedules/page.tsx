"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/src/shared/auth/AuthProvider";
import {
  AdminButton,
  AdminPage,
  EmptyState,
  FilterSelect,
  LoadingSkeleton,
  SearchInput,
  StatusBadge,
  SurfaceCard,
} from "@/src/shared/components/admin/AdminUI";
import { fetchBookings, type BookingListItem } from "@/src/api/routes/orders/bookings";
import {
  approveOrderChangeWorkflow,
  rejectOrderChangeWorkflow,
} from "@/src/api/routes/orders/change";

type WorkflowRow = {
  key: string;
  booking: BookingListItem;
  rawStatus: string;
  statusLabel: string;
  noteLabel: string;
  summary: string;
  requestedAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  amountText?: string | null;
  canApprove: boolean;
  canReject: boolean;
};

export default function AdminReschedulesPage() {
  const { selectedTenant } = useAuth();
  const tenantKey = selectedTenant?.key ?? "";
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [workflowFilter, setWorkflowFilter] = useState("All workflows");
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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
          per_page: 100,
        });

        if (!active) return;
        setBookings(Array.isArray(response.data) ? response.data : []);
      } catch (requestError) {
        if (!active) return;
        setError(
          requestError instanceof Error ? requestError.message : "Failed to load bookings."
        );
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
  }, [tenantKey]);

  const workflowRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows: WorkflowRow[] = [];

    for (const booking of bookings) {
      const change = booking.meta?.change ?? null;
      const changeRow = buildWorkflowRow(booking, change, query);
      if (changeRow) {
        rows.push(changeRow);
      }
    }

    return rows.filter((row) => {
      if (workflowFilter === "Pending approval") {
        return row.rawStatus === "requested";
      }

      if (workflowFilter === "Approved") {
        return row.rawStatus === "approved" || row.rawStatus === "pending_confirmation";
      }

      if (workflowFilter === "Rejected") {
        return row.rawStatus === "rejected";
      }

      if (workflowFilter === "Confirmed") {
        return row.rawStatus === "confirmed";
      }

      return true;
    });
  }, [bookings, search, workflowFilter]);

  const pendingCount = workflowRows.filter((row) => row.rawStatus === "requested").length;
  const approvedCount = workflowRows.filter(
    (row) => row.rawStatus === "approved" || row.rawStatus === "pending_confirmation"
  ).length;

  async function handleWorkflowAction(
    row: WorkflowRow,
    action: "approve" | "reject"
  ) {
    if (!tenantKey) {
      setActionError("Tenant key is missing.");
      return;
    }

    const actionId = `${row.booking.id}:${action}`;
    setActionKey(actionId);
    setActionError(null);

    try {
      if (action === "approve") {
        await approveOrderChangeWorkflow({ orderId: row.booking.id, tenantKey });
      } else {
        await rejectOrderChangeWorkflow({
          orderId: row.booking.id,
          tenantKey,
          reason: "Rejected by tenant admin.",
        });
      }

      const refreshed = await fetchBookings({ tenantKey, per_page: 100 });
      setBookings(Array.isArray(refreshed.data) ? refreshed.data : []);
    } catch (workflowError) {
      setActionError(
        workflowError instanceof Error
          ? workflowError.message
          : "Failed to update workflow status."
      );
    } finally {
      setActionKey(null);
    }
  }

  return (
    <AdminPage
      title="Reschedule requests"
      description="Review itinerary change requests, then approve or reject them before the Duffel confirmation step."
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_320px]">
        <SurfaceCard
          title="Approval queue"
          description="Bookings are read from the tenant order table. Workflow state is tracked in the reschedule request columns and meta.change."
        >
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_180px_180px]">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search booking reference, customer, or order ID"
            />
            <FilterSelect
              value={workflowFilter}
              onChange={setWorkflowFilter}
              options={["All workflows", "Pending approval", "Approved", "Rejected", "Confirmed"]}
            />
            <AdminButton variant="secondary" disabled>
              {pendingCount} pending · {approvedCount} approved
            </AdminButton>
          </div>

          {actionError ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {actionError}
            </div>
          ) : null}

          <div className="mt-5 space-y-4">
            {loading ? (
              <LoadingSkeleton />
            ) : error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {error}
              </div>
            ) : workflowRows.length === 0 ? (
              <EmptyState
                title="No workflow items"
                description="Approved, rejected, and pending reschedule requests will appear here."
              />
            ) : (
              workflowRows.map((row) => (
                <article
                  key={row.key}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge value={row.noteLabel} />
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                          Reschedule
                      </span>
                    </div>

                      <h3 className="mt-3 break-all text-lg font-semibold tracking-tight text-slate-950">
                        {row.booking.booking_reference ?? `Booking #${row.booking.id}`}
                      </h3>

                      <div className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                        <div>
                          <span className="font-semibold text-slate-900">Customer:</span>{" "}
                          {row.booking.user?.name ?? row.booking.user?.email ?? "Guest"}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">Amount:</span>{" "}
                          {formatMoney(
                            row.booking.amounts?.total?.amount,
                            row.booking.amounts?.total?.currency
                          )}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">Status:</span>{" "}
                          {row.statusLabel}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">Order ID:</span>{" "}
                          {row.booking.duffel_order_id ?? "N/A"}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                        {row.requestedAt ? <span>Requested: {formatDate(row.requestedAt)}</span> : null}
                        {row.approvedAt ? <span>Approved: {formatDate(row.approvedAt)}</span> : null}
                        {row.rejectedAt ? <span>Rejected: {formatDate(row.rejectedAt)}</span> : null}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-2">
                      {row.canApprove ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void handleWorkflowAction(row, "approve")}
                            disabled={actionKey === `${row.booking.id}:approve`}
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(16,185,129,0.18)] transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {actionKey === `${row.booking.id}:approve`
                              ? "Approving..."
                              : "Approve"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleWorkflowAction(row, "reject")}
                            disabled={actionKey === `${row.booking.id}:reject`}
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {actionKey === `${row.booking.id}:reject`
                              ? "Rejecting..."
                              : "Reject"}
                          </button>
                        </>
                      ) : (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-600">
                          {row.statusLabel}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </SurfaceCard>

        <div className="space-y-5">
          <SurfaceCard title="Workflow states" description="How the queue maps to the current booking meta.">
            <div className="space-y-3 text-sm text-slate-600">
              <StateRow label="requested" value="Waiting for tenant admin review." />
              <StateRow label="approved" value="Locally approved, ready for Duffel confirmation." />
              <StateRow label="rejected" value="Workflow stopped locally; no Duffel action." />
              <StateRow label="confirmed" value="Duffel action completed and booking updated." />
            </div>
          </SurfaceCard>

          <SurfaceCard
            title="Customers"
            description="Tenant customers remain available from the existing customer view."
          >
            <EmptyState
              title="Reschedule queue only"
              description="Use the queue on the left to approve or reject reschedule requests."
            />
          </SurfaceCard>
        </div>
      </div>
    </AdminPage>
  );
}

function buildWorkflowRow(
  booking: BookingListItem,
  workflow?: Record<string, unknown> | null,
  query = ""
): WorkflowRow | null {
  if (!workflow) return null;

  const rawStatus = normalizeWorkflowStatus(
    typeof workflow.status === "string" ? workflow.status : null
  );
  if (!rawStatus) return null;

  const searchText = [
    booking.booking_reference,
    booking.duffel_order_id,
    booking.user?.name,
    booking.user?.email,
    rawStatus,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (query && !searchText.includes(query)) {
    return null;
  }

  return {
    key: `change-${booking.id}`,
    booking,
    rawStatus,
    statusLabel: formatWorkflowStatus(rawStatus),
    noteLabel: formatWorkflowStatus(rawStatus),
    summary: `${booking.booking_reference ?? `Booking #${booking.id}`}`,
    requestedAt: typeof workflow.requested_at === "string" ? workflow.requested_at : null,
    approvedAt: typeof workflow.approved_at === "string" ? workflow.approved_at : null,
    rejectedAt: typeof workflow.rejected_at === "string" ? workflow.rejected_at : null,
    amountText: null,
    canApprove: rawStatus === "requested",
    canReject: rawStatus === "requested",
  };
}

function normalizeWorkflowStatus(value?: string | null) {
  const normalized = (value ?? "").toLowerCase().trim();
  if (normalized === "change requested") return "requested";
  return normalized === "pending_confirmation" ? "approved" : normalized;
}

function formatWorkflowStatus(value?: string | null) {
  const normalized = normalizeWorkflowStatus(value);

  if (normalized === "requested") return "Requested";
  if (normalized === "approved") return "Approved";
  if (normalized === "rejected") return "Rejected";
  if (normalized === "confirmed") return "Confirmed";

  return normalized || "Unknown";
}

function StateRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-slate-700">{value}</div>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(amount?: string | number | null, currency?: string | null) {
  const numeric = Number(amount ?? 0);

  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: currency || "LKR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numeric) ? numeric : 0);
}
