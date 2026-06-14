"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getFlightOfferDetails } from "@/src/api/routes/flightSearch/search";
import {
  buildCreateOrderRequestBody,
  createOrder,
  type CreateOrderRequestBody,
  type CreateOrderResponse,
} from "@/src/api/routes/orders/create";
import { getTenantAddonSettings } from "@/src/api/routes/tenant/extras";
import BookingLayout from "@/src/shared/components/booking/BookingLayout";
import ReviewFlightStep from "@/src/shared/components/booking/steps/ReviewFlightStep";
import BookingSummarySidebar from "@/src/shared/components/booking/summary/BookingSummarySidebar";
import TravellerInfoStep, {
  type TravellerOrderPayload,
  type TravellerValidationResult,
  type TravellerStepDraft,
} from "@/src/shared/components/booking/steps/TravellerInfoStep";
import ExtrasStep, {
  type ExtrasOrderSelection,
  type SeatSelectionSummary,
  type TravellerBaggage,
} from "@/src/shared/components/booking/steps/ExtrasStep";
import PaymentStep from "@/src/shared/components/booking/steps/PaymentStep";
import { mapDuffelOfferToBookingViewModel } from "@/src/shared/lib/flightsData";
import type { TenantAddonSettings } from "@/src/shared/lib/tenantAddonSettings";
import type { DuffelPaymentIntent } from "@/src/api/routes/orders/payment";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/src/shared/redux/store";
import { authMe } from "@/src/shared/redux/store/authSlice";

const STEPS = [
  { id: "review", label: "Review Flight" },
  { id: "travellers", label: "Travellers" },
  { id: "extras", label: "Extras" },
  { id: "review-final", label: "Review" },
  { id: "payment", label: "Payment" },
];

type BookingTraveller = {
  id: string;
  type: "ADULT" | "CHILD" | "INFANT";
  label: string;
  note?: string;
};

type DuffelPassenger = {
  id?: string;
  type?: string;
  age?: number | string | null;
};

type DuffelOffer = {
  passengers?: DuffelPassenger[];
  slices?: Array<{
    departing_at?: string;
    segments?: Array<{
      departing_at?: string;
    }>;
  }>;
  total_currency?: string;
  [key: string]: unknown;
};

type BookingFlightViewModel = ReturnType<typeof mapDuffelOfferToBookingViewModel>;

const buildTravellersFromCounts = (
  adults: number,
  children: number,
  infants: number
): BookingTraveller[] => {
  const travellers: BookingTraveller[] = [];

  for (let i = 1; i <= adults; i += 1) {
    travellers.push({ id: `adult-${i}`, type: "ADULT", label: `Adult ${i}` });
  }
  for (let i = 1; i <= children; i += 1) {
    travellers.push({ id: `child-${i}`, type: "CHILD", label: `Child ${i}` });
  }
  for (let i = 1; i <= infants; i += 1) {
    travellers.push({
      id: `infant-${i}`,
      type: "INFANT",
      label: `Infant ${i}`,
      note: adults >= i ? `Linked to Adult ${i}` : "Linked to Adult 1",
    });
  }

  return travellers;
};

function buildTravellersFromOfferPassengers(
  offer: DuffelOffer | null
): BookingTraveller[] {
  const passengers = Array.isArray(offer?.passengers) ? offer.passengers : [];
  const counts = { ADULT: 0, CHILD: 0, INFANT: 0 };

  return passengers
    .map((passenger, index) => {
      const type = mapDuffelPassengerType(passenger);
      counts[type] += 1;

      return {
        id: passenger?.id ?? `${type.toLowerCase()}-${index + 1}`,
        type,
        label: getTravellerLabel(type, counts[type]),
      };
    })
    .map((traveller) => {
      if (traveller.type !== "INFANT") return traveller;

      const infantNumber = getTravellerSequenceNumber(traveller.label);
      return {
        ...traveller,
        note: `Linked to Adult ${Math.max(infantNumber, 1)}`,
      };
    });
}

