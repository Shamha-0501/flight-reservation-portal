"use client";

import React from "react";
import BaggageOptionRow from "./BaggageOptionRow";
import type { TravellerBaggage } from "../ExtrasStep";

type BaggageSelectionCardProps = TravellerBaggage & {
  selectedOptionId: string;
  onSelect: (optionId: string) => void;
};

export default function BaggageSelectionCard({
  travellerLabel,
  includedLabel,
  options,
  selectedOptionId,
  onSelect,
}: BaggageSelectionCardProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-base font-semibold text-slate-950">
            {travellerLabel}
          </div>
          <div className="mt-1 text-sm text-slate-600">
            Included baggage:{" "}
            <span className="font-semibold text-slate-900">
              {includedLabel}
            </span>
          </div>
        </div>

        <span className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          Included allowance
        </span>
      </div>

      <div className="divide-y divide-slate-200">
        {options.map((option) => (
          <BaggageOptionRow
            key={option.id}
            {...option}
            selected={selectedOptionId === option.id}
            onSelect={() => onSelect(option.id)}
          />
        ))}
      </div>
    </div>
  );
}