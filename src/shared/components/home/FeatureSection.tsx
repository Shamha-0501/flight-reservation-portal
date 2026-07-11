import Container from "@/src/shared/ui/Container";
import FeatureCard from "./FeatureCard";
import { BadgeCheck, ShieldCheck, Headphones } from "lucide-react";

export default function FeaturesSection() {
  const features = [
    {
      title: "Best Price Options",
      description: "Compare multiple airlines in one place and pick the best fare.",
      Icon: BadgeCheck,
    },
    {
      title: "Secure Booking",
      description: "Your booking data is handled safely with modern security practices.",
      Icon: ShieldCheck,
    },
    {
      title: "Agent-Friendly Workflow",
      description: "Fast booking tools designed for travel agencies and frequent bookings.",
      Icon: Headphones,
    },
  ];

  return (
    <section className="py-16">
      <Container>
        <div className="px-6">
          {/* Title */}
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
              Why Choose FlightPortal?
            </h2>

            <p className="mt-3 text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              A simple, transparent way to search and book flights across South Asia.
            </p>

            {/* Small divider line */}
            <div className="mt-6 flex justify-center">
              <span className="h-1 w-20 rounded-full bg-blue-700" />
            </div>
          </div>

          {/* Grid */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center">
            {features.map((f) => (
              <FeatureCard
                key={f.title}
                title={f.title}
                description={f.description}
                Icon={f.Icon}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
