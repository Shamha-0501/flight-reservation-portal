"use client";

import React from "react";

type SeatSelectionCardProps = {
  title: string;
  subtitle: string;
  ctaLabel: string;
};

export default function SeatSelectionCard({
  title,
  subtitle,
  ctaLabel,
}: SeatSelectionCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-base font-semibold text-slate-950">{title}</div>
          <div className="mt-2">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-700">
              Not selected
            </span>
          </div>
          <div className="mt-2 text-sm text-slate-600">{subtitle}</div>
        </div>

        <button
          type="button"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
