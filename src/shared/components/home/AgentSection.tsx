"use client";

import React from "react";
import Container from "@/src/shared/ui/Container"; // adjust path
import { BadgeCheck, Headphones, BarChart3, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function AgentSection() {
  const points = [
    { icon: BadgeCheck, text: "Create & manage bookings faster" },
    { icon: BarChart3, text: "Track commissions and performance" },
    { icon: Headphones, text: "Priority support for agents" },
  ];

  return (
    <section className="w-full">
      {/* Full-width belt background */}
      <div className="relative w-full overflow-hidden">
        {/* Background image */}
        <div
          className="
            absolute inset-0
            bg-[url('/assets/images/hero/agent-belt.jpg')]
            bg-cover bg-center
          "
        />

        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-grayscale-950/50" />

        {/* Content */}
        <Container size="container" className="relative py-10 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left */}
            <div>
              <p className="text-white/80 text-sm font-medium">
                Built for travel agencies & agents
              </p>

              <h2 className="mt-2 text-2xl sm:text-4xl font-bold text-white">
                Grow your bookings with our Agent Workspace
              </h2>

              <p className="mt-3 text-white/80 max-w-xl">
                Get exclusive tools to search, compare, book, and manage customers
                in one place—faster workflows, better deals, and reliable support.
              </p>

              <div className="mt-6 flex flex-wrap gap-4">
                <a
                  href="/agents/register"
                  className="
                    inline-flex items-center gap-2
                    rounded-xl bg-primary-500 px-5 py-3
                    text-white font-semibold shadow-lg
                    hover:bg-primary-600 transition
                  "
                >
                  Register as an Agent
                  <ArrowRight className="h-4 w-4" />
                </a>

                <a
                  href="/agents"
                  className="
                    inline-flex items-center gap-2
                    rounded-xl bg-white/10 px-5 py-3
                    text-white font-semibold ring-1 ring-white/20
                    hover:bg-white/15 transition
                  "
                >
                  Learn More
                </a>
              </div>
            </div>

            {/* Right (bullet list like your hero belts) */}
            <div className="rounded-2xl bg-white/10 ring-1 ring-white/15 p-6 backdrop-blur">
              <h3 className="text-white font-semibold text-lg">
                What agents can do
              </h3>

              <div className="mt-4 space-y-3">
                {points.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/25 ring-1 ring-primary-200/30">
                      <Icon className="h-5 w-5 text-white" />
                    </span>
                    <p className="text-white/85">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}
