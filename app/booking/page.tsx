"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import BookingLayout from "@/src/shared/components/booking/BookingLayout";
import ReviewFlightStep from "@/src/shared/components/booking/steps/ReviewFlightStep";
import BookingSummarySidebar from "@/src/shared/components/booking/summary/BookingSummarySidebar";
import TravellerInfoStep from "@/src/shared/components/booking/steps/TravellerInfoStep";
import ExtrasStep from "@/src/shared/components/booking/steps/ExtrasStep";

const STEPS = [
  { id: "review", label: "Review Flight" },
  { id: "travellers", label: "Travellers" },
  { id: "extras", label: "Extras" },
  { id: "review-final", label: "Review" },
  { id: "payment", label: "Payment" },
];

const MOCK_FLIGHT = {
  summary: {
    route: "CMB → DXB",
    travelDate: "Fri, 25 Aug 2026",
    duration: "5h 40m",
    stops: "Non-stop",
  },
  segments: [
    {
      id: "seg-1",
      from: "CMB",
      to: "DXB",
      departTime: "09:40",
      arriveTime: "12:10",
      duration: "5h 40m",
      airline: "Emirates",
      flightNumber: "EK 655",
    },
  ],
  baggageLabel: "Included baggage: 25kg",
  fare: {
    baseFare: "$420.00",
    taxes: "$86.00",
    total: "$506.00",
  },
};

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

  const tenantId = searchParams.get("tenant_id") || "agent-aurora";
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
          route={MOCK_FLIGHT.summary.route}
          travelDate={MOCK_FLIGHT.summary.travelDate}
          passengers="1 adult"
          baseFare={MOCK_FLIGHT.fare.baseFare}
          taxes={MOCK_FLIGHT.fare.taxes}
          total={MOCK_FLIGHT.fare.total}
        />
      }
    >
      {currentStepIndex === 0 && (
        <ReviewFlightStep
          summary={MOCK_FLIGHT.summary}
          segments={MOCK_FLIGHT.segments}
          baggageLabel={MOCK_FLIGHT.baggageLabel}
          fare={MOCK_FLIGHT.fare}
        />
      )}

      {currentStepIndex === 1 && (
        <TravellerInfoStep travellers={travellers} />
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

      {currentStepIndex > 2 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Step UI coming soon.
        </div>
      )}
    </BookingLayout>
  );
}
