"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/src/shared/auth/AuthProvider";
import {
  AdminPage,
  LoadingSkeleton,
  SearchInput,
  SurfaceCard,
} from "@/src/shared/components/admin/AdminUI";
import { fetchBookings, type BookingListItem } from "@/src/api/routes/orders/bookings";
import {
  approveOrderChangeWorkflow,
  rejectOrderChangeWorkflow,
} from "@/src/api/routes/orders/change";
import {
  BookOpen,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  CircleCheckBig,
  CircleX,
  Clock3,
  ArrowRight,
  Filter,
  MoreVertical,
  Plane,
  type LucideIcon,
} from "lucide-react";

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
  const [workflowFilter, setWorkflowFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All dates");
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);

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

  const allWorkflowRows = useMemo(() => {
    const rows: WorkflowRow[] = [];

    for (const booking of bookings) {
      const change = booking.meta?.change ?? null;
      const changeRow = buildWorkflowRow(booking, change);
      if (changeRow) {
        rows.push(changeRow);
      }
    }

    return rows;
  }, [bookings]);

  const workflowRows = useMemo(() => {
    return allWorkflowRows.filter((row) => {
      const query = search.trim().toLowerCase();
      const matchesSearch = !query || getWorkflowSearchText(row).includes(query);
      const matchesStatus =
        workflowFilter === "All" ||
        (workflowFilter === "Pending" && row.rawStatus === "requested") ||
        (workflowFilter === "Approved" && row.rawStatus === "approved") ||
        (workflowFilter === "Confirmed" && row.rawStatus === "confirmed") ||
        (workflowFilter === "Rejected" && row.rawStatus === "rejected");

      return matchesSearch && matchesStatus && matchesDateFilter(row.requestedAt, dateFilter);
    });
  }, [allWorkflowRows, dateFilter, search, workflowFilter]);

  const summaryCounts = useMemo(() => {
    return {
      pending: allWorkflowRows.filter((row) => row.rawStatus === "requested").length,
      approved: allWorkflowRows.filter(
        (row) => row.rawStatus === "approved" || row.rawStatus === "pending_confirmation"
      ).length,
      confirmed: allWorkflowRows.filter((row) => row.rawStatus === "confirmed").length,
      rejected: allWorkflowRows.filter((row) => row.rawStatus === "rejected").length,
    };
  }, [allWorkflowRows]);

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
      description="Review and manage customer itinerary change requests."
      actions={
        <button
          type="button"
          onClick={() =>
            document
              .getElementById("approval-workflow")
              ?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
          className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <BookOpen className="h-4 w-4" />
          Workflow guide
        </button>
      }
    >
      <div className="mb-7 mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Pending review"
          value={String(summaryCounts.pending)}
          note="Needs your attention"
          icon={Clock3}
          tone="amber"
        />
        <SummaryCard
          label="Confirmed"
          value={String(summaryCounts.confirmed)}
          note="Completed by provider"
          icon={Plane}
          tone="emerald"
        />
        <SummaryCard
          label="Rejected"
          value={String(summaryCounts.rejected)}
          note="No actions required"
          icon={CircleX}
          tone="rose"
        />
        <SummaryCard
          label="Approved"
          value={String(summaryCounts.approved)}
          note="Awaiting provider"
          icon={CheckCircle2}
          tone="blue"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_264px]">
        <div className="min-w-0">
          <SurfaceCard
            title={
              <div className="flex items-center gap-3">
                <span>Request queue</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
                  {workflowRows.length}
                </span>
              </div>
            }
            description="Review pending changes and track requests through provider confirmation."
          >
            <div className="space-y-4">
              <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_170px_170px_44px]">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search reference, customer or order ID"
                />
                <select
                  value={workflowFilter}
                  onChange={(event) => setWorkflowFilter(event.target.value)}
                  aria-label="Filter by workflow status"
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                >
                  <option value="All">All statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <select
                    value={dateFilter}
                    onChange={(event) => setDateFilter(event.target.value)}
                    aria-label="Filter by requested date"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  >
                    <option>All dates</option>
                    <option>Today</option>
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                  </select>
                </div>
                <button
                  type="button"
                  aria-label="Request filters"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                >
                  <Filter className="h-4 w-4" />
                </button>
              </div>

              {actionError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {actionError}
                </div>
              ) : null}

              {loading ? (
                <LoadingSkeleton />
              ) : error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {error}
                </div>
              ) : workflowRows.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <div className="text-sm font-semibold text-slate-950">No workflow items</div>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Approved, rejected, and pending reschedule requests will appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <table className="w-full table-auto border-separate border-spacing-0">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        <th className="px-4 py-4">Booking</th>
                        <th className="px-4 py-4">Customer</th>
                        <th className="px-4 py-4">Requested change</th>
                        <th className="px-4 py-4 whitespace-nowrap">Current amount</th>
                        <th className="px-4 py-4 whitespace-nowrap">Requested on</th>
                        <th className="px-4 py-4">Status</th>
                        <th className="px-4 py-4 text-right" />
                      </tr>
                    </thead>
                    <tbody>
                      {workflowRows.map((row) => {
                        const bookingHref = getBookingDetailsHref(row.booking, tenantKey);
                        const amountLabel = formatMoney(
                          row.booking.amounts?.total?.amount ??
                            row.booking.amounts?.order_total?.amount ??
                            row.booking.amounts?.grand_total?.amount,
                          row.booking.amounts?.total?.currency ??
                            row.booking.amounts?.order_total?.currency ??
                            row.booking.amounts?.grand_total?.currency
                        );
                        const isPending = row.rawStatus === "requested";
                        const changeSummary = getRequestedChangeSummary(row.booking);

                        return (
                          <tr key={row.key} className={isPending ? "bg-amber-50/70" : "bg-white"}>
                            <td className="border-t border-slate-100 px-4 py-4 align-top">
                              <div className="font-semibold text-slate-950">
                                {row.booking.booking_reference ?? `Booking #${row.booking.id}`}
                              </div>
                              <div className="mt-1 break-all text-xs text-slate-500">
                                {row.booking.duffel_order_id ?? "No Duffel order ID"}
                              </div>
                            </td>
                            <td className="border-t border-slate-100 px-4 py-4 align-top">
                              <div className="font-medium text-slate-900">
                                {row.booking.user?.name ?? "Guest"}
                              </div>
                              <div className="mt-1 break-all text-xs text-slate-500">
                                {row.booking.user?.email ?? "-"}
                              </div>
                            </td>
                            <td className="border-t border-slate-100 px-4 py-4 align-top">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-1.5 text-sm font-semibold tracking-tight text-blue-700">
                                  {changeSummary.currentOrigin ? <span>{changeSummary.currentOrigin}</span> : null}
                                  {changeSummary.currentOrigin && changeSummary.currentDestination ? (
                                    <ArrowRight className="h-4 w-4 shrink-0 text-blue-500" />
                                  ) : null}
                                  {changeSummary.currentDestination ? <span>{changeSummary.currentDestination}</span> : null}
                                  {changeSummary.routeChanged &&
                                  changeSummary.requestedOrigin &&
                                  changeSummary.requestedDestination ? (
                                    <>
                                      <ArrowRight className="h-4 w-4 shrink-0 text-blue-500" />
                                      <span>{changeSummary.requestedOrigin}</span>
                                      <ArrowRight className="h-4 w-4 shrink-0 text-blue-500" />
                                      <span>{changeSummary.requestedDestination}</span>
                                    </>
                                  ) : null}
                                </div>
                                <div className="text-xs leading-5 text-slate-500">
                                  {changeSummary.currentDate && changeSummary.requestedDate ? (
                                    <>
                                      <span>{formatShortDate(changeSummary.currentDate)}</span>
                                      <span className="mx-1 text-slate-400">→</span>
                                      <span>{formatShortDate(changeSummary.requestedDate)}</span>
                                    </>
                                  ) : changeSummary.requestedDate ? (
                                    <>Requested for {formatShortDate(changeSummary.requestedDate)}</>
                                  ) : changeSummary.currentDate ? (
                                    <>Current departure {formatShortDate(changeSummary.currentDate)}</>
                                  ) : (
                                    changeSummary.detail
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="border-t border-slate-100 px-4 py-4 align-top whitespace-nowrap font-semibold text-slate-900">
                              {amountLabel}
                            </td>
                            <td className="border-t border-slate-100 px-4 py-4 align-top whitespace-nowrap text-sm text-slate-600">
                              {formatDate(row.requestedAt)}
                            </td>
                            <td className="border-t border-slate-100 px-4 py-4 align-top">
                              <WorkflowStatusBadge status={row.rawStatus} label={row.statusLabel} />
                              <div className="mt-2 text-xs text-slate-500">
                                {row.approvedAt ? `Approved ${formatDate(row.approvedAt)}` : null}
                                {row.rejectedAt ? `Rejected ${formatDate(row.rejectedAt)}` : null}
                              </div>
                            </td>
                            <td className="border-t border-slate-100 px-4 py-4 align-top">
                              <div className="relative flex items-center justify-end">
                                <button
                                  type="button"
                                  aria-label="Open request actions"
                                  aria-expanded={openMenuKey === row.key}
                                  onClick={() =>
                                    setOpenMenuKey((current) => (current === row.key ? null : row.key))
                                  }
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-transparent text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>

                                {openMenuKey === row.key ? (
                                  <div className="absolute right-0 top-11 z-30 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-xl shadow-slate-900/10">
                                    <Link
                                      href={bookingHref}
                                      className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                    >
                                      {isPending ? "Review request" : "View details"}
                                    </Link>
                                    {row.canApprove ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenMenuKey(null);
                                            void handleWorkflowAction(row, "approve");
                                          }}
                                          disabled={actionKey === `${row.booking.id}:approve`}
                                          className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                                        >
                                          {actionKey === `${row.booking.id}:approve`
                                            ? "Approving..."
                                            : "Approve request"}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenMenuKey(null);
                                            void handleWorkflowAction(row, "reject");
                                          }}
                                          disabled={actionKey === `${row.booking.id}:reject`}
                                          className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                                        >
                                          {actionKey === `${row.booking.id}:reject`
                                            ? "Rejecting..."
                                            : "Reject request"}
                                        </button>
                                      </>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <div className="flex items-center justify-between border-t border-slate-200 px-4 py-4">
                    <p className="text-sm text-slate-500">
                      Showing <span className="font-medium text-slate-700">1–{workflowRows.length}</span> of{" "}
                      <span className="font-medium text-slate-700">{workflowRows.length}</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-300"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-500 bg-blue-50 text-sm font-semibold text-blue-700"
                      >
                        1
                      </button>
                      <button
                        type="button"
                        disabled
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-300"
                      >
                        ›
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </SurfaceCard>
        </div>

        <div id="approval-workflow" className="h-fit xl:sticky xl:top-6">
          <SurfaceCard title="Approval workflow" description="Track each request through the approval process.">
            <div className="space-y-4">
              <TimelineStep
                icon={CalendarClock}
                title="Requested"
                description="Customer submits an itinerary change request."
                active
              />
              <TimelineStep
                icon={CheckCircle2}
                title="Approved"
                description="Tenant admin reviews and approves the request."
              />
              <TimelineStep
                icon={Plane}
                title="Provider confirmation"
                description="Airline or provider confirms the changes."
              />
              <TimelineStep
                icon={CircleCheckBig}
                title="Completed"
                description="Changes are applied and the booking is updated."
                last
              />
            </div>
          </SurfaceCard>
        </div>
      </div>
    </AdminPage>
  );
}

function SummaryCard({
  label,
  value,
  note,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  tone: "amber" | "blue" | "emerald" | "rose";
}) {
  const tones = {
    amber: {
      icon: "bg-amber-50 text-amber-500 ring-amber-100",
      note: "text-amber-600",
    },
    blue: {
      icon: "bg-blue-50 text-blue-600 ring-blue-100",
      note: "text-slate-500",
    },
    emerald: {
      icon: "bg-emerald-50 text-emerald-600 ring-emerald-100",
      note: "text-emerald-600",
    },
    rose: {
      icon: "bg-rose-50 text-rose-600 ring-rose-100",
      note: "text-rose-600",
    },
  } as const;

  return (
    <div className="flex min-h-[118px] items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ring-1 ${tones[tone].icon}`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="mt-1 text-2xl font-semibold leading-none tracking-tight text-slate-950">{value}</p>
        <p className={`mt-2 text-xs font-medium ${tones[tone].note}`}>{note}</p>
      </div>
    </div>
  );
}

function WorkflowStatusBadge({ status, label }: { status: string; label: string }) {
  const styles =
    status === "requested"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : status === "approved"
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : status === "confirmed"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : status === "rejected"
            ? "border-rose-200 bg-rose-50 text-rose-700"
            : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${styles}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status === "requested" ? "Pending review" : label}
    </span>
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
    amountText: formatMoney(
      booking.amounts?.total?.amount ??
        booking.amounts?.order_total?.amount ??
        booking.amounts?.grand_total?.amount,
      booking.amounts?.total?.currency ??
        booking.amounts?.order_total?.currency ??
        booking.amounts?.grand_total?.currency
    ),
    canApprove: rawStatus === "requested",
    canReject: rawStatus === "requested",
  };
}

function getWorkflowSearchText(row: WorkflowRow) {
  return [
    row.booking.booking_reference,
    row.booking.duffel_order_id,
    row.booking.user?.name,
    row.booking.user?.email,
    row.rawStatus,
    row.statusLabel,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function matchesDateFilter(value: string | null | undefined, filter: string) {
  if (filter === "All dates") return true;
  if (!value) return false;

  const requestedDate = new Date(value);
  if (Number.isNaN(requestedDate.getTime())) return false;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const requestedDay = new Date(
    requestedDate.getFullYear(),
    requestedDate.getMonth(),
    requestedDate.getDate()
  );

  if (filter === "Today") return requestedDay.getTime() === startOfToday.getTime();

  const rangeInDays = filter === "Last 7 days" ? 7 : filter === "Last 30 days" ? 30 : 0;
  if (!rangeInDays) return true;

  const rangeStart = new Date(startOfToday);
  rangeStart.setDate(rangeStart.getDate() - (rangeInDays - 1));
  return requestedDate >= rangeStart && requestedDate <= now;
}

function getRequestedChangeSummary(booking: BookingListItem) {
  const workflow = booking.meta?.change;
  if (!workflow || typeof workflow !== "object") {
    return {
      currentRoute: "Itinerary change",
      currentOrigin: null,
      currentDestination: null,
      requestedRoute: "",
      requestedOrigin: null,
      requestedDestination: null,
      currentDate: null,
      requestedDate: null,
      routeChanged: false,
      detail: "Details available after review",
    };
  }

  const workflowRecord = workflow as Record<string, unknown>;
  const currentSlice = getCurrentOfferSlice(booking.meta?.offer);
  const requestedSlice =
    getWorkflowChangeSlice(getNestedObject(workflowRecord, ["request_payload"])) ??
    getWorkflowChangeSlice(getNestedObject(workflowRecord, ["change_response", "data"])) ??
    getWorkflowChangeSlice(getNestedObject(workflowRecord, ["latest_order_snapshot"]));

  const currentOrigin = getIataCode(currentSlice?.origin);
  const currentDestination = getIataCode(currentSlice?.destination);
  const currentDate = readWorkflowText(currentSlice, ["departing_at", "departure_date"]);

  const requestedOrigin = getIataCode(requestedSlice?.origin);
  const requestedDestination = getIataCode(requestedSlice?.destination);
  const requestedDate = readWorkflowText(requestedSlice, ["departing_at", "departure_date"]);

  const routeChanged =
    Boolean(currentOrigin && requestedOrigin && currentOrigin !== requestedOrigin) ||
    Boolean(currentDestination && requestedDestination && currentDestination !== requestedDestination);

  const currentRoute = formatRouteLabel(currentOrigin, currentDestination);
  const requestedRoute = formatRouteLabel(requestedOrigin, requestedDestination);
  const routeTitle =
    routeChanged && requestedRoute ? `${currentRoute} → ${requestedRoute}` : currentRoute;

  if (currentDate && requestedDate) {
    const sameRouteAndDate =
      !routeChanged &&
      currentOrigin === requestedOrigin &&
      currentDestination === requestedDestination &&
      currentDate === requestedDate;

    return {
      currentRoute: currentRoute || "Itinerary change",
      currentOrigin,
      currentDestination,
      requestedRoute: requestedRoute || "",
      requestedOrigin,
      requestedDestination,
      currentDate,
      requestedDate,
      routeChanged,
      detail: sameRouteAndDate
        ? `${formatShortDate(currentDate)}`
        : `${formatShortDate(currentDate)} → ${formatShortDate(requestedDate)}`,
    };
  }

  if (requestedDate) {
    return {
      currentRoute: currentRoute || "Itinerary change",
      currentOrigin,
      currentDestination,
      requestedRoute: requestedRoute || "",
      requestedOrigin,
      requestedDestination,
      currentDate,
      requestedDate,
      routeChanged,
      detail: `Requested for ${formatShortDate(requestedDate)}`,
    };
  }

  if (currentDate) {
    return {
      currentRoute: currentRoute || "Itinerary change",
      currentOrigin,
      currentDestination,
      requestedRoute: requestedRoute || "",
      requestedOrigin,
      requestedDestination,
      currentDate,
      requestedDate,
      routeChanged,
      detail: `Current departure ${formatShortDate(currentDate)}`,
    };
  }

  return {
    currentRoute: routeTitle || "Itinerary change",
    currentOrigin,
    currentDestination,
    requestedRoute: "",
    requestedOrigin,
    requestedDestination,
    currentDate,
    requestedDate,
    routeChanged,
    detail: "Open booking to review requested changes",
  };
}

function getCurrentOfferSlice(source: unknown) {
  if (!source || typeof source !== "object") return null;

  const record = source as Record<string, unknown>;
  const slices = record.slices;
  if (!Array.isArray(slices) || slices.length === 0) return null;

  return (slices[0] as Record<string, unknown> | null | undefined) ?? null;
}

function getWorkflowChangeSlice(source: unknown) {
  if (!source || typeof source !== "object") return null;

  const record = source as Record<string, unknown>;
  const slices = record.slices;
  if (!slices || typeof slices !== "object") return null;

  const add = (slices as Record<string, unknown>).add;
  if (!Array.isArray(add) || add.length === 0) return null;

  return (add[0] as Record<string, unknown> | null | undefined) ?? null;
}

function getNestedObject(source: unknown, path: string[]) {
  let current: unknown = source;

  for (const key of path) {
    if (!current || typeof current !== "object") return null;
    current = (current as Record<string, unknown>)[key];
  }

  return current && typeof current === "object" ? current : null;
}

function getIataCode(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  return readWorkflowText(record, ["iata_code", "code", "origin_code", "destination_code"]);
}

function formatRouteLabel(origin?: string | null, destination?: string | null) {
  if (origin && destination) return `${origin} → ${destination}`;
  return origin || destination || "Itinerary change";
}

function readWorkflowText(workflow: Record<string, unknown> | null | undefined, keys: string[]) {
  if (!workflow) return null;

  for (const key of keys) {
    const value = workflow[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return null;
}

function formatShortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
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

function TimelineStep({
  icon: Icon,
  title,
  description,
  active = false,
  last = false,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  active?: boolean;
  last?: boolean;
}) {
  return (
    <div className="relative flex gap-3 pb-2">
      {!last ? (
        <span className="absolute left-5 top-10 h-[calc(100%-24px)] border-l border-dashed border-slate-300" />
      ) : null}
      <div
        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
          active ? "border-blue-200 bg-blue-50 text-blue-600" : "border-slate-200 bg-slate-50 text-slate-500"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-950">{title}</div>
        <div className="mt-1 text-sm leading-6 text-slate-500">{description}</div>
      </div>
    </div>
  );
}

function getBookingDetailsHref(booking: BookingListItem, tenantKey: string) {
  if (tenantKey) {
    return `/bookings/${booking.id}?tenantKey=${encodeURIComponent(tenantKey)}`;
  }

  if (booking.tenant?.key) {
    return `/bookings/${booking.id}?tenantKey=${encodeURIComponent(booking.tenant.key)}`;
  }

  if (booking.tenant_key) {
    return `/bookings/${booking.id}?tenantKey=${encodeURIComponent(booking.tenant_key)}`;
  }

  return `/bookings/${booking.id}`;
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
