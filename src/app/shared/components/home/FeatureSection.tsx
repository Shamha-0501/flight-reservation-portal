import Container from "@/src/app/shared/ui/Container";
import FeatureCard from "./FeatureCard";
import { BadgeCheck, ShieldCheck, Headphones } from "lucide-react";

export default function FeaturesSection() {
  const features = [
    {
      title: "Best Price Options",
      description: "Compare multiple airlines in one place and pick the best fare.",
      icon: <BadgeCheck className="h-5 w-5 text-blue-600 dark:text-blue-300" />,
    },
    {
      title: "Secure Booking",
      description: "Your booking data is handled safely with modern security practices.",
      icon: <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-300" />,
    },
    {
      title: "Agent-Friendly Workflow",
      description: "Fast booking tools designed for travel agencies and frequent bookings.",
      icon: <Headphones className="h-5 w-5 text-blue-600 dark:text-blue-300" />,
    },
  ];

  return (
    <section className="py-14">
      <Container>
        <div className="px-6">
          {/* Title */}
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Why Choose FlightPortal?
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">
              A simple, transparent way to search and book flights across South Asia.
            </p>
          </div>

          {/* Grid */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f) => (
              <FeatureCard
                key={f.title}
                icon={f.icon}
                title={f.title}
                description={f.description}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
