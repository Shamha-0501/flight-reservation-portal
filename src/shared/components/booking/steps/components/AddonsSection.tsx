"use client";

import React from "react";
import AddonCard from "./AddonCard";
import type { AddonItem } from "../ExtrasStep";

type AddonsSectionProps = {
  addons: AddonItem[];
};

export default function AddonsSection({ addons }: AddonsSectionProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-3.5 sm:px-6">
        <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-blue-600">
          Add-ons & protection
        </div>
        <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
          Optional services for peace of mind
        </h3>
        <p className="mt-1.5 text-sm text-slate-600">
          Add travel support and platform services to your booking.
        </p>
      </div>

      <div className="space-y-3 p-5 sm:p-6">
        {addons.map((addon) => (
          <AddonCard key={addon.id} {...addon} />
        ))}
      </div>
    </section>
  );
}
