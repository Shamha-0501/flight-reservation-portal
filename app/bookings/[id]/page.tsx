"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/src/shared/redux/store";
import {
  fetchBookingDetails,
  type BookingListItem,
} from "@/src/api/routes/orders/bookings";
import {
  confirmOrderCancellation,
  confirmOrderRefund,
  createOrderCancellation,
  getOrderCancellation,
  getOrderRefundableStatus,
  type OrderCancellationResponse,
  type OrderRefundableStatusResponse,
} from "@/src/api/routes/orders/cancellation";

function formatMoneyDetails(
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

function formatDateDetails(value?: string | null): string {
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

function parseNumericAmount(value?: string | number | null) {
  if (value == null) return null;
  const numeric =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/[^0-9.-]+/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
}

function getRefundBeforeDeparture(
  value: OrderRefundableStatusResponse | null
) {
  if (!value) return null;

  if (value.refund_before_departure) {
    return value.refund_before_departure;
  }

  const direct = value as {
    allowed?: boolean;
    penalty_amount?: string | number | null;
    penalty_currency?: string | null;
  };

  if (
    typeof direct.allowed === "boolean" ||
    direct.penalty_amount != null ||
    direct.penalty_currency != null
  ) {
    return {
      allowed: direct.allowed,
      penalty_amount: direct.penalty_amount,
      penalty_currency: direct.penalty_currency,
    };
  }

  return null;
}

function normalizeStatusDetails(value?: string | null) {
  return (value ?? "").toLowerCase().trim();
}

function getBookingDisplayState(order?: BookingListItem | null) {
  const cancellationStatus = normalizeStatusDetails(order?.cancellation_status);
  const refundStatus = normalizeStatusDetails(order?.refund_status);
  const status = normalizeStatusDetails(order?.status);

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

  if (
    cancellationStatus === "cancellation requested" ||
    status === "cancellation requested"
  ) {
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
    label: order?.status || "Unknown",
  };
}

function DetailStatusChip({
  status,
  cancellationStatus,
  refundStatus,
}: {
  status?: string | null;
  cancellationStatus?: string | null;
  refundStatus?: string | null;
}) {
  const display = getBookingDisplayState({
    status,
    cancellation_status: cancellationStatus,
    refund_status: refundStatus,
  } as BookingListItem);
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
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${styles}`}>
      {display.label}
    </span>
  );
}

function InfoCardDetails({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 break-all text-sm font-bold text-slate-950">{value}</div>
    </div>
  );
}

function SectionCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {eyebrow ? (
        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600">
          {eyebrow}
        </div>
      ) : null}
      <h2 className="mt-1 text-lg font-extrabold tracking-tight text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function BookingTimeline({
  status,
  cancellationStatus,
  refundStatus,
}: {
  status?: string | null;
  cancellationStatus?: string | null;
  refundStatus?: string | null;
}) {
  const normalized = normalizeStatusDetails(status);
  const normalizedCancellation = normalizeStatusDetails(cancellationStatus);
  const normalizedRefund = normalizeStatusDetails(refundStatus);
  const steps = [
    { label: "Booking created", active: true },
    { label: "Payment recorded", active: normalized !== "pending" },
    {
      label: "Cancellation requested",
      active: normalizedCancellation === "cancellation requested",
    },
    {
      label: "Cancelled",
      active: normalizedCancellation === "cancelled" || normalized === "cancelled",
    },
    {
      label: "Refund completed",
      active: normalizedRefund === "refunded" || normalized === "refunded",
    },
  ];

  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div key={step.label} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold ${step.active ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-50 text-slate-400"}`}>
              {step.active ? "✓" : index + 1}
            </div>
            {index < steps.length - 1 ? <div className="mt-2 h-6 w-px bg-slate-200" /> : null}
          </div>
          <div className="pt-1.5 text-sm font-semibold text-slate-700">{step.label}</div>
        </div>
      ))}
    </div>
  );
}

