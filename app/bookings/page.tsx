// Polished OTA-style Booking History + Booking Details pages
// Replace your two existing pages with the matching sections below.
// Business logic, API calls, Redux access, cancellation flow, pagination, and routing are preserved.

/* -------------------------------------------------------------------------- */
/* bookings/page.tsx                                                          */
/* -------------------------------------------------------------------------- */

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/src/shared/redux/store";
import {
  fetchBookings,
  type BookingListItem,
} from "@/src/api/routes/orders/bookings";
import Pagination from "@/src/shared/components/flights/Pagination";

function formatMoney(
  amount?: string | number | null,
  currency?: string | null
): string {
  if (amount == null) return "-";
  const numeric = Number(amount);
  const safeAmount = Number.isFinite(numeric) ? numeric : 0;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(safeAmount);
  } catch {
    return `${currency ?? ""} ${safeAmount.toFixed(2)}`.trim();
  }
}

function getBookingMoney(order: BookingListItem | null | undefined) {
  const totals = order?.amounts;
  const candidates = [
    totals?.grand_total,
    totals?.order_total,
    totals?.total,
  ];

  const selected = candidates.find(
    (entry): entry is { amount?: string | number | null; currency?: string | null } =>
      Boolean(entry && entry.amount != null)
  );

  return {
    amount: selected?.amount ?? null,
    currency:
      selected?.currency ??
      totals?.grand_total?.currency ??
      totals?.order_total?.currency ??
      totals?.total?.currency ??
      null,
  };
}

