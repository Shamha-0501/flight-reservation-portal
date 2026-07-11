import AgentSection from "@/src/shared/components/home/AgentSection";
import ChooseYourPerfectJourney from "@/src/shared/components/home/choose";
import FeatureSection from "@/src/shared/components/home/FeatureSection";
import Hero from "@/src/shared/components/home/hero";
import HowItWorks from "@/src/shared/components/home/how";
import PopularRoutesSection from "@/src/shared/components/home/popularRoutes";
import GetAFreeQuote from "@/src/shared/components/home/quote";
import WhatTravelersSay from "@/src/shared/components/home/tesimonials";
import TrendingDestinations from "@/src/shared/components/home/trending";
import Why from "@/src/shared/components/home/why";
import Container from "@/src/shared/ui/Container";


export default function Home() {
  return (
    <main className="min-h-screen items-center justify-items-center bg-white dark:bg-gray-800">
      <Hero />
      <FeatureSection />
      <PopularRoutesSection />
      <HowItWorks />
      <AgentSection />
      {/* <TrendingDestinations /> */}
      {/* <Why /> */}
      <WhatTravelersSay />
      {/* <ChooseYourPerfectJourney />
      <GetAFreeQuote /> */}
    </main>
  );
}
