"use client";

import React from "react";
import BaggageSelectionCard from "./BaggageSelectionCard";
import SeatSelectionCard from "./SeatSelectionCard";
import type { SeatSelectionSummary, TravellerBaggage } from "../ExtrasStep";

type FlightExtrasSectionProps = {
  baggageSelections: TravellerBaggage[];
  selectedBaggageByTraveller: Record<string, string>;
  onBaggageSelect: (travellerId: string, optionId: string) => void;
  seatSelection: SeatSelectionSummary;
};

export default function FlightExtrasSection({
  baggageSelections,
  selectedBaggageByTraveller,
  onBaggageSelect,
  seatSelection,
}: FlightExtrasSectionProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
        <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-blue-600">
          Flight extras
        </div>
        <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
          Enhance your journey
        </h3>
        <p className="mt-1.5 text-sm text-slate-600">
          Manage airline-related services for your selected trip.
        </p>
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        <div className="space-y-4">
          {baggageSelections.map((item) => (
            <BaggageSelectionCard
              key={item.travellerId}
              {...item}
              selectedOptionId={selectedBaggageByTraveller[item.travellerId]}
              onSelect={(optionId) => onBaggageSelect(item.travellerId, optionId)}
            />
          ))}
        </div>

        <SeatSelectionCard {...seatSelection} />
      </div>
    </section>
  );
}