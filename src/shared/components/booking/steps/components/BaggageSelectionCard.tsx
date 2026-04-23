"use client";

import React from "react";
import BaggageOptionRow from "./BaggageOptionRow";
import type { TravellerBaggage } from "../ExtrasStep";

type BaggageSelectionCardProps = TravellerBaggage;

export default function BaggageSelectionCard({
  travellerLabel,
  includedLabel,
  options,
}: BaggageSelectionCardProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-2.5 border-b border-slate-200 bg-slate-50/60 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-base font-semibold text-slate-950">
            {travellerLabel}
          </div>
          <div className="mt-0.5 text-sm text-slate-600">
            Included baggage: {includedLabel}
          </div>
        </div>

        <span className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
          Baggage available
        </span>
      </div>

      <div className="divide-y divide-slate-200">
        {options.map((option) => (
          <BaggageOptionRow key={option.id} {...option} />
        ))}
      </div>
    </div>
  );
}
