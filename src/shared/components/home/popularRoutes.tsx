import Container from "@/src/shared/ui/Container";
import Link from "next/link";
import { ArrowRight, Calendar, PlaneTakeoff, Tag } from "lucide-react";

type Deal = {
  fromCode: string;
  fromCity: string;
  toCode: string;
  toCity: string;
  priceFrom: number;
  currency: string;
  hint: string; // date / season hint
  badge?: string; // Optional: "Hot deal", "Limited"
};

const deals: Deal[] = [
  {
    fromCode: "CMB",
    fromCity: "Colombo",
    toCode: "DXB",
    toCity: "Dubai",
    priceFrom: 389,
    currency: "USD",
    hint: "Best fares in Feb–Mar",
    badge: "Hot deal",
  },
  {
    fromCode: "CMB",
    fromCity: "Colombo",
    toCode: "SIN",
    toCity: "Singapore",
    priceFrom: 219,
    currency: "USD",
    hint: "Weekend trips available",
  },
  {
    fromCode: "CMB",
    fromCity: "Colombo",
    toCode: "BKK",
    toCity: "Bangkok",
    priceFrom: 249,
    currency: "USD",
    hint: "Great for 3–5 day trips",
  },
  {
    fromCode: "CMB",
    fromCity: "Colombo",
    toCode: "DEL",
    toCity: "Delhi",
    priceFrom: 159,
    currency: "USD",
    hint: "Low fares mid-week",
    badge: "Limited",
  },
  {
    fromCode: "CMB",
    fromCity: "Colombo",
    toCode: "KUL",
    toCity: "Kuala Lumpur",
    priceFrom: 199,
    currency: "USD",
    hint: "Cheapest this month",
  },
  {
    fromCode: "CMB",
    fromCity: "Colombo",
    toCode: "DOH",
    toCity: "Doha",
    priceFrom: 349,
    currency: "USD",
    hint: "Good connections",
  },
];

export default function PopularRoutesSection() {
  return (
    <section className="w-full bg-gray-200 dark:bg-gray-900">
      <Container size="container" className="py-16">
        <div className="px-6">
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
              Popular Routes & Deals
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-2xl">
              Quick picks based on common routes across South Asia—compare prices and book faster.
            </p>
            <div className="mt-5 h-1 w-20 rounded-full bg-blue-700" />
          </div>

          {/* Cards */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.map((d) => (
              <DealCard key={`${d.fromCode}-${d.toCode}`} deal={d} />
            ))}
          </div>

          {/* Footer CTA */}
          <div className="mt-10 flex justify-center">
            <Link
              href="/flights"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-blue-800 transition"
            >
              View all deals <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

function DealCard({ deal }: { deal: Deal }) {
  const href = `/flights?from=${deal.fromCode}&to=${deal.toCode}`;

  return (
    <div
      className="
        rounded-2xl bg-white dark:bg-gray-900
        ring-1 ring-gray-100 dark:ring-gray-800
        shadow-[0_10px_25px_rgba(0,0,0,0.08)]
        hover:shadow-[0_16px_35px_rgba(0,0,0,0.12)]
        transition
        overflow-hidden
      "
    >
      {/* top strip */}
      <div className="px-5 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700">
              <PlaneTakeoff className="h-5 w-5 text-white" />
            </span>

            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {deal.fromCode} → {deal.toCode}
              </p>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                {deal.fromCity} <span className="text-gray-400">→</span> {deal.toCity}
              </h3>
            </div>
          </div>

          {deal.badge ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
              <Tag className="h-3.5 w-3.5" />
              {deal.badge}
            </span>
          ) : null}
        </div>

        {/* price */}
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">From</p>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
              {deal.currency} {deal.priceFrom}
            </p>
          </div>

          <Link
            href={href}
            className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 transition"
          >
            Book
          </Link>
        </div>

        {/* hint */}
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2">
          <Calendar className="h-4 w-4 text-blue-700 dark:text-blue-300" />
          <p className="text-xs text-gray-600 dark:text-gray-300">{deal.hint}</p>
        </div>
      </div>

      {/* bottom spacing */}
      <div className="h-5" />
    </div>
  );
}
