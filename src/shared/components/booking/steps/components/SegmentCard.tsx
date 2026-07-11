"use client";

import React from "react";
import clsx from "clsx";

type SegmentCardProps = {
  from: string;
  to: string;
  departTime: string;
  arriveTime: string;
  duration: string;
  airline: string;
  flightNumber: string;
  isLast?: boolean;
};

export default function SegmentCard({
  from,
  to,
  departTime,
  arriveTime,
  duration,
  airline,
  flightNumber,
  isLast = false,
}: SegmentCardProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm"
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {airline} • {flightNumber}
          </div>

          <div className="mt-4 flex items-center gap-4 sm:gap-6">
            <div>
              <div className="text-2xl font-bold tracking-tight text-slate-950">
                {departTime}
              </div>
              <div className="mt-1 text-sm font-medium text-slate-600">{from}</div>
            </div>

            <div className="flex min-w-[120px] flex-1 flex-col items-center">
              <div className="text-xs font-semibold text-slate-500">{duration}</div>
              <div className="mt-2 flex w-full items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                <span className="h-[2px] flex-1 rounded-full bg-slate-200" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              </div>
              <div className="mt-2 text-xs text-slate-400">
                {from} to {to}
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold tracking-tight text-slate-950">
                {arriveTime}
              </div>
              <div className="mt-1 text-sm font-medium text-slate-600">{to}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}