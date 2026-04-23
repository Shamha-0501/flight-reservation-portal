"use client";

import React from "react";
import FlightSummaryCard from "@/src/shared/components/booking/steps/components/FlightSummaryCard";
import SegmentCard from "@/src/shared/components/booking/steps/components/SegmentCard";
import BaggageInfoBadge from "@/src/shared/components/booking/steps/components/BaggageInfoBadge";
import FareSummaryBox from "@/src/shared/components/booking/steps/components/FareSummaryBox";

type Segment = {
  id: string;
  from: string;
  to: string;
  departTime: string;
  arriveTime: string;
  duration: string;
  airline: string;
  flightNumber: string;
};

type ReviewFlightStepProps = {
  summary: {
    route: string;
    travelDate: string;
    duration: string;
    stops: string;
  };
  segments: Segment[];
  baggageLabel: string;
  fare: {
    baseFare: string;
    taxes: string;
    total: string;
  };
};

export default function ReviewFlightStep({
  summary,
  segments,
  baggageLabel,
  fare,
}: ReviewFlightStepProps) {
  return (
    <div className="space-y-6">
      <FlightSummaryCard
        route={summary.route}
        travelDate={summary.travelDate}
        duration={summary.duration}
        stops={summary.stops}
      />

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-base font-semibold text-slate-900">
                Flight segments
              </div>
              <div className="mt-1 text-sm text-slate-500">
                Review the selected journey details before continuing
              </div>
            </div>

            <BaggageInfoBadge label={baggageLabel} />
          </div>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          {segments.map((segment, index) => (
            <SegmentCard key={segment.id} {...segment} isLast={index === segments.length - 1} />
          ))}
        </div>
      </section>

      <FareSummaryBox
        baseFare={fare.baseFare}
        taxes={fare.taxes}
        total={fare.total}
      />
    </div>
  );
}