function formatDate(value?: string | null): string {
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

function getAgencyLabel(item: BookingListItem) {
  return (
    item.tenant?.name?.trim() ||
    item.tenant_name?.trim() ||
    item.tenant_key?.trim() ||
    (item.tenant_id ? `Agency #${item.tenant_id}` : "") ||
    "Agency unavailable"
  );
}

function normalizeStatus(value?: string | null) {
  return (value ?? "").toLowerCase().trim();
}

function getBookingDisplayState(item: BookingListItem) {
  const rescheduleStatus = normalizeStatus(
    item.meta?.change?.status
  );
  const cancellationStatus = normalizeStatus(item.meta?.cancellation?.status);
  const refundStatus = normalizeStatus(item.refund_status);
  const status = normalizeStatus(item.status);

  if (refundStatus === "refunded" || status === "refunded") {
    return { key: "refunded", label: "Refunded" };
  }

  if (cancellationStatus === "cancelled") {
    if (refundStatus === "refund pending") {
      return { key: "refund-pending", label: "Cancelled · Refund Pending" };
    }

    if (refundStatus === "refund unknown") {
      return { key: "refund-unknown", label: "Cancelled · Refund Unknown" };
    }

    if (refundStatus === "no refund") {
      return { key: "cancelled-no-refund", label: "Cancelled · No Refund" };
    }

    return { key: "cancelled", label: "Cancelled" };
  }

  if (cancellationStatus === "cancellation requested" || status === "cancellation requested") {
    return { key: "cancellation-requested", label: "Cancellation Requested" };
  }

  if (cancellationStatus === "approved") {
    return { key: "cancellation-approved", label: "Cancellation Approved" };
  }

  if (cancellationStatus === "rejected") {
    return { key: "cancellation-rejected", label: "Cancellation Not Permitted" };
  }

  if (rescheduleStatus === "requested") {
    return { key: "reschedule-requested", label: "Reschedule Requested" };
  }

  if (rescheduleStatus === "approved") {
    return { key: "reschedule-approved", label: "Reschedule Approved" };
  }

  if (rescheduleStatus === "rejected") {
    return { key: "reschedule-rejected", label: "Reschedule Not Permitted" };
  }

  if (status === "rescheduled" || status === "changed") {
    return { key: "rescheduled", label: "Rescheduled" };
  }

  if (status === "created" || status === "booked" || status === "confirmed") {
    return { key: "booked", label: "Booked" };
  }

  if (status === "pending") {
    return { key: "pending", label: "Pending" };
  }

  return {
    key: status || "unknown",
    label: item.status || "Unknown",
  };
}

function StatusChip({ item }: { item: BookingListItem }) {
  const display = getBookingDisplayState(item);
  const styles =
      display.key === "booked"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : display.key === "cancelled" ||
          display.key === "cancelled-no-refund" ||
          display.key === "refund-pending" ||
          display.key === "refund-unknown"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : display.key === "refunded"
          ? "border-sky-200 bg-sky-50 text-sky-700"
          : display.key === "rescheduled"
            ? "border-indigo-200 bg-indigo-50 text-indigo-700"
            : display.key === "pending" ||
                display.key === "cancellation-requested" ||
                display.key === "reschedule-requested" ||
                display.key === "reschedule-approved"
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : display.key === "cancellation-approved"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : display.key === "reschedule-rejected" ||
                    display.key === "cancellation-rejected"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] ${styles}`}
    >
      {display.label}
    </span>
  );
}

function BookingCard({ item }: { item: BookingListItem }) {
  const reference = item.booking_reference || item.duffel_order_id || "-";
  const bookingMoney = getBookingMoney(item);
  const total = formatMoney(bookingMoney.amount, bookingMoney.currency);
  const agencyLabel = getAgencyLabel(item);
  const detailsHref = item.tenant_key
    ? `/bookings/${item.id}?tenantKey=${encodeURIComponent(item.tenant_key)}`
    : item.tenant?.key
      ? `/bookings/${item.id}?tenantKey=${encodeURIComponent(item.tenant.key)}`
      : `/bookings/${item.id}`;

  return (
    <article className="group overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_22px_50px_rgba(37,99,235,0.12)]">
      <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[1.7fr_1fr] lg:gap-6 lg:p-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip item={item} />
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
              Reservation
            </span>
          </div>

          <div className="mt-4 flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 ring-1 ring-amber-100">
              <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 16.5 3 11l.75-2.5L8 10.2 12.5 4h2l-1.25 7 4.75 1.5 2.5-2 .5 1.5-1.5 4.5Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Booking reference
              </p>
              <h2 className="mt-1 break-all text-2xl font-black tracking-tight text-slate-950 sm:text-[2rem]">
                {reference}
              </h2>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Booked via</p>
                  <p className="mt-1 break-words text-sm font-semibold text-slate-900">{agencyLabel}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Created</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(item.created_at)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Void window</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(item.void_window_ends_at)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Secure record</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">Protected booking data</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="flex flex-col justify-between rounded-[22px] bg-gradient-to-br from-slate-50 to-white p-4 ring-1 ring-slate-200 sm:p-5">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Total paid
            </div>
            <div className="mt-1 text-3xl font-black tracking-tight text-slate-950">
              {total}
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-600">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 7v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </span>
              Booking timeline available
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={detailsHref}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 px-5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 hover:from-blue-700 hover:to-sky-600"
            >
              View details
              <svg viewBox="0 0 24 24" fill="none" className="ml-2 h-4 w-4" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14" strokeLinecap="round" />
                <path d="m12 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </aside>
      </div>
    </article>
  );
}

function BookingsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((item) => (
        <div key={item} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="h-5 w-28 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-5 h-6 w-48 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BookingsPage() {
  const authUser = useSelector((s: RootState) => s.auth.user);
  const authStatus = useSelector((s: RootState) => s.auth.authStatus);
  const meChecked = useSelector((s: RootState) => s.auth.meChecked);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<BookingListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const email = authUser?.email ?? "";
  const authIsReady = authStatus !== "unknown" && meChecked;

  useEffect(() => {
    if (!authIsReady) {
      return;
    }

    if (!email) {
      setError(
        authStatus === "guest"
          ? "Please sign in to view your booking history."
          : "Your account email is missing, so booking history cannot be loaded.",
      );
      setItems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchBookings({
          email: email || undefined,
          page,
        });

        if (cancelled) return;
        setItems(result.data ?? []);
        setTotalPages(result.meta?.last_page ?? 1);
        setTotal(result.meta?.total ?? 0);
      } catch (fetchError: unknown) {
        if (cancelled) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load bookings."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [authIsReady, authStatus, email, page]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !query ||
        item.booking_reference?.toLowerCase().includes(query) ||
        item.duffel_order_id?.toLowerCase().includes(query) ||
        String(item.id).toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || getBookingDisplayState(item).key === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_26%),linear-gradient(180deg,#f9fbff_0%,#f6f8fc_44%,#ffffff_100%)]">
      <div className="mx-auto w-full max-w-[1480px] px-4 py-5 sm:px-6 lg:py-8">
        <header className="mb-5 hidden items-center justify-between rounded-full border border-white/70 bg-white/75 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">
              FP
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Flight Portal</div>
              <div className="text-[11px] font-medium text-slate-500">Your reservations</div>
            </div>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <span className="text-xs font-semibold text-slate-500">For Agents</span>
            <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 3v2" strokeLinecap="round" />
                <path d="M12 19v2" strokeLinecap="round" />
                <path d="M5.64 5.64 7.05 7.05" strokeLinecap="round" />
                <path d="M16.95 16.95 18.36 18.36" strokeLinecap="round" />
                <path d="M3 12h2" strokeLinecap="round" />
                <path d="M19 12h2" strokeLinecap="round" />
                <path d="M5.64 18.36 7.05 16.95" strokeLinecap="round" />
                <path d="M16.95 7.05 18.36 5.64" strokeLinecap="round" />
                <circle cx="12" cy="12" r="4.2" />
              </svg>
            </button>
            <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="8" r="3.2" />
                <path d="M5 20c1.8-3.8 12.2-3.8 14 0" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </header>

        <section className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_18px_50px_rgba(37,99,235,0.08)]">
          <div className="relative overflow-hidden bg-[linear-gradient(135deg,#2f58eb_0%,#2550ea_52%,#0ea5e9_100%)] px-5 py-7 text-white sm:px-7 sm:py-8">
            <div className="pointer-events-none absolute inset-0 opacity-30">
              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
              <div className="absolute bottom-0 left-1/4 h-32 w-32 rounded-full bg-sky-300/30 blur-3xl" />
            </div>
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-100">
                  My bookings
                </div>
                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                  Booking history
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 sm:text-[15px]">
                  View reservations, booking reference, cancellation status, and payment totals from one secure dashboard.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
                <div className="rounded-2xl border border-white/12 bg-white/14 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/14">
                      <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5" stroke="currentColor" strokeWidth="1.8">
                        <path d="M4 7h16v10H4z" />
                        <path d="M8 3v4M16 3v4" strokeLinecap="round" />
                      </svg>
                    </span>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-100">Total bookings</div>
                      <div className="mt-1 text-2xl font-black">{total}</div>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/12 bg-white/14 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/14">
                      <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5" stroke="currentColor" strokeWidth="1.8">
                        <circle cx="12" cy="8" r="3.5" />
                        <path d="M5.5 20c1.5-3.8 11.5-3.8 13 0" strokeLinecap="round" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-100">Account</div>
                      <div className="mt-1 truncate text-sm font-semibold">{email || "Signed in user"}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-950">Your reservations</h2>
              <p className="mt-1 text-sm text-slate-500">
                {loading ? "Fetching bookings..." : `${filteredItems.length} of ${total} booking(s) shown`}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,280px)_170px]">
              <label className="relative block">
                <span className="sr-only">Search bookings</span>
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="11" cy="11" r="6.5" />
                    <path d="M16 16l4 4" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by reference or order ID..."
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-10 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
                />
              </label>

              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
                >
                  <option value="all">All statuses</option>
                  <option value="booked">Booked</option>
                  <option value="cancellation-requested">Cancellation Requested</option>
                  <option value="reschedule-requested">Reschedule Requested</option>
                  <option value="reschedule-approved">Reschedule Approved</option>
                  <option value="reschedule-rejected">Reschedule Not Permitted</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rescheduled">Rescheduled</option>
                  <option value="refund-pending">Cancelled · Refund Pending</option>
                  <option value="cancelled-no-refund">Cancelled · No Refund</option>
                  <option value="refund-unknown">Cancelled · Refund Unknown</option>
                  <option value="refunded">Refunded</option>
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
                    <path d="m7 10 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)] backdrop-blur sm:p-5">
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-medium text-rose-700">
              {error}
            </div>
          ) : null}

          {loading ? <BookingsSkeleton /> : null}

          {!loading && !error && filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="1.8">
                  <path d="M10.5 19.5 21 12 10.5 4.5v5L3 7v10l7.5-2.5v5Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-extrabold text-slate-950">No bookings found</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Your reservations will appear here once a booking is created. Try clearing filters if you are searching for an existing booking.
              </p>
            </div>
          ) : null}

          {!loading && !error && filteredItems.length > 0 ? (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <BookingCard key={item.id} item={item} />
              ))}
            </div>
          ) : null}

          {!loading && !error ? (
            <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,rgba(59,130,246,0.08),rgba(14,165,233,0.04))] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm ring-1 ring-blue-100">
                    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="1.7">
                      <path d="M4 19h16M6 17V8l6-4 6 4v9" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10 19v-5h4v5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight text-slate-950">Need help with your booking?</h3>
                    <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
                      Our support team is here to help you 24/7.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-blue-200 bg-white px-4 text-sm font-bold text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
                >
                  Contact support
                  <svg viewBox="0 0 24 24" fill="none" className="ml-2 h-4 w-4" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14" strokeLinecap="round" />
                    <path d="m12 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          ) : null}

          {!error && totalPages > 1 ? (
            <div className="mt-5 flex justify-center border-t border-slate-100 pt-5">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                size="sm"
              />
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */

