"use client";

import React from "react";

type Segment = {
  id: string;
  airline: string;
  flightNumber: string;
  from: string;
  to: string;
  departTime: string;
  arriveTime: string;
  duration: string;
  type: string;
};

type FlightDetailsSidebarProps = {
  summaryRoute: string;
  outbound: {
    date: string;
    segments: Segment[];
  };
  inbound: {
    date: string;
    segments: Segment[];
  };
  includedBaggage: string;
};

export default function FlightDetailsSidebar({
  summaryRoute,
  outbound,
  inbound,
  includedBaggage,
}: FlightDetailsSidebarProps) {
  return (
    <aside className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">Flight details</div>
        <div className="mt-2 text-xs text-slate-500">{summaryRoute}</div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-xs font-semibold text-slate-500">Outbound</div>
        <div className="text-sm font-semibold text-slate-900">{outbound.date}</div>
        <div className="mt-3 space-y-3">
          {outbound.segments.map((seg) => (
            <div key={seg.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                <span>
                  {seg.departTime} {seg.from}
                </span>
                <span>{seg.arriveTime}</span>
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {seg.airline} {seg.flightNumber} • {seg.duration} • {seg.type}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-xs font-semibold text-slate-500">Return</div>
        <div className="text-sm font-semibold text-slate-900">{inbound.date}</div>
        <div className="mt-3 space-y-3">
          {inbound.segments.map((seg) => (
            <div key={seg.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                <span>
                  {seg.departTime} {seg.from}
                </span>
                <span>{seg.arriveTime}</span>
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {seg.airline} {seg.flightNumber} • {seg.duration} • {seg.type}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-xs text-emerald-700">
        Included baggage: {includedBaggage}
      </div>
    </aside>
  );
}