function mapDuffelPassengerType(
  passenger: DuffelPassenger
): BookingTraveller["type"] {
  if (passenger?.type === "adult") return "ADULT";
  if (passenger?.type === "child") return "CHILD";
  if (passenger?.type === "infant_without_seat") return "INFANT";

  const age = Number(passenger?.age);
  if (Number.isFinite(age)) {
    if (age < 2) return "INFANT";
    if (age < 12) return "CHILD";
  }

  return "ADULT";
}

function getTravellerLabel(type: BookingTraveller["type"], count: number) {
  if (type === "ADULT") return `Adult ${count}`;
  if (type === "CHILD") return `Child ${count}`;
  return `Infant ${count}`;
}

function getTravellerSequenceNumber(label: string) {
  const match = label.match(/(\d+)$/);
  return match ? Number(match[1]) : 1;
}

function buildBaggageSelections(
  travellers: BookingTraveller[],
  includedBaggageLabel: string | undefined,
  currency: string
): TravellerBaggage[] {
  const includedLabel =
    includedBaggageLabel?.replace(/^Included baggage:\s*/i, "") ||
    "Included fare allowance";

  return travellers
    .filter((traveller) => traveller.type !== "INFANT")
    .map((traveller) => ({
      travellerId: traveller.id,
      travellerLabel: traveller.label,
      includedLabel,
      options: [
        {
          id: "bag-none",
          label: "No extra baggage",
          price: "Included",
          amount: 0,
          currency,
        },
        {
          id: "bag-10",
          label: "Add extra 10kg",
          description: "Additional checked baggage allowance",
          price: formatCurrencyAmount(35, currency),
          amount: 35,
          currency,
        },
        {
          id: "bag-20",
          label: "Add extra 20kg",
          description: "Additional checked baggage allowance",
          price: formatCurrencyAmount(60, currency),
          amount: 60,
          currency,
        },
      ],
    }));
}

function formatCurrencyAmount(amount: number, currency: string) {
  return `+ ${new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)}`;
}

