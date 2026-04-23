"use client";

import React from "react";
import ExtrasIntroCard from "./components/ExtrasIntroCard";
import FlightExtrasSection from "./components/FlightExtrasSection";
import PolicyOptionsSection from "./components/PolicyOptionsSection";
import AddonsSection from "./components/AddonsSection";

export type BaggageOption = {
  id: string;
  label: string;
  price: string;
  description?: string;
  selected?: boolean;
};

export type TravellerBaggage = {
  travellerId: string;
  travellerLabel: string;
  includedLabel: string;
  options: BaggageOption[];
};

export type SeatSelectionSummary = {
  title: string;
  subtitle: string;
  ctaLabel: string;
};

export type PolicyUpgrade = {
  id: string;
  label: string;
  description?: string;
  price: string;
  recommended?: boolean;
  selected?: boolean;
};

export type PolicyGroup = {
  id: string;
  title: string;
  includedLabel: string;
  includedValue: string;
  upgrades: PolicyUpgrade[];
};

export type AddonItem = {
  id: string;
  title: string;
  description: string;
  price: string;
  icon?: React.ReactNode;
  selected?: boolean;
};

type ExtrasStepProps = {
  baggageSelections: TravellerBaggage[];
  seatSelection: SeatSelectionSummary;
  policies: PolicyGroup[];
  addons: AddonItem[];
};

export default function ExtrasStep({
  baggageSelections,
  seatSelection,
  policies,
  addons,
}: ExtrasStepProps) {
  return (
    <div className="space-y-5">
      <ExtrasIntroCard
        title="Customize your trip"
        description="Add baggage, seats and optional protections before you continue to review."
      />

      <FlightExtrasSection
        baggageSelections={baggageSelections}
        seatSelection={seatSelection}
      />

      <PolicyOptionsSection policies={policies} />

      <AddonsSection addons={addons} />
    </div>
  );
}
