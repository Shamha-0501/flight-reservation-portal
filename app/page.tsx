import ChooseYourPerfectJourney from "@/src/app/shared/components/home/choose";
import FeatureSection from "@/src/app/shared/components/home/FeatureSection";
import Hero from "@/src/app/shared/components/home/hero";
import HowItWorks from "@/src/app/shared/components/home/how";
import GetAFreeQuote from "@/src/app/shared/components/home/quote";
import WhatTravelersSay from "@/src/app/shared/components/home/tesimonials";
import TrendingDestinations from "@/src/app/shared/components/home/trending";
import Why from "@/src/app/shared/components/home/why";
import Container from "@/src/app/shared/ui/Container";

export default function Home() {
  return (
    <Container
      className="min-h-screen items-center justify-items-center bg-white dark:bg-gray-800"
      noPadding
    >
      <Hero />
      <FeatureSection />
      <HowItWorks />
      <TrendingDestinations />
      <Why />
      <WhatTravelersSay />
      <ChooseYourPerfectJourney />
      <GetAFreeQuote />
    </Container>
  );
}
