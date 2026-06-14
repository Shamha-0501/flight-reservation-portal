"use client";

import React from "react";

type BookingSummarySidebarProps = {
  agentName: string;
  route: string;
  travelDate: string;
  passengers: string;
  baseFare: string;
  taxes: string;
  addonsTotal?: string;
  total: string;
};

export default function BookingSummarySidebar({
  agentName,
  route,
  travelDate,
  passengers,
  baseFare,
  taxes,
  addonsTotal = "Included",
  total,
}: BookingSummarySidebarProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-blue-600 to-sky-500 px-5 py-4 text-white">
        <div className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-100">
          Trip summary
        </div>
        <div className="mt-2 text-xl font-bold tracking-tight">{route}</div>
        <div className="mt-1 text-sm text-blue-50">{travelDate}</div>
        <div className="mt-1 text-sm text-blue-100">{passengers}</div>
      </div>

      <div className="p-5">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
            Ticketing partner
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {agentName}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Base fare</span>
            <span className="font-medium text-slate-800">{baseFare}</span>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Taxes & fees</span>
            <span className="font-medium text-slate-800">{taxes}</span>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Add-ons</span>
            <span className="font-medium text-slate-800">{addonsTotal}</span>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-950 px-4 py-4 text-white">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Total
              </div>
              <div className="mt-1 text-[28px] font-bold leading-none">
                {total}
              </div>
            </div>
            <div className="text-right text-xs text-slate-400">
              Includes taxes
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
          Your booking details and e-ticket updates will be shared using the
          contact information entered in the next steps.
        </div>
      </div>
    </div>
  );
}
