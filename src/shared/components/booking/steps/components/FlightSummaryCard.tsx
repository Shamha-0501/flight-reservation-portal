"use client";

import React from "react";

type FlightSummaryCardProps = {
  route: string;
  travelDate: string;
  duration: string;
  stops: string;
};

export default function FlightSummaryCard({
  route,
  travelDate,
  duration,
  stops,
}: FlightSummaryCardProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400" />

      <div className="p-6 sm:p-7">
        <div className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
          Selected flight
        </div>

        <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {route}
            </h2>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              {travelDate}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700">
              {duration}
            </span>
            <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3.5 py-1.5 text-xs font-semibold text-sky-700">
              {stops}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}