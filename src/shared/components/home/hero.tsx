import Image from "next/image";
import SearchFlightsBar from "./flight-search/SearchFlightsBar";

export default function HeroSection() {
  return (
    <section className="relative w-full">
      {/* HERO BACKGROUND */}
      <div className="relative min-h-[85vh] w-full overflow-visible">
        <Image
          src="/assets/images/hero/flight-hero.jpg"
          alt="Flight Hero Background"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />

        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/60" />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-6 pt-20 sm:pt-24">
          <h1 className="max-w-4xl text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight">
            Discover the World&apos;s{" "}
            <span className="text-blue-200">Best Flights</span>
          </h1>

          <p className="mt-4 max-w-2xl text-sm sm:text-base md:text-lg text-white/85">
            Search, compare, and book flights across South Asia with a fast and
            transparent reservation experience.
          </p>
        </div>
      </div>

       {/* SEARCH BAR – CENTERED */}
  <div className="absolute left-1/2 top-[68%] z-20 w-full -translate-x-1/2 -translate-y-1/2 px-6">
    <div className="mx-auto max-w-7xl">
      <SearchFlightsBar />
    </div>
  </div>
    </section>
  );
}
