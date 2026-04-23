"use client";

import React from "react";
import BaggageSelectionCard from "./BaggageSelectionCard";
import SeatSelectionCard from "./SeatSelectionCard";
import type {
  TravellerBaggage,
  SeatSelectionSummary,
} from "../ExtrasStep";

type FlightExtrasSectionProps = {
  baggageSelections: TravellerBaggage[];
  seatSelection: SeatSelectionSummary;
};

export default function FlightExtrasSection({
  baggageSelections,
  seatSelection,
}: FlightExtrasSectionProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-3.5 sm:px-6">
        <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-blue-600">
          Flight extras
        </div>
        <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
          Enhance your journey
        </h3>
        <p className="mt-1.5 text-sm text-slate-600">
          Manage baggage and seats for your selected trip.
        </p>
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        <div className="space-y-4">
          {baggageSelections.map((item) => (
            <BaggageSelectionCard key={item.travellerId} {...item} />
          ))}
        </div>

        <SeatSelectionCard {...seatSelection} />
      </div>
    </section>
  );
}
