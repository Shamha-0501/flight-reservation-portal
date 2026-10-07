import AgentSection from "@/src/shared/components/home/AgentSection";
import FeatureSection from "@/src/shared/components/home/FeatureSection";
import Hero from "@/src/shared/components/home/hero";
import HowItWorks from "@/src/shared/components/home/how";
import WhatTravelersSay from "@/src/shared/components/home/tesimonials";
import Footer from "@/src/shared/components/home/Footer";


export default function Home() {
  return (
    <main className="min-h-screen items-center justify-items-center bg-white dark:bg-gray-800">
      <Hero />
      <FeatureSection />
      <HowItWorks />
      <AgentSection />
      {/* <TrendingDestinations /> */}
      {/* <Why /> */}
      <WhatTravelersSay />
      {/* <ChooseYourPerfectJourney />
      <GetAFreeQuote /> */}
      <Footer />
    </main>
  );
}
