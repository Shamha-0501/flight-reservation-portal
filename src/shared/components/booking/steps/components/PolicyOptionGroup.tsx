"use client";

import React from "react";
import PolicyUpgradeRow from "./PolicyUpgradeRow";
import type { PolicyGroup } from "../ExtrasStep";

type PolicyOptionGroupProps = PolicyGroup;

export default function PolicyOptionGroup({
  title,
  includedLabel,
  includedValue,
  upgrades,
}: PolicyOptionGroupProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-3.5">
        <div className="text-base font-semibold text-slate-950">{title}</div>
      </div>

      <div className="border-b border-slate-200 bg-slate-50/50 px-5 py-3.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              {includedLabel}
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {includedValue}
            </div>
          </div>

          <span className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700">
            Included
          </span>
        </div>
      </div>

      <div className="divide-y divide-slate-200">
        {upgrades.map((upgrade) => (
          <PolicyUpgradeRow key={upgrade.id} {...upgrade} />
        ))}
      </div>
    </div>
  );
}
