"use client";

import React from "react";
import Container from "@/src/shared/ui/Container"; // <-- adjust this path
import {
  Search,
  Scale,
  UserCheck,
  CreditCard,
  Check,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

interface Step {
  number: number;
  title: string;
  description: string;
  points: string[];
  Icon: LucideIcon;
}

const steps: Step[] = [
  {
    number: 1,
    title: "Search",
    description: "Choose route, dates, passengers and cabin class",
    points: ["Pick origin & destination", "Select travel dates", "Choose passengers & class"],
    Icon: Search,
  },
  {
    number: 2,
    title: "Compare",
    description: "Compare airlines by price, baggage and timings",
    points: ["View multiple airlines", "Compare baggage rules", "Filter by time & stops"],
    Icon: Scale,
  },
  {
    number: 3,
    title: "Passenger Details",
    description: "Enter traveller info and contact details",
    points: ["Add traveller names & info", "Save contact details", "Review booking summary"],
    Icon: UserCheck,
  },
  {
    number: 4,
    title: "Pay & Get E-Ticket",
    description: "Pay securely and receive your e-ticket instantly",
    points: ["Secure payment", "Instant confirmation", "E-ticket sent to email"],
    Icon: CreditCard,
  },
];

function StepCard({ step }: { step: Step }) {
  const { number, title, description, points, Icon } = step;

  return (
    <div className="relative group h-full">
      <div className="relative h-full overflow-hidden rounded-3xl p-8 border border-primary-50 bg-gradient-to-br from-primary-50 to-grayscale-50 transition-all duration-500 hover:shadow-2xl hover:scale-[1.03]">
        {/* soft corner bubble */}
        {/* <div className="pointer-events-none absolute -bottom-12 -right-12 h-44 w-44 rounded-full bg-primary-100/60" /> */}

        {/* top row */}
        <div className="relative flex items-start justify-between mb-6">
          <div className="bg-primary-500 text-white w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg">
            {number}
          </div>

          {/* icon always visible */}
          <div className="bg-primary-100 w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm">
            <Icon className="w-6 h-6 text-primary-600" />
          </div>
        </div>

        {/* content */}
        <h3 className="relative text-grayscale-900 text-2xl font-bold mb-3">
          {title}
        </h3>

        <p className="relative text-grayscale-700 text-base mb-6 leading-relaxed">
          {description}
        </p>

        <div className="relative space-y-3">
          {points.map((point) => (
            <div key={point} className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-50 ring-1 ring-green-200">
                <Check className="h-3.5 w-3.5 text-green-600" />
              </span>
              <span className="text-grayscale-800 text-sm leading-relaxed">
                {point}
              </span>
            </div>
          ))}
        </div>

        {/* hover overlay glow */}
        <div
          className="
            pointer-events-none absolute inset-0 rounded-3xl
            bg-gradient-to-br from-primary-400/10 to-grayscale-400/10
            opacity-0 transition-opacity duration-500
            group-hover:opacity-100
          "
        />
      </div>
    </div>
  );
}

export default function HowItWorksSection() {
  return (
    // default background (no section bg)
    <section className="py-16">
      <Container size="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-grayscale-900 mb-4">
            How It Works
          </h2>
          <p className="text-base sm:text-xl text-grayscale-700 max-w-2xl mx-auto">
            Book your flight in 4 simple steps and get your e-ticket instantly
          </p>

          <div className="mx-auto mt-5 h-1 w-16 rounded bg-primary-400" />
        </div>

        {/* 4 in a line on lg (your lg starts at 1280) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => (
            <StepCard key={step.number} step={step} />
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="bg-primary-500 text-white px-10 py-4 rounded-full text-lg font-semibold hover:bg-primary-600 transition-all duration-300 hover:shadow-xl hover:scale-105">
            <span className="inline-flex items-center gap-2">
              Get Started Now
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </span>
          </button>
        </div>
      </Container>
    </section>
  );
}
