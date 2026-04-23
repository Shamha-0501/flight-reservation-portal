"use client";

import React from "react";

type FareSummaryBoxProps = {
  baseFare: string;
  taxes: string;
  total: string;
};

export default function FareSummaryBox({
  baseFare,
  taxes,
  total,
}: FareSummaryBoxProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-base font-semibold text-slate-900">
            Fare summary
          </div>
          <div className="mt-1 text-sm text-slate-500">
            Includes airline fare, taxes and mandatory charges
          </div>
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

        <div className="border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900">Total</span>
            <span className="text-xl font-bold tracking-tight text-slate-950">
              {total}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}