"use client";

import React from "react";
import PolicyUpgradeRow from "./PolicyUpgradeRow";
import type { PolicyGroup } from "../ExtrasStep";

type PolicyOptionGroupProps = PolicyGroup & {
  selectedOptionId: string | null;
  onSelect: (optionId: string) => void;
};

export default function PolicyOptionGroup({
  title,
  includedLabel,
  includedValue,
  upgrades,
  selectedOptionId,
  onSelect,
}: PolicyOptionGroupProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-base font-semibold text-slate-950">{title}</div>
          <div className="mt-1 text-sm text-slate-500">
            Choose one upgrade, or keep the included policy.
          </div>
        </div>

        <span className="inline-flex w-fit items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          Optional
        </span>
      </div>

      <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              {includedLabel}
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {includedValue}
            </div>
          </div>

          <span className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
            Included
          </span>
        </div>
      </div>

      <div className="divide-y divide-slate-200">
        {upgrades.map((upgrade) => (
          <PolicyUpgradeRow
            key={upgrade.id}
            {...upgrade}
            selected={selectedOptionId === upgrade.id}
            onSelect={() => onSelect(upgrade.id)}
          />
        ))}
      </div>
    </div>
  );
}