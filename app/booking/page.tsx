"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getFlightOffer } from "@/src/api/routes/flightSearch/search";
import BookingLayout from "@/src/shared/components/booking/BookingLayout";
import ReviewFlightStep from "@/src/shared/components/booking/steps/ReviewFlightStep";
import BookingSummarySidebar from "@/src/shared/components/booking/summary/BookingSummarySidebar";
import TravellerInfoStep, {
  buildCreateOrderRequestBody,
  type CreateOrderRequestBody,
  type TravellerOrderPayload,
} from "@/src/shared/components/booking/steps/TravellerInfoStep";
import ExtrasStep from "@/src/shared/components/booking/steps/ExtrasStep";
import PaymentStep from "@/src/shared/components/booking/steps/PaymentStep";
import { mapDuffelOfferToBookingViewModel } from "@/src/shared/lib/flightsData";
import type { DuffelPaymentIntent } from "@/src/api/routes/orders/payment";

const STEPS = [
  { id: "review", label: "Review Flight" },
  { id: "travellers", label: "Travellers" },
  { id: "extras", label: "Extras" },
  { id: "review-final", label: "Review" },
  { id: "payment", label: "Payment" },
];

const buildTravellersFromCounts = (
  adults: number,
  children: number,
  infants: number
) => {
  const travellers: Array<{
    id: string;
    type: "ADULT" | "CHILD" | "INFANT";
    label: string;
    note?: string;
  }> = [];

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

export default function BookingPage() {
  const searchParams = useSearchParams();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedFlight, setSelectedFlight] = useState<any | null>(null);
  const [loadingFlight, setLoadingFlight] = useState(false);
  const [flightError, setFlightError] = useState<string | null>(null);
  const travellerOrderPayloadRef = useRef<TravellerOrderPayload | null>(null);
  const orderRequestBodyRef = useRef<CreateOrderRequestBody | null>(null);
  const paymentIntentRef = useRef<DuffelPaymentIntent | null>(null);

  const tenantId = searchParams.get("tenant_id") || "agent-aurora";
  const offerId = searchParams.get("offerId") || "";
  const adults = Number(searchParams.get("adults") || 1);
  const children = Number(searchParams.get("children") || 0);
  const infants = Number(searchParams.get("infants") || 0);

  const travellers = useMemo(
    () => buildTravellersFromCounts(adults, children, infants),
    [adults, children, infants]
  );
  const agentName = useMemo(() => {
    if (tenantId === "agent-skyline") return "Skyline Tickets";
    return "Aurora Travels";
  }, [tenantId]);
  const passengersLabel = useMemo(() => {
    const parts: string[] = [];

    if (adults > 0) parts.push(`${adults} adult${adults === 1 ? "" : "s"}`);
    if (children > 0) parts.push(`${children} child${children === 1 ? "" : "ren"}`);
    if (infants > 0) parts.push(`${infants} infant${infants === 1 ? "" : "s"}`);

    return parts.join(", ");
  }, [adults, children, infants]);

  useEffect(() => {
    if (!offerId) {
      setSelectedFlight(null);
      setFlightError("Selected flight was not provided.");
      setLoadingFlight(false);
      return;
    }

    let cancelled = false;
    const snapshotKey = `selected-offer:${offerId}`;

    function getStoredOfferSnapshot() {
      try {
        const raw = window.sessionStorage.getItem(snapshotKey);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    }

    async function run() {
      setLoadingFlight(true);
      setFlightError(null);

      try {
        const offer = await getFlightOffer(offerId);
        if (!cancelled) {
          setSelectedFlight(mapDuffelOfferToBookingViewModel(offer));
        }
      } catch (error: any) {
        if (!cancelled) {
          const fallbackOffer = getStoredOfferSnapshot();

          if (fallbackOffer) {
            setSelectedFlight(mapDuffelOfferToBookingViewModel(fallbackOffer));
            setFlightError(
              "Live fare confirmation is temporarily unavailable. Showing the selected flight snapshot."
            );
          } else {
            setSelectedFlight(null);
            setFlightError(error?.message || "Failed to load selected flight.");
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

  const onNext = () => {
    setCurrentStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const onBack = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
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
          travelDate={selectedFlight?.summary.travelDate ?? "—"}
          passengers={passengersLabel || "—"}
          baseFare={selectedFlight?.fare.baseFare ?? "—"}
          taxes={selectedFlight?.fare.taxes ?? "—"}
          total={selectedFlight?.fare.total ?? "—"}
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
          travellers={travellers}
          onPayloadChange={(payload) => {
            travellerOrderPayloadRef.current = payload;
            orderRequestBodyRef.current = offerId
              ? buildCreateOrderRequestBody(offerId, payload)
              : null;
          }}
        />
      )}

      {currentStepIndex === 2 && (
      <ExtrasStep
     baggageSelections={[
      {
        travellerId: "adult-1",
        travellerLabel: "Adult 1",
        includedLabel: "25kg",
        options: [
          {
            id: "bag-none",
            label: "No extra baggage",
            price: "Included",
            selected: true,
          },
          {
            id: "bag-10",
            label: "Add extra 10kg",
            description: "Additional checked baggage allowance",
            price: "+ $35.00",
          },
          {
            id: "bag-20",
            label: "Add extra 20kg",
            description: "Additional checked baggage allowance",
            price: "+ $60.00",
          },
        ],
      },
    ]}
    seatSelection={{
      title: "Seat selection",
      subtitle: "No seats selected yet. Choose preferred seats for your journey.",
      ctaLabel: "Choose seats",
    }}
    policies={[
      {
        id: "cancellation",
        title: "Cancellation",
        includedLabel: "Current policy",
        includedValue: "Non-refundable",
        upgrades: [
          {
            id: "cancel-80",
            label: "80% refund guarantee",
            description: "Get partial fare protection if you cancel.",
            price: "+ $24.00",
          },
          {
            id: "cancel-100",
            label: "100% refund guarantee",
            description: "Maximum flexibility for unexpected changes.",
            price: "+ $39.00",
            recommended: true,
          },
        ],
      },
      {
        id: "changes",
        title: "Changes",
        includedLabel: "Current policy",
        includedValue: "No changes allowed",
        upgrades: [
          {
            id: "flex-dates",
            label: "Flexible booking option",
            description: "Change your travel dates with added support.",
            price: "+ $18.00",
          },
        ],
      },
    ]}
    addons={[
      {
        id: "sms",
        title: "SMS ticket updates",
        description:
          "Receive booking updates and ticket details directly by SMS.",
        price: "+ $3.49",
      },
      {
        id: "airhelp",
        title: "AirHelp Plus",
        description:
          "Support for flight disruption compensation and reimbursement services.",
        price: "+ $10.99",
      },
      {
        id: "insurance",
        title: "Travel insurance",
        description:
          "Add extra travel protection for covered disruptions and emergencies.",
        price: "+ $12.50",
      },
    ]}
  />
)}

      {currentStepIndex === 3 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Step UI coming soon.
        </div>
      )}

      {currentStepIndex === 4 && (
        <PaymentStep
          offerId={offerId}
          amountLabel={selectedFlight?.fare.total}
          onPaymentConfirmed={(paymentIntent) => {
            paymentIntentRef.current = paymentIntent;
          }}
        />
      )}
    </BookingLayout>
  );
}
