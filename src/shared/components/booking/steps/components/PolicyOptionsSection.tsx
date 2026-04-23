"use client";

import React from "react";
import PolicyOptionGroup from "./PolicyOptionGroup";
import type { PolicyGroup } from "../ExtrasStep";

type PolicyOptionsSectionProps = {
  policies: PolicyGroup[];
};

export default function PolicyOptionsSection({
  policies,
}: PolicyOptionsSectionProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-3.5 sm:px-6">
        <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-blue-600">
          Cancellations & changes
        </div>
        <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
          Add flexibility to your booking
        </h3>
        <p className="mt-1.5 text-sm text-slate-600">
          Review included policies and optional upgrade protection.
        </p>
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        {policies.map((policy) => (
          <PolicyOptionGroup key={policy.id} {...policy} />
        ))}
      </div>
    </section>
  );
}
