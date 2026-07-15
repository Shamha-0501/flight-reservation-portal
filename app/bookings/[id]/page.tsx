"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
import {
  confirmOrderChange,
  createOrderChange,
  createOrderChangeRequest,
  getOrderChangeableStatus,
  type OrderChangeOfferSummary,
  type OrderChangeRequestResponse,
  type OrderChangeResponse,
} from "@/src/api/routes/orders/change";
import {
  BookingDetailsSkeleton,
  BookingInlineSkeleton,
} from "@/src/shared/components/booking/BookingFlowSkeleton";
import MockCardPaymentGate from "@/src/shared/components/booking/steps/MockCardPaymentGate";

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

function getOrderMoney(order?: BookingListItem | null) {
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

function getAgencyCharges(order?: BookingListItem | null) {
  const agencyMarkup = order?.meta?.agency_markup as
    | { amount?: string | number | null; currency?: string | null }
    | null
    | undefined;
  const addons = Array.isArray(order?.addons) ? order?.addons : [];

  const addonTotal = addons.reduce((sum, addon) => {
    const record = addon as Record<string, unknown>;
    const amount =
      parseNumericAmount(record.agency_addons_amount) ??
      parseNumericAmount(record.total_addons_amount) ??
      0;
    return sum + amount;
  }, 0);

  const markupAmount = parseNumericAmount(agencyMarkup?.amount) ?? 0;
  const addonCurrency = addons[0]
    ? String((addons[0] as Record<string, unknown>).currency ?? "")
    : "";
  const currency = (agencyMarkup?.currency ?? addonCurrency) || null;

  const total = markupAmount + addonTotal;

  return {
    amount: total > 0 ? total : null,
    currency,
  };
}

function toMoneyAmount(value: unknown): string | number | null {
  return typeof value === "string" || typeof value === "number" ? value : null;
}

function toMoneyCurrency(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
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

function parseNumericAmount(value: unknown) {
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

type OrderChangeCondition = {
  allowed?: boolean;
  penalty_amount?: string | number | null;
  penalty_currency?: string | null;
  [key: string]: unknown;
};

type RescheduleDraft = {
  sliceId: string;
  origin: string;
  destination: string;
  departureDate: string;
  cabinClass: string;
};

type OrderChangeOfferView = {
  id: string;
  title: string;
  route: string;
  departureText: string;
  returnText?: string;
  cabinText: string;
  amountLabel: string;
  amountText: string;
  amountHint?: string;
  expiresText?: string;
};

type OrderChangePaymentPayload = {
  type: string;
  amount: string;
  currency: string;
};

const DUFFEL_SUPPLIER_CURRENCY = "EUR";
const EUR_TO_LKR_RATE = 383.144531;

function getChangeBeforeDeparture(value: unknown) {
  if (value === false) {
    return { allowed: false } as OrderChangeCondition;
  }

  if (!value || typeof value !== "object") return null;

  const direct = value as OrderChangeCondition;
  if (
    typeof direct.allowed === "boolean" ||
    direct.penalty_amount != null ||
    direct.penalty_currency != null
  ) {
    return direct;
  }

  return null;
}

function getRescheduleDraft(order?: BookingListItem | null): RescheduleDraft | null {
  const changeMeta = order?.meta?.change as Record<string, unknown> | null | undefined;
  const duffelOrder =
    (changeMeta?.latest_order_snapshot as Record<string, unknown> | null | undefined) ??
    (order?.meta?.duffel_order as Record<string, unknown> | null | undefined);
  const slices = Array.isArray(duffelOrder?.slices)
    ? (duffelOrder?.slices as Record<string, unknown>[])
    : [];
  const firstSlice = slices[0];
  const segments = Array.isArray(firstSlice?.segments)
    ? (firstSlice?.segments as Record<string, unknown>[])
    : [];
  const firstSegment = segments[0];

  const sliceId = getDuffelId(firstSlice?.id ?? firstSlice?.slice_id);
  const origin = getPlaceCode(
    firstSlice?.origin ?? firstSegment?.origin ?? duffelOrder?.origin
  );
  const destination = getPlaceCode(
    firstSlice?.destination ?? firstSegment?.destination ?? duffelOrder?.destination
  );
  const departureDate = formatDateForInput(
    firstSlice?.departing_at ?? firstSegment?.departing_at ?? firstSlice?.departure_date
  );
  const cabinClass = String(
    firstSlice?.cabin_class ??
      duffelOrder?.cabin_class ??
      duffelOrder?.cabin ??
      "economy"
  ).toLowerCase();

  if (!sliceId || !origin || !destination) {
    return null;
  }

  return {
    sliceId,
    origin,
    destination,
    departureDate,
    cabinClass,
  };
}

function getOrderChangeOffers(
  response?: OrderChangeRequestResponse | null
): OrderChangeOfferSummary[] {
  if (!response) return [];

  if (Array.isArray(response.offers)) {
    return response.offers;
  }

  const data = response.data as Record<string, unknown> | null | undefined;
  const nestedOffers = data?.order_change_offers;
  return Array.isArray(nestedOffers) ? (nestedOffers as OrderChangeOfferSummary[]) : [];
}

function buildOrderChangeOfferView(
  offer: OrderChangeOfferSummary,
  fallbackCurrency = "USD"
): OrderChangeOfferView {
  const rawOffer = offer as unknown as Record<string, unknown>;
  const slices = rawOffer.slices as
    | { add?: Record<string, unknown>[]; remove?: Record<string, unknown>[] }
    | undefined
    | null;
  const addSlice = Array.isArray(slices?.add) ? slices.add[0] ?? null : null;
  const firstSegment = Array.isArray(addSlice?.segments) ? addSlice.segments[0] ?? null : null;
  const firstPassenger = Array.isArray(firstSegment?.passengers)
    ? firstSegment.passengers[0] ?? null
    : null;

  const origin = (addSlice?.origin as Record<string, unknown> | undefined) ?? null;
  const destination = (addSlice?.destination as Record<string, unknown> | undefined) ?? null;
  const airline = (firstSegment?.operating_carrier as Record<string, unknown> | undefined) ?? null;
  const currency = toMoneyCurrency(
    rawOffer.additional_payment_currency ??
      rawOffer.refund_currency ??
      rawOffer.change_total_currency ??
      rawOffer.penalty_total_currency,
    fallbackCurrency
  );
  const additionalPaymentAmount = toMoneyAmount(rawOffer.additional_payment_amount);
  const refundAmount = toMoneyAmount(rawOffer.refund_amount);
  const penaltyAmount =
    toMoneyAmount(rawOffer.penalty_total_amount) ?? toMoneyAmount(rawOffer.penalty_amount);
  const newTotalAmount = toMoneyAmount(rawOffer.new_total_amount);
  const amountValue =
    additionalPaymentAmount ??
    refundAmount ??
    penaltyAmount ??
    newTotalAmount ??
    toMoneyAmount(rawOffer.change_total_amount) ??
    null;
  const amountLabel =
    additionalPaymentAmount != null
      ? "Extra payment"
      : refundAmount != null
        ? "Refund to customer"
        : penaltyAmount != null
          ? "Penalty"
          : newTotalAmount != null
            ? "New total"
            : "Change amount";
  const amountHint =
    additionalPaymentAmount != null
      ? "You pay this on confirmation."
      : refundAmount != null
        ? "This amount should be returned to the customer."
        : penaltyAmount != null
          ? "This amount is charged as a penalty."
          : newTotalAmount != null
            ? "Updated itinerary total."
            : undefined;

  return {
    id: String(rawOffer.id ?? ""),
    title: String(airline?.name ?? airline?.iata_code ?? "Change offer"),
    route: `${String(origin?.iata_code ?? "???")} → ${String(destination?.iata_code ?? "???" )}`,
    departureText: firstSegment?.departing_at
      ? formatDateDetails(String(firstSegment.departing_at))
      : "Departure time unavailable",
    returnText: firstSegment?.arriving_at
      ? `Arrives ${formatDateDetails(String(firstSegment.arriving_at))}`
      : undefined,
    cabinText: String(
      firstPassenger?.cabin_class_marketing_name ??
        firstPassenger?.cabin_class ??
        rawOffer.cabin_class ??
        "Cabin not specified"
    ),
    amountLabel,
    amountText: formatMoneyDetails(amountValue, currency),
    amountHint,
    expiresText: rawOffer.expires_at ? `Expires ${formatDateDetails(String(rawOffer.expires_at))}` : undefined,
  };
}

function buildOrderChangePaymentPayload(
  offer: OrderChangeOfferSummary,
  fallbackCurrency = "USD"
): OrderChangePaymentPayload | null {
  const rawOffer = offer as unknown as Record<string, unknown>;
  const amount =
    rawOffer.change_total_amount ??
    rawOffer.penalty_total_amount ??
    rawOffer.new_total_amount ??
    rawOffer.additional_payment_amount ??
    null;
  const displayCurrency =
    String(rawOffer.change_total_currency ?? rawOffer.penalty_total_currency ?? fallbackCurrency)
      .trim()
      .toUpperCase();
  const availablePaymentTypes = Array.isArray(rawOffer.available_payment_types)
    ? (rawOffer.available_payment_types as string[])
    : [];
  const type = availablePaymentTypes.includes("balance")
    ? "balance"
    : availablePaymentTypes[0] ?? "balance";

  if (amount == null || !displayCurrency) return null;

  const numericAmount = Number(amount);
  const convertedAmount =
    displayCurrency === DUFFEL_SUPPLIER_CURRENCY
      ? numericAmount
      : displayCurrency === "LKR"
        ? numericAmount / EUR_TO_LKR_RATE
        : numericAmount;

  return {
    type,
    amount: Number.isFinite(convertedAmount) ? convertedAmount.toFixed(2) : String(amount),
    currency: DUFFEL_SUPPLIER_CURRENCY,
  };
}

function getOrderChangePaymentAmount(offer: OrderChangeOfferSummary | null | undefined) {
  if (!offer) return null;

  const rawOffer = offer as unknown as Record<string, unknown>;
  const amount =
    rawOffer.additional_payment_amount ??
    rawOffer.change_total_amount ??
    rawOffer.penalty_total_amount ??
    rawOffer.new_total_amount ??
    null;

  return parseNumericAmount(amount);
}

function getPlaceCode(value: unknown) {
  if (!value) return "";

  if (typeof value === "string") {
    return value.trim().toUpperCase();
  }

  if (typeof value === "object") {
    const place = value as {
      iata_code?: string | null;
      code?: string | null;
      origin?: { iata_code?: string | null; code?: string | null } | null;
      destination?: { iata_code?: string | null; code?: string | null } | null;
      airport?: { iata_code?: string | null; code?: string | null } | null;
    };

    return (
      place.iata_code ||
      place.code ||
      place.origin?.iata_code ||
      place.origin?.code ||
      place.destination?.iata_code ||
      place.destination?.code ||
      place.airport?.iata_code ||
      place.airport?.code ||
      ""
    )
      .trim()
      .toUpperCase();
  }

  return "";
}

function getDuffelId(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function formatDateForInput(value: unknown) {
  if (typeof value !== "string" || !value) return "";
  return value.slice(0, 10);
}

function normalizeStatusDetails(value?: string | null) {
  return (value ?? "").toLowerCase().trim();
}

function getWorkflowState(
  order: BookingListItem | null | undefined,
  kind: "change" | "cancellation"
) {
  const workflow = kind === "change" ? order?.meta?.change : order?.meta?.cancellation;
  const status = normalizeStatusDetails(typeof workflow?.status === "string" ? workflow.status : null);

  let normalizedStatus = status;
  if (normalizedStatus === "cancellation requested" || normalizedStatus === "change requested") {
    normalizedStatus = "requested";
  } else if (normalizedStatus === "pending_confirmation") {
    normalizedStatus = "approved";
  }

  return {
    status: normalizedStatus,
    requestedAt: typeof workflow?.requested_at === "string" ? workflow.requested_at : null,
    approvedAt: typeof workflow?.approved_at === "string" ? workflow.approved_at : null,
    rejectedAt: typeof workflow?.rejected_at === "string" ? workflow.rejected_at : null,
    reviewNote:
      typeof workflow?.approval_note === "string"
        ? workflow.approval_note
        : typeof workflow?.rejection_reason === "string"
          ? workflow.rejection_reason
          : null,
  };
}

function getBookingDisplayState(order?: BookingListItem | null) {
  const rescheduleStatus = normalizeStatusDetails(
    order?.meta?.change?.status
  );
  const cancellationStatus = normalizeStatusDetails(order?.meta?.cancellation?.status);
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
            : display.key === "rescheduled"
              ? "border-indigo-200 bg-indigo-50 text-indigo-700"
          : display.key === "reschedule-requested" ||
                  display.key === "reschedule-approved" ||
                  display.key === "cancellation-requested"
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : display.key === "cancellation-approved"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : display.key === "reschedule-rejected"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : display.key === "cancellation-rejected"
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                : display.key === "pending"
                  ? "border-slate-200 bg-slate-50 text-slate-700"
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
      label: "Rescheduled",
      active: normalized === "rescheduled" || normalized === "changed",
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
  const searchParams = useSearchParams();
  const router = useRouter();
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
  const [, setConfirmingCancellation] = useState(false);
  const [cancellationError, setCancellationError] = useState<string | null>(null);
  const [cancellationPayload, setCancellationPayload] = useState<Record<string, unknown> | null>(null);
  const [cancellationQuote, setCancellationQuote] =
    useState<OrderCancellationResponse["quote"] | null>(null);
  const [cancellationId, setCancellationId] = useState<string | null>(null);
  const [cancellationSuccess, setCancellationSuccess] = useState<string | null>(null);
  const [confirmingRefund, setConfirmingRefund] = useState(false);
  const [refundabilityStatus, setRefundabilityStatus] =
    useState<OrderRefundableStatusResponse | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleStep, setRescheduleStep] = useState<"status" | "review">("status");
  const [checkingReschedule, setCheckingReschedule] = useState(false);
  const [preparingReschedule, setPreparingReschedule] = useState(false);
  const [confirmingReschedule, setConfirmingReschedule] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [rescheduleSuccess, setRescheduleSuccess] = useState<string | null>(null);
  const [rescheduleCondition, setRescheduleCondition] =
    useState<OrderChangeCondition | null>(null);
  const [rescheduleDraft, setRescheduleDraft] = useState<RescheduleDraft | null>(null);
  const [rescheduleRequest, setRescheduleRequest] =
    useState<OrderChangeRequestResponse | null>(null);
  const [selectedChangeOfferId, setSelectedChangeOfferId] = useState<string | null>(null);
  const [, setCreatedChangeResponse] = useState<OrderChangeResponse | null>(null);
  const [rescheduleIntent, setRescheduleIntent] = useState<"request" | "action">("request");
  const [cancellationIntent, setCancellationIntent] = useState<"request" | "action">("request");
  const [paymentModalFlow, setPaymentModalFlow] = useState<"cancellation" | "reschedule" | null>(
    null
  );
  const queryTenantKey =
    searchParams.get("tenantKey")?.trim() ??
    searchParams.get("tenant_key")?.trim() ??
    "";
  const rescheduleOffers = getOrderChangeOffers(rescheduleRequest);
  const changeWorkflow = getWorkflowState(order, "change");
  const cancellationWorkflow = getWorkflowState(order, "cancellation");
  const isRescheduleApproved = changeWorkflow.status === "approved";
  const isRescheduleRequested = changeWorkflow.status === "requested";
  const isRescheduleRejected = changeWorkflow.status === "rejected";
  const isCancellationApproved = cancellationWorkflow.status === "approved";
  const isCancellationRequested = cancellationWorkflow.status === "requested";
  const isCancellationRejected = cancellationWorkflow.status === "rejected";
  const selectedChangeOffer = useMemo(
    () =>
      rescheduleOffers.find((offer) => {
        const offerId = String((offer as unknown as Record<string, unknown>).id ?? "");
        return offerId === selectedChangeOfferId;
      }) ?? null,
    [rescheduleOffers, selectedChangeOfferId]
  );
  const reschedulePaymentAmount =
    getOrderChangePaymentAmount(selectedChangeOffer) ?? 0;
  const orderMoney = getOrderMoney(order);
  const agencyCharges = getAgencyCharges(order);
  const agencyChargesLabel = formatMoneyDetails(
    agencyCharges.amount,
    agencyCharges.currency || orderMoney.currency
  );
  const reschedulePaymentCurrency =
    selectedChangeOffer?.currency || orderMoney.currency || "USD";

  const tenantKey = useMemo(
    () =>
      queryTenantKey ??
      tenantBootstrap?.key ??
      authUser?.tenant_key ??
      authUser?.tenants?.[0]?.key ??
      "",
    [
      authUser?.tenant_key,
      authUser?.tenants,
      queryTenantKey,
      tenantBootstrap?.key,
    ]
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

  const totalAmount = formatMoneyDetails(orderMoney.amount, orderMoney.currency);
  const refundBeforeDeparture = getRefundBeforeDeparture(refundabilityStatus);
  const penaltyAmount = parseNumericAmount(refundBeforeDeparture?.penalty_amount) ?? 0;
  const penaltyCurrency =
    refundBeforeDeparture?.penalty_currency || orderMoney.currency || "USD";
  const bookingTotalAmount = parseNumericAmount(orderMoney.amount) ?? 0;
  const cancellationPaymentAmount =
    parseNumericAmount(cancellationQuote?.cancellation_fee) ?? penaltyAmount;
  const cancellationPaymentCurrency =
    cancellationQuote?.cancellation_fee_currency || penaltyCurrency;
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

  const resetRescheduleFlow = () => {
    setRescheduleStep("status");
    setRescheduleError(null);
    setRescheduleSuccess(null);
    setRescheduleCondition(null);
    setRescheduleDraft(null);
    setRescheduleRequest(null);
    setSelectedChangeOfferId(null);
    setCreatedChangeResponse(null);
  };

  const closeCancellationModal = () => {
    setCancellationOpen(false);
    setPaymentModalFlow(null);
    resetCancellationFlow();
  };

  const closeRescheduleModal = () => {
    setRescheduleOpen(false);
    setPaymentModalFlow(null);
    resetRescheduleFlow();
  };

  const openCancellationPaymentModal = () => {
    if (!cancellationId) {
      setCancellationError("Cancellation details are incomplete.");
      return;
    }

    setCancellationError(null);
    setPaymentModalFlow("cancellation");
  };

  const openReschedulePaymentModal = () => {
    if (!selectedChangeOfferId || !selectedChangeOffer) {
      setRescheduleError("Select a reschedule offer before continuing.");
      return;
    }

    setRescheduleError(null);
    setPaymentModalFlow("reschedule");
  };

  const openRescheduleReview = async () => {
    if (!order?.id) {
      setRescheduleError("Local booking ID is missing for reschedule.");
      return;
    }

    try {
      const latestOrder =
        bookingId && tenantKey ? await loadBookingDetails(bookingId, tenantKey) : order;
      const draft = getRescheduleDraft(latestOrder);
      if (!draft) {
        setRescheduleError(
          "Duffel route details are not available for this booking, so rescheduling cannot start."
        );
        setRescheduleOpen(true);
        return;
    }

      setRescheduleIntent(isRescheduleApproved ? "action" : "request");
      setRescheduleOpen(true);
      setPaymentModalFlow(null);
      resetRescheduleFlow();
      setRescheduleDraft(draft);

      if (isCancelled) {
        setRescheduleError("This booking is already cancelled and cannot be rescheduled.");
        return;
      }

      if (!isRescheduleApproved) {
        return;
      }

    setCancellationOpen(false);
    setCheckingReschedule(true);

      const condition = await getOrderChangeableStatus(order.id);
      const normalizedCondition = getChangeBeforeDeparture(condition);
      setRescheduleCondition(normalizedCondition);

      if (normalizedCondition?.allowed === false) {
        setRescheduleError(
          "This booking cannot be rescheduled based on the stored Duffel conditions."
        );
      }
    } catch (changeabilityError: unknown) {
      setRescheduleError(
        changeabilityError instanceof Error
          ? changeabilityError.message
          : "Failed to check reschedule eligibility."
      );
      setRescheduleOpen(true);
    } finally {
      setCheckingReschedule(false);
    }
  };

  const submitRescheduleRequest = async () => {
    if (!order?.id || !rescheduleDraft) {
      setRescheduleError("Reschedule details are incomplete.");
      return;
    }

    const origin = getPlaceCode(rescheduleDraft.origin);
    const destination = getPlaceCode(rescheduleDraft.destination);

    if (!origin || !destination) {
      setRescheduleError("Enter both origin and destination airport codes before continuing.");
      return;
    }

    if (!rescheduleDraft.departureDate) {
      setRescheduleError("Choose a new departure date before continuing.");
      return;
    }

    setPreparingReschedule(true);
    setRescheduleError(null);
    setRescheduleSuccess(null);
    setCreatedChangeResponse(null);
    setSelectedChangeOfferId(null);

    try {
      const response = await createOrderChangeRequest({
        order_id: order.duffel_order_id ?? order.id,
        slices: {
          remove: [{ slice_id: rescheduleDraft.sliceId }],
          add: [
            {
              origin,
              destination,
              departure_date: rescheduleDraft.departureDate,
              cabin_class: rescheduleDraft.cabinClass || undefined,
            },
          ],
        },
      });

      setRescheduleRequest(response);

      if (rescheduleIntent === "request") {
        setRescheduleSuccess("Reschedule request submitted. Awaiting tenant approval.");
        if (bookingId && tenantKey) {
          await loadBookingDetails(bookingId, tenantKey);
        }
        router.refresh();
        return;
      }

      const requestOffers = getOrderChangeOffers(response);
      if (!requestOffers.length) {
        setRescheduleStep("status");
        setRescheduleError("Duffel did not return any change offers for this request.");
        return;
      }

      const firstOfferId = requestOffers[0]?.id ?? null;
      setSelectedChangeOfferId(firstOfferId);
      setRescheduleStep("review");
    } catch (requestError: unknown) {
      setRescheduleError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to create the Duffel reschedule request."
      );
    } finally {
      setPreparingReschedule(false);
    }
  };

  const submitRescheduleChange = async () => {
    if (!order?.id) {
      setRescheduleError("Local booking ID is missing for reschedule.");
      return false;
    }

    if (!selectedChangeOfferId) {
      setRescheduleError("Select a reschedule offer before continuing.");
      return false;
    }

    setConfirmingReschedule(true);
    setRescheduleError(null);
    setRescheduleSuccess(null);

    try {
      const selectedOffer = rescheduleOffers.find((offer) => {
        const offerId = String((offer as unknown as Record<string, unknown>).id ?? "");
        return offerId === selectedChangeOfferId;
      });

      if (!selectedOffer) {
        setRescheduleError("Selected reschedule offer is no longer available.");
        return false;
      }

      const preparedChange = await createOrderChange({
        order_id: order.duffel_order_id ?? order.id,
        selected_order_change_offer: selectedChangeOfferId,
      });
      setCreatedChangeResponse(preparedChange);

      const preparedData = (preparedChange.data ?? preparedChange) as Record<string, unknown>;
      const orderChangeId =
        typeof preparedData.id === "string"
          ? preparedData.id
          : typeof preparedData.order_change_id === "string"
            ? preparedData.order_change_id
            : null;

      const finalResponse = orderChangeId
        ? await confirmOrderChange({
            orderId: order.duffel_order_id ?? order.id,
            orderChangeId,
            payment: buildOrderChangePaymentPayload(
              selectedOffer,
              orderMoney.currency ?? "USD"
            ) ?? undefined,
          })
        : preparedChange;

      setCreatedChangeResponse(finalResponse);
      setRescheduleSuccess("Booking rescheduled successfully.");

      if (bookingId && tenantKey) {
        await loadBookingDetails(bookingId, tenantKey);
      }
      router.refresh();
      return true;
    } catch (confirmError: unknown) {
      setRescheduleError(
        confirmError instanceof Error
          ? confirmError.message
          : "Failed to confirm the reschedule."
      );
      return false;
    } finally {
      setConfirmingReschedule(false);
    }
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

    setRescheduleOpen(false);
    setCancellationOpen(true);
    setPaymentModalFlow(null);
    resetCancellationFlow();

    if (!isCancellationApproved) {
      setCancellationIntent("request");
      return;
    }

    setCancellationIntent("action");
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

    if (cancellationIntent === "request") {
      setQuoteLoading(true);
      setCancellationError(null);
      setCancellationSuccess(null);

      try {
        await createOrderCancellation(order.id, tenantKey);
        setCancellationSuccess("Cancellation request submitted. Awaiting tenant approval.");
        if (bookingId && tenantKey) {
          await loadBookingDetails(bookingId, tenantKey);
        }
        router.refresh();
        return;
      } catch (quoteError: unknown) {
        setCancellationError(
          quoteError instanceof Error
            ? quoteError.message
            : "Failed to submit cancellation request."
        );
      } finally {
        setQuoteLoading(false);
      }

      return;
    }

    setCancellationError(null);
    setCancellationPayload(null);
    setCancellationId(null);
    setQuoteLoading(true);

    try {
      const response = await createOrderCancellation(order.id, tenantKey);
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
      return false;
    }
    if (!order?.id) {
      setCancellationError("Local booking ID is missing for cancellation.");
      return false;
    }

    setConfirmingCancellation(true);
    setCancellationError(null);

    try {
      await confirmOrderCancellation({
        cancellationId,
        orderId: order.id,
        tenantKey,
      });
      const latest = await getOrderCancellation(cancellationId);
      const latestData = (latest?.data ?? latest) as Record<string, unknown>;
      setCancellationPayload(latestData);
      setCancellationQuote(latest.quote ?? null);
      setCancellationSuccess("Cancellation confirmed successfully.");
      if (bookingId && tenantKey) {
        await loadBookingDetails(bookingId, tenantKey);
      }
      router.refresh();
      return true;
    } catch (confirmError: unknown) {
      setCancellationError(
        confirmError instanceof Error
          ? confirmError.message
          : "Failed to confirm cancellation."
      );
      return false;
    } finally {
      setConfirmingCancellation(false);
    }
  };

  const runConfirmRefund = async () => {
    if (!order?.id) return;

    setConfirmingRefund(true);
    try {
      await confirmOrderRefund({ orderId: order.id, tenantKey });
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
                  Manage reservation status, passengers, payment totals, reschedule eligibility, cancellation eligibility, and booking references.
                </p>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur">
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-100">Total paid</div>
                <div className="mt-1 text-3xl font-extrabold">{totalAmount}</div>
              </div>
            </div>
          </div>
        </section>

        {loading ? <BookingDetailsSkeleton /> : null}

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
                      cancellationStatus={order.meta?.cancellation?.status}
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
                <InfoCardDetails label="Agency charges" value={agencyChargesLabel} />
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
                      <span>Agency charges</span>
                      <span className="font-bold text-slate-950">{agencyChargesLabel}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-slate-600">
                      <span>Currency</span>
                      <span className="font-bold text-slate-950">{orderMoney.currency || "-"}</span>
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

              <SectionCard eyebrow="Manage" title="Reschedule and refunds">
                <div className="space-y-4">
                  {isRescheduleRequested ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-800">
                      Reschedule request is pending tenant admin approval.
                    </div>
                  ) : isRescheduleApproved ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-800">
                      Reschedule was approved locally. You can now continue with the booking change flow.
                    </div>
                  ) : isRescheduleRejected ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700">
                      Reschedule process not permitted for you.
                    </div>
                  ) : null}

                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-950">Need to reschedule this booking?</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          Duffel will validate whether the itinerary can be changed and return the available change offers before confirmation.
                        </p>
                        {isRescheduleApproved && rescheduleCondition ? (
                          <p className="mt-2 text-xs font-medium text-indigo-700">
                            {rescheduleCondition.allowed === false
                              ? "This booking is not currently changeable."
                              : "This booking is changeable before departure."}
                          </p>
                        ) : !isRescheduleApproved ? (
                          <p className="mt-2 text-xs font-medium text-indigo-700">
                            Request approval first. The reschedule button will stay hidden until the tenant approves the order update.
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => void openRescheduleReview()}
                        disabled={
                          checkingReschedule ||
                          preparingReschedule ||
                          confirmingReschedule ||
                          isCancelled ||
                          isRescheduleRequested ||
                          isRescheduleRejected
                        }
                      className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(79,70,229,0.20)] transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                      >
                        {checkingReschedule
                          ? "Checking..."
                          : preparingReschedule
                            ? "Preparing..."
                            : isCancelled
                              ? "Booking cancelled"
                              : isRescheduleRequested
                                ? "Request pending"
                                : isRescheduleRejected
                                  ? "Not permitted"
                                  : isRescheduleApproved
                                    ? "Reschedule booking"
                                    : "Request reschedule approval"}
                      </button>
                    </div>
                  </div>

                  {isCancellationRequested ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-800">
                      Cancellation request is pending tenant admin approval.
                    </div>
                  ) : isCancellationApproved ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-800">
                      Cancellation was approved locally. You can now continue with the booking cancellation flow.
                    </div>
                  ) : isCancellationRejected ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700">
                      Cancellation process not permitted for you.
                    </div>
                  ) : null}

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
                        disabled={isCancelled || isCancellationRequested || isCancellationRejected}
                        className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-rose-600 px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(225,29,72,0.20)] transition hover:-translate-y-0.5 hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                      >
                        {isCancelled
                          ? "Booking cancelled"
                          : isCancellationRequested
                            ? "Request pending"
                            : isCancellationRejected
                              ? "Not permitted"
                              : isCancellationApproved
                                ? "Cancel booking"
                                : "Request cancellation approval"}
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
                      cancellationStatus={order.meta?.cancellation?.status}
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
                    cancellationStatus={order.meta?.cancellation?.status}
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

      {rescheduleOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 px-4 py-4 backdrop-blur-[2px]">
          <div className="relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-400 to-cyan-300" />

            <div className="border-b border-slate-100 bg-gradient-to-br from-indigo-50/80 via-white to-white px-6 py-5">
              <div className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-700">
                Duffel reschedule
              </div>
              <h3 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight text-slate-950">
                Review before rescheduling
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Duffel checks whether the booking can be changed, returns the available offers, and confirms the selected itinerary.
              </p>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
              {checkingReschedule ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Checking reschedule eligibility...
                </div>
              ) : null}

              {preparingReschedule ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Preparing Duffel change request...
                </div>
              ) : null}

              {rescheduleError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {rescheduleError}
                </div>
              ) : null}

              {rescheduleSuccess ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {rescheduleSuccess}
                </div>
              ) : null}

              {rescheduleStep === "status" && !checkingReschedule && rescheduleDraft ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Search criteria
                    </div>
                    <div className="mt-2 text-sm text-slate-700">
                      Update the route, date, and cabin before Duffel searches the change offers.
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Origin airport</label>
                      <input
                        type="text"
                        value={rescheduleDraft.origin}
                        onChange={(event) =>
                          setRescheduleDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  origin: event.target.value.trim().toUpperCase(),
                                }
                              : current
                          )
                        }
                        maxLength={3}
                        placeholder="CMB"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium uppercase tracking-wider text-slate-900 outline-none focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Destination airport</label>
                      <input
                        type="text"
                        value={rescheduleDraft.destination}
                        onChange={(event) =>
                          setRescheduleDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  destination: event.target.value.trim().toUpperCase(),
                                }
                              : current
                          )
                        }
                        maxLength={3}
                        placeholder="DEL"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium uppercase tracking-wider text-slate-900 outline-none focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">New departure date</label>
                      <input
                        type="date"
                        value={rescheduleDraft.departureDate}
                        onChange={(event) =>
                          setRescheduleDraft((current) =>
                            current ? { ...current, departureDate: event.target.value } : current
                          )
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Cabin class</label>
                      <select
                        value={rescheduleDraft.cabinClass}
                        onChange={(event) =>
                          setRescheduleDraft((current) =>
                            current ? { ...current, cabinClass: event.target.value } : current
                          )
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                      >
                        <option value="economy">Economy</option>
                        <option value="premium_economy">Premium Economy</option>
                        <option value="business">Business</option>
                        <option value="first">First</option>
                      </select>
                    </div>
                  </div>

                  {rescheduleCondition ? (
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-800">
                      {rescheduleCondition.allowed === false
                        ? "Duffel currently marks this booking as not changeable."
                        : "Duffel allows this booking to be changed before departure."}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      Changeability details will appear after Duffel validates the booking.
                    </div>
                  )}
                </div>
              ) : null}

              {rescheduleStep === "review" && !preparingReschedule && rescheduleRequest ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Change offers
                    </div>
                    <div className="mt-2 text-sm text-slate-700">
                      Select one Duffel change offer. If the offer carries an additional payment, the backend will include that in the confirmation response.
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {rescheduleOffers.length ? (
                      rescheduleOffers.map((offer) => {
                        const offerView = buildOrderChangeOfferView(
                          offer,
                          orderMoney.currency ?? "USD"
                        );
                        const offerId = offerView.id;
                        const isSelected = selectedChangeOfferId === offerId;

                        return (
                          <button
                            key={offerId || offerView.route}
                            type="button"
                            onClick={() => {
                              setSelectedChangeOfferId(offerId);
                            }}
                            aria-pressed={isSelected}
                            className={`rounded-2xl border p-4 text-left transition ${
                              isSelected
                                ? "border-indigo-300 bg-indigo-50 shadow-sm"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-extrabold text-slate-950">
                                    {offerView.title}
                                  </div>
                                  {isSelected ? (
                                    <span className="rounded-full border border-indigo-200 bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-700">
                                      Selected
                                    </span>
                                  ) : null}
                                </div>
                                <div className="mt-1 text-sm text-slate-600">
                                  {offerView.route}
                                </div>
                                <div className="mt-1 text-xs font-medium text-slate-500">
                                  {offerView.departureText}
                                  {offerView.returnText ? ` · ${offerView.returnText}` : ""}
                                </div>
                                <div className="mt-1 text-xs font-medium text-slate-500">
                                  {offerView.cabinText}
                                  {offerView.expiresText ? ` · ${offerView.expiresText}` : ""}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                                  {offerView.amountLabel}
                                </div>
                                <div className="text-sm font-bold text-slate-950">
                                  {offerView.amountText}
                                </div>
                                {offerView.amountHint ? (
                                  <div className="mt-1 max-w-[220px] text-[11px] leading-4 text-slate-500">
                                    {offerView.amountHint}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        Duffel did not return any change offers for this request.
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Payment is collected in the next step so this review modal stays short.
                  </div>

                  <details className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700">
                    <summary className="cursor-pointer font-bold text-slate-900">
                      Raw reschedule payload
                    </summary>
                    <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap text-xs text-slate-700">
                      {JSON.stringify(rescheduleRequest, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-6 py-4">
              <button
                type="button"
                onClick={closeRescheduleModal}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                {rescheduleStep === "status" ? "Keep booking" : "Close"}
              </button>

              {rescheduleStep === "status" ? (
                <button
                  type="button"
                  onClick={() => void submitRescheduleRequest()}
                  disabled={
                    checkingReschedule ||
                    preparingReschedule ||
                    Boolean(rescheduleSuccess) ||
                    !rescheduleDraft ||
                    !rescheduleDraft.departureDate ||
                    (rescheduleIntent === "action" && rescheduleCondition?.allowed === false)
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(79,70,229,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(79,70,229,0.34)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {preparingReschedule
                    ? "Preparing..."
                    : rescheduleIntent === "request"
                      ? "Submit request"
                      : "Find offers"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openReschedulePaymentModal}
                  disabled={
                    !selectedChangeOfferId ||
                    Boolean(rescheduleSuccess)
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(79,70,229,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(79,70,229,0.34)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {selectedChangeOfferId ? "Confirm selected offer" : "Select an offer first"}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {cancellationOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-[2px]">
          <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-orange-400 to-amber-300" />

            <div className="border-b border-slate-100 bg-gradient-to-br from-rose-50/80 via-white to-white px-6 py-5">
              <div className="inline-flex items-center rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-rose-700">
                {cancellationIntent === "request" ? "Cancellation request" : "Cancellation quote"}
              </div>
              <h3 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight text-slate-950">
                {cancellationIntent === "request" ? "Request tenant approval" : "Review before cancelling"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {cancellationIntent === "request"
                  ? "Submit the cancellation request first. The tenant admin must approve it before the airline cancellation flow can continue."
                  : "Confirm only after checking airline refund details and cancellation conditions."}
              </p>
            </div>

            <div className="space-y-4 px-6 py-6">
              {refundabilityLoading ? <BookingInlineSkeleton /> : null}

              {quoteLoading ? <BookingInlineSkeleton /> : null}

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

              {cancellationStep === "status" && cancellationIntent === "request" ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  This is a tenant approval request only. No airline cancellation will run until the request is approved.
                </div>
              ) : cancellationStep === "status" && !refundabilityLoading && refundBeforeDeparture ? (
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
                          orderMoney.currency || penaltyCurrency
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
              cancellationIntent === "action" &&
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

                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      Payment is collected in the next step so this review modal stays short.
                    </div>

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
                onClick={closeCancellationModal}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                {cancellationStep === "status" ? "Keep booking" : "Close"}
              </button>

              {cancellationStep === "status" ? (
                cancellationIntent === "request" ? (
                  <button
                    type="button"
                    onClick={loadCancellationReview}
                    disabled={quoteLoading || Boolean(cancellationSuccess)}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(225,29,72,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(225,29,72,0.34)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {quoteLoading ? "Submitting..." : "Submit request"}
                  </button>
                ) : refundBeforeDeparture ? (
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
                  onClick={openCancellationPaymentModal}
                  disabled={
                    !cancellationId ||
                    Boolean(cancellationSuccess)
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(225,29,72,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(225,29,72,0.34)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {cancellationId ? "Confirm cancellation" : "Prepare cancellation"}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {paymentModalFlow ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/70 p-4 backdrop-blur-md sm:items-center">
          <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-5 py-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                  Payment step
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {paymentModalFlow === "cancellation"
                    ? "Cancellation confirmation"
                    : "Reschedule confirmation"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalFlow(null)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Back
              </button>
            </div>
            <div className="max-h-[88vh] overflow-y-auto">
              <MockCardPaymentGate
                title={
                  paymentModalFlow === "cancellation"
                    ? "Cancellation payment"
                    : "Reschedule payment"
                }
                description={
                  paymentModalFlow === "cancellation"
                    ? "Complete the mocked card payment for the cancellation penalty before final confirmation."
                    : "Complete the mocked card payment for the selected change offer before final confirmation."
                }
                amountDue={
                  paymentModalFlow === "cancellation"
                    ? cancellationPaymentAmount
                    : reschedulePaymentAmount
                }
                currency={
                  paymentModalFlow === "cancellation"
                    ? cancellationPaymentCurrency
                    : reschedulePaymentCurrency
                }
                actionLabel={
                  paymentModalFlow === "cancellation"
                    ? "Confirm cancellation"
                    : "Confirm selected offer"
                }
                onPaid={async () => {
                  const flow = paymentModalFlow;
                  if (!flow) return;

                  const confirmed =
                    flow === "cancellation"
                      ? await runConfirmCancellation()
                      : await submitRescheduleChange();

                  setPaymentModalFlow(null);

                  if (confirmed) {
                    if (flow === "cancellation") {
                      closeCancellationModal();
                    } else {
                      closeRescheduleModal();
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

