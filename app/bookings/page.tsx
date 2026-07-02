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

function normalizeStatus(value?: string | null) {
  return (value ?? "").toLowerCase().trim();
}

function getBookingDisplayState(item: BookingListItem) {
  const cancellationStatus = normalizeStatus(item.cancellation_status);
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
          : display.key === "pending" || display.key === "cancellation-requested"
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${styles}`}>
      {display.label}
    </span>
  );
}

function BookingCard({ item }: { item: BookingListItem }) {
  const reference = item.booking_reference || item.duffel_order_id || "-";
  const total = formatMoney(item.amounts?.total?.amount, item.amounts?.total?.currency);

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_18px_46px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip item={item} />
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Reservation
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Booking reference
              </p>
              <h2 className="mt-1 break-all text-lg font-extrabold tracking-tight text-slate-950">
                {reference}
              </h2>
            </div>

            <div className="hidden flex-1 items-center px-6 lg:flex">
              <div className="h-px flex-1 bg-gradient-to-r from-slate-200 via-blue-200 to-slate-200" />
              <div className="mx-3 flex h-9 w-9 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-600">
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
                  <path d="M10.5 19.5 21 12 10.5 4.5v5L3 7v10l7.5-2.5v5Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-200 via-blue-200 to-slate-200" />
            </div>

            <div className="sm:text-right">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Total paid
              </p>
              <p className="mt-1 text-xl font-extrabold tracking-tight text-slate-950">
                {total}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 text-xs text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="font-semibold text-slate-900">Created:</span> {formatDate(item.created_at)}
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="font-semibold text-slate-900">Void window:</span> {formatDate(item.void_window_ends_at)}
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2 text-blue-700">
              Secure booking record
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
          <Link
            href={`/bookings/${item.id}`}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-[0_10px_24px_rgba(37,99,235,0.20)] transition hover:-translate-y-0.5 hover:bg-blue-700"
          >
            View details
          </Link>
        </div>
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
  const tenantBootstrap = useSelector((s: RootState) => s.tenantBootstrap.tenant);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<BookingListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const tenantKey = useMemo(
    () =>
      tenantBootstrap?.key ??
      authUser?.tenant_key ??
      authUser?.tenants?.[0]?.key ??
      "",
    [authUser?.tenant_key, authUser?.tenants, tenantBootstrap?.key]
  );
  const email = authUser?.email ?? "";

  useEffect(() => {
    if (!tenantKey) {
      setError(
        "No tenant workspace is linked to this account yet. Booking history will appear here once a tenant context is available.",
      );
      setItems([]);
      return;
    }

    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchBookings({
          tenantKey,
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
  }, [email, page, tenantKey]);

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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_34%),linear-gradient(180deg,#f8fbff_0%,#f8fafc_45%,#ffffff_100%)]">
      <div className="mx-auto w-full max-w-screen-xl px-4 py-6 sm:px-6 lg:py-8">
        <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-sky-500 p-5 text-white sm:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-100">
                  My bookings
                </div>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Booking history
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                  View reservations, booking references, cancellation status, and payment totals from one secure dashboard.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:flex">
                <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-100">Total</div>
                  <div className="mt-1 text-2xl font-extrabold">{total}</div>
                </div>
                <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-100">Account</div>
                  <div className="mt-1 max-w-[180px] truncate text-sm font-bold">{email || "Signed in"}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-slate-950">Your reservations</h2>
              <p className="mt-1 text-sm text-slate-500">
                {loading ? "Loading bookings..." : `${filteredItems.length} of ${total} booking(s) shown`}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,260px)_160px]">
              <label className="relative block">
                <span className="sr-only">Search bookings</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search reference or order ID"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
                />
              </label>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
              >
                <option value="all">All statuses</option>
                <option value="booked">Booked</option>
                <option value="cancellation-requested">Cancellation Requested</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="refund-pending">Cancelled · Refund Pending</option>
                <option value="cancelled-no-refund">Cancelled · No Refund</option>
                <option value="refund-unknown">Cancelled · Refund Unknown</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5">
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
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <BookingCard key={item.id} item={item} />
              ))}
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

