"use client";

import React from "react";
import AddonCard from "./AddonCard";
import type { AddonItem } from "../ExtrasStep";

type AddonsSectionProps = {
  addons: AddonItem[];
  selectedAddonIds: string[];
  onAddonToggle: (id: string) => void;
};

export default function AddonsSection({
  addons,
  selectedAddonIds,
  onAddonToggle,
}: AddonsSectionProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
        <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-blue-600">
          Add-ons & protection
        </div>
        <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
          Optional services for peace of mind
        </h3>
        <p className="mt-1.5 text-sm text-slate-600">
          Select the optional services available for this workspace.
        </p>
      </div>

      {addons.length === 0 ? (
        <div className="p-5 sm:p-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            No optional add-ons are available for this workspace.
          </div>
        </div>
      ) : (
        <div className="grid gap-3 p-5 sm:p-6">
          {addons.map((addon) => (
            <AddonCard
              key={addon.id}
              {...addon}
              selected={selectedAddonIds.includes(addon.id)}
              onToggle={() => onAddonToggle(addon.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
