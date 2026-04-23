"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Container from "@/src/shared/ui/Container";
import FlightDetailsSidebar from "@/src/shared/components/booking/FlightDetailsSidebar";

const AGENTS = [
  {
    id: "agent-aurora",
    name: "Aurora Travels",
    rating: 4.8,
    ticketCount: 1240,
    serviceFee: 8,
  },
  {
    id: "agent-skyline",
    name: "Skyline Tickets",
    rating: 4.6,
    ticketCount: 980,
    serviceFee: 6,
  },
  {
    id: "agent-mytrip",
    name: "MyTrip",
    rating: 4.7,
    ticketCount: 383,
    serviceFee: 9,
  },
];

const FALLBACK_FLIGHT = {
  title: "New Delhi",
  meta: "1 traveler • Roundtrip • Economy class",
  summaryRoute: "CMB → DEL",
  outbound: {
    date: "Mon, Apr 13, 2026",
    segments: [
      {
        id: "out-1",
        airline: "IndiGo",
        flightNumber: "6E1170",
        from: "CMB",
        to: "DEL",
        departTime: "11:05 PM",
        arriveTime: "2:50 AM",
        duration: "3h 45m",
        type: "Direct",
      },
    ],
  },
  inbound: {
    date: "Mon, Apr 20, 2026",
    segments: [
      {
        id: "in-1",
        airline: "IndiGo",
        flightNumber: "6E1169",
        from: "DEL",
        to: "CMB",
        departTime: "6:25 PM",
        arriveTime: "9:55 PM",
        duration: "3h 30m",
        type: "Direct",
      },
    ],
  },
  includedBaggage: "Carry-on + 20kg checked",
  basePrice: 115105,
  currency: "LKR",
};

export default function AgentsPage() {
  const searchParams = useSearchParams();
  const offerId = searchParams.get("offerId") || "demo-offer";

  const flight = useMemo(() => FALLBACK_FLIGHT, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-[#061b3a] text-white">
        <Container className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide">
            <Link href="/flights" className="flex items-center gap-2 text-white">
              <span className="text-base">←</span> Back to results
            </Link>
            <div />
            <div />
          </div>
          <div className="mt-8">
            <h1 className="text-3xl font-bold">{flight.title}</h1>
            <p className="mt-1 text-sm text-white/80">{flight.meta}</p>
          </div>
        </Container>
      </div>

      <Container className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <div className="grid gap-4">
              {AGENTS.map((agent) => {
                const total = flight.basePrice + agent.serviceFee * 1000;
                return (
                  <div
                    key={agent.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-900">
                            {agent.name}
                          </h3>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                            Airline
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          ⭐ {agent.rating} • {agent.ticketCount} reviews
                        </div>
                        <div className="mt-3 text-xs text-slate-500">
                          Fare details • 24/7 support
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-900">
                          {flight.currency} {total.toLocaleString()}
                        </div>
                        <div className="mt-3">
                          <Link
                            href={`/booking?tenant_id=${agent.id}&offerId=${offerId}`}
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
                          >
                            Select
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <FlightDetailsSidebar
            summaryRoute={flight.summaryRoute}
            outbound={flight.outbound}
            inbound={flight.inbound}
            includedBaggage={flight.includedBaggage}
          />
        </div>
      </Container>
    </div>
  );
}