function PassengerCard({ passenger }: { passenger: NonNullable<BookingListItem["passengers"]>[number] }) {
  const name = `${passenger.title ? `${passenger.title} ` : ""}${passenger.given_name ?? ""} ${passenger.family_name ?? ""}`.trim();

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-extrabold text-slate-950">{name || "Passenger"}</div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            {passenger.type || "passenger"}
          </div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
            <path d="M20 21a8 8 0 0 0-16 0" strokeLinecap="round" />
            <path d="M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function BookingDetailsPage() {
  const params = useParams<{ id: string }>();
  const tenantBootstrap = useSelector((s: RootState) => s.tenantBootstrap.tenant);
  const authUser = useSelector((s: RootState) => s.auth.user);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<BookingListItem | null>(null);
  const [cancellationOpen, setCancellationOpen] = useState(false);
  const [cancellationStep, setCancellationStep] = useState<"status" | "review">(
    "status"
  );
  const [refundabilityLoading, setRefundabilityLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [confirmingCancellation, setConfirmingCancellation] = useState(false);
  const [cancellationError, setCancellationError] = useState<string | null>(null);
  const [cancellationPayload, setCancellationPayload] = useState<Record<string, unknown> | null>(null);
  const [cancellationQuote, setCancellationQuote] =
    useState<OrderCancellationResponse["quote"] | null>(null);
  const [cancellationId, setCancellationId] = useState<string | null>(null);
  const [cancellationSuccess, setCancellationSuccess] = useState<string | null>(null);
  const [confirmingRefund, setConfirmingRefund] = useState(false);
  const [refundabilityStatus, setRefundabilityStatus] =
    useState<OrderRefundableStatusResponse | null>(null);

  const tenantKey = useMemo(
    () =>
      tenantBootstrap?.key ??
      authUser?.tenant_key ??
      authUser?.tenants?.[0]?.key ??
      "",
    [authUser?.tenant_key, authUser?.tenants, tenantBootstrap?.key]
  );

  const bookingId = params?.id;

  const loadBookingDetails = async (id: string, tenantKeyValue: string) => {
    const result = await fetchBookingDetails({ id, tenantKey: tenantKeyValue });
    setOrder(result);
    return result;
  };

  useEffect(() => {
    const id = bookingId;
    if (!id) return;
    if (!tenantKey) {
      setError("Tenant key is missing. Unable to load booking.");
      return;
    }

    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchBookingDetails({ id, tenantKey });
        if (cancelled) return;
        setOrder(result);
      } catch (fetchError: unknown) {
        if (cancelled) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load booking details."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [bookingId, tenantKey]);

  const orderDisplayState = getBookingDisplayState(order);
  const isCancelled =
    normalizeStatusDetails(order?.cancellation_status) === "cancelled" ||
    orderDisplayState.key === "cancelled" ||
    orderDisplayState.key === "cancelled-no-refund" ||
    orderDisplayState.key === "refund-pending" ||
    orderDisplayState.key === "refund-unknown" ||
    orderDisplayState.key === "refunded";
  const canConfirmRefund =
    normalizeStatusDetails(order?.cancellation_status) === "cancelled" &&
    normalizeStatusDetails(order?.refund_status) === "refund pending";

  const totalAmount = formatMoneyDetails(order?.amounts?.total?.amount, order?.amounts?.total?.currency);
  const refundBeforeDeparture = getRefundBeforeDeparture(refundabilityStatus);
  const penaltyAmount = parseNumericAmount(refundBeforeDeparture?.penalty_amount) ?? 0;
  const penaltyCurrency =
    refundBeforeDeparture?.penalty_currency || order?.amounts?.total?.currency || "USD";
  const bookingTotalAmount = parseNumericAmount(order?.amounts?.total?.amount) ?? 0;
  const estimatedRefundAmount = Math.max(bookingTotalAmount - penaltyAmount, 0);

  const resetCancellationFlow = () => {
    setCancellationStep("status");
    setCancellationError(null);
    setCancellationSuccess(null);
    setCancellationPayload(null);
    setCancellationQuote(null);
    setCancellationId(null);
    setRefundabilityStatus(null);
  };

  const openCancellationQuote = async () => {
    if (isCancelled) {
      setCancellationError("This booking is already cancelled.");
      setCancellationOpen(true);
      return;
    }

    if (!order?.id) {
      setCancellationError("Local booking ID is missing for cancellation.");
      return;
    }

    setCancellationOpen(true);
    resetCancellationFlow();
    setRefundabilityLoading(true);

    try {
      const response = await getOrderRefundableStatus(order.id);
      setRefundabilityStatus(response);
    } catch (quoteError: unknown) {
      const rawMessage =
        quoteError instanceof Error
          ? quoteError.message
          : "Failed to fetch refundable status.";
      const normalizedMessage = rawMessage.toLowerCase();
      setCancellationError(
        normalizedMessage.includes("already cancelled") ||
          normalizedMessage.includes("already canceled")
          ? "This booking is already cancelled."
          : rawMessage
      );
    } finally {
      setRefundabilityLoading(false);
    }
  };

  const loadCancellationReview = async () => {
    if (!order?.id) {
      setCancellationError("Local booking ID is missing for cancellation.");
      return;
    }

    setCancellationError(null);
    setCancellationPayload(null);
    setCancellationId(null);
    setQuoteLoading(true);

    try {
      const response = await createOrderCancellation(order.id);
      const responseData = (response?.data ?? response) as Record<string, unknown>;
      const id =
        typeof responseData?.id === "string"
          ? responseData.id
          : typeof response.quote?.cancellation_id === "string"
            ? response.quote.cancellation_id
            : null;

      setCancellationPayload(responseData);
      setCancellationQuote(response.quote ?? null);
      setCancellationId(id);
      setCancellationStep("review");
    } catch (quoteError: unknown) {
      setCancellationError(
        quoteError instanceof Error
          ? quoteError.message
          : "Failed to prepare cancellation review."
      );
    } finally {
      setQuoteLoading(false);
    }
  };

  const runConfirmCancellation = async () => {
    if (!cancellationId) {
      setCancellationError("Cancellation ID is missing.");
      return;
    }
    if (!order?.id) {
      setCancellationError("Local booking ID is missing for cancellation.");
      return;
    }

    setConfirmingCancellation(true);
    setCancellationError(null);

    try {
      await confirmOrderCancellation({
        cancellationId,
        orderId: order.id,
      });
      const latest = await getOrderCancellation(cancellationId);
      const latestData = (latest?.data ?? latest) as Record<string, unknown>;
      setCancellationPayload(latestData);
      setCancellationQuote(latest.quote ?? null);
      setCancellationSuccess("Cancellation confirmed successfully.");
      if (bookingId && tenantKey) {
        await loadBookingDetails(bookingId, tenantKey);
      }
    } catch (confirmError: unknown) {
      setCancellationError(
        confirmError instanceof Error
          ? confirmError.message
          : "Failed to confirm cancellation."
      );
    } finally {
      setConfirmingCancellation(false);
    }
  };

  const runConfirmRefund = async () => {
    if (!order?.id) return;

    setConfirmingRefund(true);
    try {
      await confirmOrderRefund({ orderId: order.id });
      if (bookingId && tenantKey) {
        await loadBookingDetails(bookingId, tenantKey);
      }
    } catch (confirmError: unknown) {
      setCancellationError(
        confirmError instanceof Error
          ? confirmError.message
          : "Failed to confirm refund."
      );
    } finally {
      setConfirmingRefund(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_34%),linear-gradient(180deg,#f8fbff_0%,#f8fafc_45%,#ffffff_100%)]">
      <div className="mx-auto w-full max-w-screen-xl px-4 py-6 sm:px-6 lg:py-8">
        <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-sky-500 p-5 text-white sm:p-7">
            <Link href="/bookings" className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-blue-50 backdrop-blur transition hover:bg-white/15">
              ← Back to bookings
            </Link>

            <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-100">
                  Booking details
                </div>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Booking #{order?.booking_reference || order?.id || params?.id}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                  Manage reservation status, passengers, payment totals, cancellation eligibility, and booking references.
                </p>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur">
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-100">Total paid</div>
                <div className="mt-1 text-3xl font-extrabold">{totalAmount}</div>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          </section>
        ) : null}

        {error ? (
          <section className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-medium text-rose-700">
            {error}
          </section>
        ) : null}

        {!loading && !error && order ? (
          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <InfoCardDetails label="Reference" value={order.booking_reference || "-"} />
                <InfoCardDetails label="Duffel Order ID" value={order.duffel_order_id || "-"} />
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Status</div>
                  <div className="mt-2">
                    <DetailStatusChip
                      status={order.status}
                      cancellationStatus={order.cancellation_status}
                      refundStatus={order.refund_status}
                    />
                  </div>
                </div>
                <InfoCardDetails
                  label="Cancellation"
                  value={order.cancellation_status || "-"}
                />
                <InfoCardDetails
                  label="Refund"
                  value={order.refund_status || "-"}
                />
                <InfoCardDetails label="Total" value={totalAmount} />
              </section>

              <SectionCard eyebrow="Reservation" title="Important dates">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoCardDetails label="Created" value={formatDateDetails(order.created_at)} />
                  <InfoCardDetails label="Void window ends" value={formatDateDetails(order.void_window_ends_at)} />
                </div>
              </SectionCard>

              <SectionCard eyebrow="Travellers" title="Passengers">
                {(order.passengers ?? []).length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {order.passengers?.map((passenger) => (
                      <PassengerCard key={passenger.id} passenger={passenger} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    No passenger data available for this booking.
                  </div>
                )}
              </SectionCard>

              <SectionCard eyebrow="Payment" title="Fare breakdown">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-4 text-slate-600">
                      <span>Booking total</span>
                      <span className="font-bold text-slate-950">{totalAmount}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-slate-600">
                      <span>Currency</span>
                      <span className="font-bold text-slate-950">{order.amounts?.total?.currency || "-"}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-3">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-base font-extrabold text-slate-950">Total paid</span>
                        <span className="text-xl font-extrabold text-blue-700">{totalAmount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard eyebrow="Manage" title="Cancellation and refunds">
                <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-950">Need to cancel this booking?</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Cancellation may be irreversible and refund eligibility depends on the fare rules returned by the airline.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={openCancellationQuote}
                      disabled={isCancelled}
                      className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-rose-600 px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(225,29,72,0.20)] transition hover:-translate-y-0.5 hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      {isCancelled ? "Booking cancelled" : "Cancel booking"}
                    </button>
                  </div>

                  {isCancelled ? (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                      This booking has already been cancelled.
                    </div>
                  ) : null}

                  {canConfirmRefund ? (
                    <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-sm font-bold text-sky-900">
                            Refund pending
                          </div>
                          <p className="mt-1 text-sm leading-6 text-sky-800">
                            The booking is cancelled and the refund is waiting for confirmation in the local system.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={runConfirmRefund}
                          disabled={confirmingRefund}
                          className="inline-flex h-10 items-center justify-center rounded-xl bg-sky-600 px-4 text-sm font-bold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {confirmingRefund ? "Confirming..." : "Mark refund confirmed"}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </SectionCard>
            </div>

            <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600">Summary</div>
                <h2 className="mt-1 text-lg font-extrabold text-slate-950">Booking overview</h2>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-slate-500">Status</span>
                    <DetailStatusChip
                      status={order.status}
                      cancellationStatus={order.cancellation_status}
                      refundStatus={order.refund_status}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-slate-500">Cancellation</span>
                    <span className="font-bold text-slate-950">{order.cancellation_status || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-slate-500">Refund</span>
                    <span className="font-bold text-slate-950">{order.refund_status || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-slate-500">Reference</span>
                    <span className="break-all text-right font-bold text-slate-950">{order.booking_reference || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-slate-500">Passengers</span>
                    <span className="font-bold text-slate-950">{order.passengers?.length ?? 0}</span>
                  </div>
                  <div className="border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-semibold text-slate-500">Total</span>
                      <span className="text-xl font-extrabold text-blue-700">{totalAmount}</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600">Progress</div>
                <h2 className="mt-1 text-lg font-extrabold text-slate-950">Booking timeline</h2>
                <div className="mt-4">
                  <BookingTimeline
                    status={order.status}
                    cancellationStatus={order.cancellation_status}
                    refundStatus={order.refund_status}
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
                <h2 className="text-sm font-extrabold text-slate-950">Travel support</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Keep your booking reference ready when contacting support or requesting airline changes.
                </p>
              </section>
            </aside>
          </div>
        ) : null}
      </div>

      {cancellationOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-[2px]">
          <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-orange-400 to-amber-300" />

            <div className="border-b border-slate-100 bg-gradient-to-br from-rose-50/80 via-white to-white px-6 py-5">
              <div className="inline-flex items-center rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-rose-700">
                Cancellation quote
              </div>
              <h3 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight text-slate-950">
                Review before cancelling
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Confirm only after checking airline refund details and cancellation conditions.
              </p>
            </div>

            <div className="space-y-4 px-6 py-6">
              {refundabilityLoading ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Checking refundable status...
                </div>
              ) : null}

              {quoteLoading ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Preparing cancellation review...
                </div>
              ) : null}

              {cancellationError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {cancellationError}
                </div>
              ) : null}

              {cancellationSuccess ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {cancellationSuccess}
                </div>
              ) : null}

              {cancellationStep === "status" && !refundabilityLoading && refundBeforeDeparture ? (
                refundBeforeDeparture.allowed ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="text-sm font-bold text-emerald-900">
                        Refundable before departure
                      </div>
                      <p className="mt-1 text-sm leading-6 text-emerald-800">
                        This ticket can be cancelled before departure. Review the airline penalty and the estimated refundable amount before continuing.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoCardDetails
                        label="Penalty"
                        value={formatMoneyDetails(
                          refundBeforeDeparture.penalty_amount,
                          penaltyCurrency
                        )}
                      />
                      <InfoCardDetails
                        label="Estimated refund"
                        value={formatMoneyDetails(
                          estimatedRefundAmount,
                          order?.amounts?.total?.currency || penaltyCurrency
                        )}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                      <div className="text-sm font-bold text-rose-900">
                        Non-refundable ticket
                      </div>
                      <p className="mt-1 text-sm leading-6 text-rose-800">
                        This ticket is non-refundable. If you proceed, your booking will be cancelled and no refund will be issued.
                      </p>
                    </div>
                  </div>
                )
              ) : null}

              {cancellationStep === "status" &&
              !refundabilityLoading &&
              !refundBeforeDeparture &&
              !cancellationError ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Refundability details are not available for this booking yet.
                </div>
              ) : null}

              {cancellationStep === "review" && !quoteLoading && cancellationPayload ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                        Cancellation review
                      </div>
                      <div className="mt-2 text-sm text-slate-700">
                        Confirm only if you want the airline cancellation to proceed. This action may be irreversible depending on fare rules.
                      </div>
                    </div>

                    {cancellationQuote ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <InfoCardDetails
                          label="Refund amount"
                          value={formatMoneyDetails(
                            cancellationQuote.refund_amount,
                            cancellationQuote.refund_currency
                          )}
                        />
                        <InfoCardDetails
                          label="Cancellation fee"
                          value={formatMoneyDetails(
                            cancellationQuote.cancellation_fee,
                            cancellationQuote.cancellation_fee_currency
                          )}
                        />
                        <InfoCardDetails
                          label="Quote expires"
                          value={formatDateDetails(cancellationQuote.expires_at)}
                        />
                        <InfoCardDetails
                          label="Quote ID"
                          value={cancellationQuote.cancellation_id || "-"}
                        />
                      </div>
                    ) : null}

                    {(cancellationQuote?.warnings ?? []).length ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <div className="text-sm font-bold text-amber-900">
                          Cancellation warnings
                        </div>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
                          {(cancellationQuote?.warnings ?? []).map((warning) => (
                            <li key={warning}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <details className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700">
                      <summary className="cursor-pointer font-bold text-slate-900">
                        Raw cancellation payload
                      </summary>
                      <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap text-xs text-slate-700">
                        {JSON.stringify(cancellationPayload, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              ) : null}

              <div className="rounded-xl border border-rose-100 bg-rose-50/60 px-4 py-3">
                <div className="text-sm font-bold text-slate-950">Important</div>
                <div className="mt-1 text-xs leading-5 text-slate-600">
                  Cancellation may be irreversible based on fare policy. Backend status will refresh after confirmation.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setCancellationOpen(false);
                  resetCancellationFlow();
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                {cancellationStep === "status" ? "Keep booking" : "Close"}
              </button>

              {cancellationStep === "status" ? (
                refundBeforeDeparture ? (
                  refundBeforeDeparture.allowed ? (
                    <button
                      type="button"
                      onClick={loadCancellationReview}
                      disabled={refundabilityLoading || quoteLoading}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(37,99,235,0.34)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={loadCancellationReview}
                      disabled={refundabilityLoading || quoteLoading}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(225,29,72,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(225,29,72,0.34)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      Cancel anyway
                    </button>
                  )
                ) : (
                  <div />
                )
              ) : (
                <button
                  type="button"
                  onClick={runConfirmCancellation}
                  disabled={
                    quoteLoading ||
                    confirmingCancellation ||
                    !cancellationId ||
                    Boolean(cancellationSuccess)
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(225,29,72,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(225,29,72,0.34)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {confirmingCancellation ? "Confirming..." : "Confirm cancellation"}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