function parseMoneyAmount(value: string | undefined) {
  if (!value) return null;
  const numeric = Number(value.replace(/[^0-9.-]+/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
}

function formatMoneyAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

type BookingProgressSnapshot = {
  stepIndex: number;
  travellerOrderPayload: TravellerOrderPayload | null;
  travellerDraft: TravellerStepDraft | null;
  extrasSelection: ExtrasOrderSelection | null;
  verifiedEmail: string;
  orderRequestBody: CreateOrderRequestBody | null;
};

export default function BookingPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const authStatus = useSelector((s: RootState) => s.auth.authStatus);
  const searchParams = useSearchParams();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedFlight, setSelectedFlight] =
    useState<BookingFlightViewModel | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<DuffelOffer | null>(null);
  const [seatMapStatus, setSeatMapStatus] = useState<string | undefined>();
  const [loadingFlight, setLoadingFlight] = useState(false);
  const [flightError, setFlightError] = useState<string | null>(null);
  const [tenantAddonSettings, setTenantAddonSettings] =
    useState<TenantAddonSettings | null>(null);
  const [loadingTenantSettings, setLoadingTenantSettings] = useState(false);
  const [tenantSettingsError, setTenantSettingsError] = useState<string | null>(
    null
  );
  const [travellerOrderPayload, setTravellerOrderPayload] =
    useState<TravellerOrderPayload | null>(null);
  const [travellerDraft, setTravellerDraft] =
    useState<TravellerStepDraft | null>(null);
  const [travellerValidation, setTravellerValidation] =
    useState<TravellerValidationResult | null>(null);
  const [showTravellerValidationErrors, setShowTravellerValidationErrors] =
    useState(false);
  const [extrasSelection, setExtrasSelection] =
    useState<ExtrasOrderSelection | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<CreateOrderResponse | null>(
    null
  );
  const [orderCreationError, setOrderCreationError] = useState<string | null>(
    null
  );
  const [verifiedEmail, setVerifiedEmail] = useState<string>("");
  const [restoredOrderRequestBody, setRestoredOrderRequestBody] =
    useState<CreateOrderRequestBody | null>(null);
  const orderRequestBodyRef = useRef<CreateOrderRequestBody | null>(null);
  const paymentIntentRef = useRef<DuffelPaymentIntent | null>(null);
  const hasRestoredProgressRef = useRef(false);

  const tenantKey = useMemo(
    () =>
      (searchParams.get("tenant_key") ?? searchParams.get("tenant_id") ?? "").trim(),
    [searchParams]
  );
  const agentNameFromUrl = searchParams.get("agent_name");
  const offerId = searchParams.get("offerId") || "";
  const adults = Number(searchParams.get("adults") || 1);
  const children = Number(searchParams.get("children") || 0);
  const infants = Number(searchParams.get("infants") || 0);
  const extrasCurrency =
    tenantAddonSettings?.currency || selectedOffer?.total_currency || "USD";

  const travellers = useMemo(() => {
    const offerTravellers = buildTravellersFromOfferPassengers(selectedOffer);
    return offerTravellers.length
      ? offerTravellers
      : buildTravellersFromCounts(adults, children, infants);
  }, [adults, children, infants, selectedOffer]);

  const agentName = useMemo(
    () => agentNameFromUrl || "Selected ticketing partner",
    [agentNameFromUrl]
  );

  const passengersLabel = useMemo(() => {
    const parts: string[] = [];

    if (adults > 0) parts.push(`${adults} adult${adults === 1 ? "" : "s"}`);
    if (children > 0) parts.push(`${children} child${children === 1 ? "" : "ren"}`);
    if (infants > 0) parts.push(`${infants} infant${infants === 1 ? "" : "s"}`);

    return parts.join(", ");
  }, [adults, children, infants]);

  const baggageSelections = useMemo(
    () =>
      buildBaggageSelections(
        travellers,
        selectedFlight?.baggageLabel,
        extrasCurrency
      ),
    [extrasCurrency, selectedFlight?.baggageLabel, travellers]
  );

  const travellerKey = useMemo(
    () => travellers.map((traveller) => traveller.id).join("|"),
    [travellers]
  );
  const selectedAddonsAmount = extrasSelection?.totalAddonsAmount ?? 0;
  const fareTotalAmount = useMemo(
    () => parseMoneyAmount(selectedFlight?.fare.total),
    [selectedFlight?.fare.total]
  );
  const grandTotalLabel = useMemo(() => {
    if (fareTotalAmount === null) return selectedFlight?.fare.total ?? "-";
    return `${extrasCurrency} ${formatMoneyAmount(
      fareTotalAmount + selectedAddonsAmount,
      extrasCurrency
    )}`;
  }, [extrasCurrency, fareTotalAmount, selectedAddonsAmount, selectedFlight?.fare.total]);
  const addonsTotalLabel = useMemo(
    () =>
      selectedAddonsAmount > 0
        ? `${extrasCurrency} ${formatMoneyAmount(selectedAddonsAmount, extrasCurrency)}`
        : "Included",
    [extrasCurrency, selectedAddonsAmount]
  );
  const stepFromQuery = useMemo(() => {
    const step = (searchParams.get("step") || "").toLowerCase();
    if (step === "payment") return 4;

    const indexValue = Number(searchParams.get("step_index"));
    if (Number.isInteger(indexValue) && indexValue >= 0 && indexValue < STEPS.length) {
      return indexValue;
    }

    return null;
  }, [searchParams]);
  const hasStepInQuery = useMemo(
    () => Boolean(searchParams.get("step") || searchParams.get("step_index")),
    [searchParams]
  );
  const bookingProgressStorageKey = useMemo(
    () =>
      tenantKey && offerId
        ? `booking-progress:${tenantKey}:${offerId}`
        : "",
    [offerId, tenantKey]
  );

  useEffect(() => {
    hasRestoredProgressRef.current = false;
    setTravellerOrderPayload(null);
    setTravellerDraft(null);
    setTravellerValidation(null);
    setShowTravellerValidationErrors(false);
    setExtrasSelection(null);
    setVerifiedEmail("");
    setRestoredOrderRequestBody(null);
  }, [bookingProgressStorageKey]);

  const seatSelection = useMemo<SeatSelectionSummary>(() => {
    const available = seatMapStatus === "available";

    return {
      title: "Seat selection",
      subtitle: available
        ? "Selectable seats are available for this offer."
        : seatMapStatus === "view_only"
          ? "A seat map is available, but selectable paid seats were not returned."
          : "Seat selection is not available for this offer.",
      ctaLabel: available ? "Choose seats" : "Unavailable",
      available,
    };
  }, [seatMapStatus]);

  const orderRequestBody = useMemo(() => {
    if (!tenantKey || !offerId || !travellerOrderPayload) {
      return null;
    }

    const contactEmail =
      verifiedEmail || travellerOrderPayload?.contact?.email || undefined;

    return buildCreateOrderRequestBody(
      tenantKey,
      offerId,
      travellerOrderPayload.passengers,
      extrasSelection?.addons,
      contactEmail
    );
  }, [
    extrasSelection?.addons,
    offerId,
    tenantKey,
    travellerOrderPayload,
    verifiedEmail,
  ]);

  const effectiveOrderRequestBody = useMemo(
    () => orderRequestBody ?? restoredOrderRequestBody,
    [orderRequestBody, restoredOrderRequestBody]
  );

  useEffect(() => {
    orderRequestBodyRef.current = effectiveOrderRequestBody;
  }, [effectiveOrderRequestBody]);

  useEffect(() => {
    if (!bookingProgressStorageKey || hasRestoredProgressRef.current) return;

    try {
      const rawSnapshot = window.sessionStorage.getItem(bookingProgressStorageKey);
      if (!rawSnapshot) {
        hasRestoredProgressRef.current = true;
        return;
      }

      const parsed = JSON.parse(rawSnapshot) as BookingProgressSnapshot;
      setTravellerOrderPayload(parsed.travellerOrderPayload ?? null);
      setTravellerDraft(parsed.travellerDraft ?? null);
      setExtrasSelection(parsed.extrasSelection ?? null);
      setVerifiedEmail(parsed.verifiedEmail ?? "");
      setRestoredOrderRequestBody(parsed.orderRequestBody ?? null);

      if (!hasStepInQuery) {
        const safeIndex =
          Number.isInteger(parsed.stepIndex) &&
          parsed.stepIndex >= 0 &&
          parsed.stepIndex < STEPS.length
            ? parsed.stepIndex
            : 0;
        setCurrentStepIndex(safeIndex);
      }
    } catch {
      window.sessionStorage.removeItem(bookingProgressStorageKey);
    } finally {
      hasRestoredProgressRef.current = true;
    }
  }, [bookingProgressStorageKey, hasStepInQuery]);

  useEffect(() => {
    if (!bookingProgressStorageKey || !hasRestoredProgressRef.current) return;

    const snapshot: BookingProgressSnapshot = {
      stepIndex: currentStepIndex,
      travellerOrderPayload,
      travellerDraft,
      extrasSelection,
      verifiedEmail,
      orderRequestBody: effectiveOrderRequestBody,
    };

    window.sessionStorage.setItem(
      bookingProgressStorageKey,
      JSON.stringify(snapshot)
    );
  }, [
    bookingProgressStorageKey,
    currentStepIndex,
    effectiveOrderRequestBody,
    extrasSelection,
    travellerDraft,
    travellerOrderPayload,
    verifiedEmail,
  ]);

  useEffect(() => {
    if (stepFromQuery === null) return;
    setCurrentStepIndex(stepFromQuery);
  }, [stepFromQuery]);

  useEffect(() => {
    if (!hasRestoredProgressRef.current) return;
    if (currentStepIndex !== 4) return;
    if (effectiveOrderRequestBody) return;

    setCurrentStepIndex(1);
    setOrderCreationError(
      "Your booking details need to be completed again before payment. Please review traveller information and continue."
    );
  }, [currentStepIndex, effectiveOrderRequestBody]);

  useEffect(() => {
    if (!offerId) {
      setSelectedFlight(null);
      setSelectedOffer(null);
      setSeatMapStatus(undefined);
      setFlightError("Selected flight was not provided.");
      setLoadingFlight(false);
      return;
    }

    let cancelled = false;
    const snapshotKey = `selected-offer:${offerId}`;

    function getStoredOfferSnapshot(): DuffelOffer | null {
      try {
        const raw = window.sessionStorage.getItem(snapshotKey);
        return raw ? (JSON.parse(raw) as DuffelOffer) : null;
      } catch {
        return null;
      }
    }

    async function run() {
      setLoadingFlight(true);
      setFlightError(null);

      try {
        const details = await getFlightOfferDetails(offerId);
        if (!cancelled) {
          setSelectedOffer(details.offer);
          setSeatMapStatus(details.seatMapStatus);
          setSelectedFlight(mapDuffelOfferToBookingViewModel(details.offer));
        }
      } catch (error: unknown) {
        if (!cancelled) {
          const fallbackOffer = getStoredOfferSnapshot();

          if (fallbackOffer) {
            setSelectedOffer(fallbackOffer);
            setSeatMapStatus(undefined);
            setSelectedFlight(mapDuffelOfferToBookingViewModel(fallbackOffer));
            setFlightError(
              "Live fare confirmation is temporarily unavailable. Showing the selected flight snapshot."
            );
          } else {
            setSelectedOffer(null);
            setSeatMapStatus(undefined);
            setSelectedFlight(null);
            setFlightError(getErrorMessage(error, "Failed to load selected flight."));
          }
        }
      } finally {
        if (!cancelled) {
          setLoadingFlight(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [offerId]);

  useEffect(() => {
    if (!tenantKey) {
      setTenantAddonSettings(null);
      setTenantSettingsError("Tenant key was not provided.");
      return;
    }

    let cancelled = false;

    async function run() {
      setLoadingTenantSettings(true);
      setTenantSettingsError(null);

      try {
        const settings = await getTenantAddonSettings(tenantKey);
        if (!cancelled) {
          setTenantAddonSettings(settings);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setTenantAddonSettings(null);
          setTenantSettingsError(
            getErrorMessage(error, "Failed to load tenant extras.")
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingTenantSettings(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [tenantKey]);

  const handleTravellerPayloadChange = useCallback(
    (payload: TravellerOrderPayload) => {
      setTravellerOrderPayload(payload);
    },
    []
  );

  const handleExtrasSelectionChange = useCallback(
    (selection: ExtrasOrderSelection) => {
      setExtrasSelection(selection);
    },
    []
  );

  const handlePaymentConfirmed = useCallback(
    async (paymentIntent: DuffelPaymentIntent) => {
      paymentIntentRef.current = paymentIntent;

      const requestBody = orderRequestBodyRef.current;
      if (!requestBody) {
        throw new Error(
          "Payment was confirmed, but order creation is not ready."
        );
      }

      setCreatingOrder(true);
      setOrderCreationError(null);
      setCreatedOrder(null);

      try {
        const response = await createOrder(requestBody);
        setCreatedOrder(response);
      } catch (error: unknown) {
        const message = getErrorMessage(error, "Order creation failed.");
        setOrderCreationError(message);
        throw new Error(`Payment was confirmed, but order creation failed: ${message}`);
      } finally {
        setCreatingOrder(false);
      }
    },
    []
  );

  const onNext = () => {
    if (currentStepIndex === 1 && !travellerValidation?.isValid) {
      setShowTravellerValidationErrors(true);
      return;
    }
    setCurrentStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const onBack = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <>
      <BookingLayout
        steps={STEPS}
        currentStepIndex={currentStepIndex}
        onStepChange={setCurrentStepIndex}
        onBack={onBack}
        onNext={onNext}
        canGoBack={currentStepIndex > 0}
        canGoNext={currentStepIndex < STEPS.length - 1}
        sidebar={
          <BookingSummarySidebar
            agentName={agentName}
            route={selectedFlight?.summary.route ?? "Select a flight"}
            travelDate={selectedFlight?.summary.travelDate ?? "-"}
            passengers={passengersLabel || "-"}
            baseFare={selectedFlight?.fare.baseFare ?? "-"}
            taxes={selectedFlight?.fare.taxes ?? "-"}
            addonsTotal={addonsTotalLabel}
            total={grandTotalLabel}
          />
        }
      >
        {currentStepIndex === 0 && (
        <>
          {loadingFlight ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
              Loading selected flight...
            </div>
          ) : flightError ? (
            <div
              className={`rounded-2xl border p-6 text-sm ${
                selectedFlight
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {flightError}
            </div>
          ) : null}

          {!loadingFlight && selectedFlight ? (
            <ReviewFlightStep
              summary={selectedFlight.summary}
              segments={selectedFlight.segments}
              baggageLabel={selectedFlight.baggageLabel}
              fare={selectedFlight.fare}
            />
          ) : null}
        </>
      )}

      {currentStepIndex === 1 && (
        <TravellerInfoStep
          key={travellerKey}
          travellers={travellers}
          initialPayload={travellerOrderPayload}
          initialDraft={travellerDraft}
          onDraftChange={setTravellerDraft}
          showValidationErrors={showTravellerValidationErrors}
          onValidationChange={setTravellerValidation}
          onPayloadChange={handleTravellerPayloadChange}
        />
      )}

      {currentStepIndex === 2 && (
        <div className="space-y-4">
          {loadingTenantSettings ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              Loading tenant extras...
            </div>
          ) : null}

          {tenantSettingsError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {tenantSettingsError}
            </div>
          ) : null}

          <ExtrasStep
            key={`${tenantKey}:${travellerKey}`}
            baggageSelections={baggageSelections}
            seatSelection={seatSelection}
            tenantAddonSettings={tenantAddonSettings}
            initialSelection={extrasSelection}
            onSelectionChange={handleExtrasSelectionChange}
          />
        </div>
      )}

      {currentStepIndex === 3 && (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
            <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-blue-600">
              Final review
            </div>
            <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
              Ready to create order
            </h3>
            <p className="mt-1.5 text-sm text-slate-600">
              Check the backend order inputs before moving to card payment.
            </p>
          </div>

          <div className="grid gap-3 p-5 text-sm text-slate-700 sm:p-6">
            <ReviewRow label="Tenant ID" value={tenantAddonSettings?.tenant_id ?? "-"} />
            <ReviewRow label="Tenant key" value={tenantKey} />
            <ReviewRow label="Offer ID" value={offerId || "-"} />
            <ReviewRow
              label="Passengers"
              value={travellerOrderPayload?.passengers.length ?? 0}
            />
            <ReviewRow
              label="Selected add-ons"
              value={`${extrasSelection?.totalAddonsAmount ?? 0} ${extrasSelection?.currency ?? extrasCurrency}`}
            />
          </div>
        </section>
      )}

      {currentStepIndex === 4 && (
        <div className="space-y-4">
          {creatingOrder ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Creating backend order...
            </div>
          ) : null}

          {orderCreationError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {orderCreationError}
            </div>
          ) : null}

          <PaymentStep
            offerId={offerId}
            amountLabel={grandTotalLabel}
            onPaymentConfirmed={handlePaymentConfirmed}
            onVerificationLoginRequired={(email) => {
              if (typeof window === "undefined") return;

              const url = new URL(window.location.href);
              url.searchParams.set("step", "payment");
              url.searchParams.set("login_email", email);
              const next = `${url.pathname}${url.search}`;

              router.push(`/SignIn?next=${encodeURIComponent(next)}`);
            }}
            emailVerificationRequired={authStatus !== "authenticated"}
            emailVerificationCompleted={Boolean(verifiedEmail)}
            initialVerificationEmail={travellerOrderPayload?.contact?.email}
            onEmailVerificationSuccess={async (email) => {
              setVerifiedEmail(email);
              await dispatch(authMe());
            }}
          />
        </div>
        )}
      </BookingLayout>

      {createdOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Booking completed
            </div>

            <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-950">
              Order created successfully
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your booking is confirmed and linked to your verified account.
            </p>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Booking reference
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {createdOrder.order?.booking_reference ?? "Reference unavailable"}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Go to home
              </button>
              <button
                type="button"
                onClick={() => router.push("/bookings")}
                className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                View my bookings
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ReviewRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="font-medium text-slate-500">{label}</span>
      <span className="font-semibold text-slate-950">{value}</span>
    </div>
  );
}
