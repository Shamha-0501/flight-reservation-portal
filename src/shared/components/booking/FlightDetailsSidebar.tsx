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

function SegmentCard({ seg }: { seg: Segment }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 transition hover:border-blue-200 hover:bg-blue-50/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-slate-950">
            {seg.departTime}
          </div>
          <div className="mt-0.5 text-xs font-semibold text-slate-500">
            {seg.from}
          </div>
        </div>

        <div className="flex flex-1 items-center gap-2 pt-2">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
            {seg.duration}
          </span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="text-right">
          <div className="text-sm font-bold text-slate-950">
            {seg.arriveTime}
          </div>
          <div className="mt-0.5 text-xs font-semibold text-slate-500">
            {seg.to}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="font-semibold text-slate-700">{seg.airline}</span>
        <span>•</span>
        <span>{seg.flightNumber}</span>
        <span>•</span>
        <span>{seg.type}</span>
      </div>
    </div>
  );
}

function JourneyBlock({
  label,
  date,
  segments,
}: {
  label: string;
  date: string;
  segments: Segment[];
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600">
            {label}
          </div>
          <div className="mt-1 text-sm font-bold text-slate-950">{date}</div>
        </div>

        <div className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600">
          {segments.length} segment{segments.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {segments.map((seg) => (
          <SegmentCard key={seg.id} seg={seg} />
        ))}
      </div>
    </section>
  );
}

export default function FlightDetailsSidebar({
  summaryRoute,
  outbound,
  inbound,
  includedBaggage,
}: FlightDetailsSidebarProps) {
  return (
    <aside className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-sky-500 px-4 py-4 text-white">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-100">
            Flight details
          </div>
          <div className="mt-2 text-lg font-extrabold tracking-tight">
            {summaryRoute}
          </div>
          <p className="mt-1 text-xs leading-5 text-blue-100">
            Review your selected itinerary before continuing checkout.
          </p>
        </div>
      </section>

      <JourneyBlock
        label="Outbound"
        date={outbound.date}
        segments={outbound.segments}
      />

      {inbound?.segments?.length ? (
        <JourneyBlock
          label="Return"
          date={inbound.date}
          segments={inbound.segments}
        />
      ) : null}

      <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
            <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
              <path
                d="M6.5 7V5.75A2.75 2.75 0 0 1 9.25 3h1.5a2.75 2.75 0 0 1 2.75 2.75V7M5.5 7h9A1.5 1.5 0 0 1 16 8.5v6A1.5 1.5 0 0 1 14.5 16h-9A1.5 1.5 0 0 1 4 14.5v-6A1.5 1.5 0 0 1 5.5 7Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div>
            <div className="text-sm font-bold text-slate-950">
              Included baggage
            </div>
            <div className="mt-1 text-sm leading-5 text-slate-600">
              {includedBaggage}
            </div>
          </div>
        </div>
      </section>
    </aside>
  );
}