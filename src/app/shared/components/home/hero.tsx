import Image from "next/image";
import { MapIcon, Calendar, Compass } from "lucide-react";

export default function HeroTest() {
  return (
    <section className="relative w-full h-[85vh]">
      {/* Background image */}
      <Image
        src="/assets/images/hero/hero.jpg"
        alt="Hero Background"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      {/* Dark overlay (small fix: bg-gradient-to-b) */}
      <div className="absolute inset-0 bg-linear-to-b from-black/30 via-black/20 to-black/30" />

      {/* Center content – use full height + bottom padding to make room for glass bar */}
      <div className="relative z-10 flex h-[75vh] flex-col items-center justify-center px-4 pb-32 text-center">
        <h1 className="max-w-4xl text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight">
          Discover the World&apos;s{" "}
          <span className="text-emerald-400">Hidden Gems</span>
        </h1>

        <p className="mt-4 max-w-2xl text-sm sm:text-base md:text-lg text-gray-100/90">
          Plan your perfect getaway with our expert guides. From mountain treks
          to island retreats, we make your dream vacation a reality.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 pb-8">
          <button className="cursor-pointer rounded-full bg-emerald-400 px-7 py-3 text-sm sm:text-base font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400">
            Explore Tours
          </button>
          <button className="cursor-pointer rounded-full bg-white px-7 py-3 text-sm sm:text-base font-semibold text-gray-900 shadow-lg transition hover:bg-gray-100">
            Plan Your Trip
          </button>
        </div>
      </div>

      {/* Glass feature bar – moved further UP inside the hero */}
      <div className="absolute left-1/2 top-4/5 -translate-y-1/2 z-20 w-[90%] max-w-5xl -translate-x-1/2 rounded-3xl bg-white/15 border border-white/30 backdrop-blur-xl px-6 py-6 shadow-xl">
        <div className="grid gap-6 sm:grid-cols-3">
          {/* Feature 1 */}
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-15 w-15 items-center justify-center rounded-full bg-blue-400/50">
              <span className="text-xl">
                <MapIcon size={32} />
              </span>
            </div>
            <div>
              <h3 className="text-sm md:text-xl font-semibold text-white">
                Expert Planning
              </h3>
              <p className="mt-1 text-xs md:text-base text-gray-100/80">
                Custom itineraries tailored to you.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-15 w-15 items-center justify-center rounded-full bg-emerald-400/50">
              <span className="text-xl">
                <Compass size={32} />
              </span>
            </div>
            <div>
              <h3 className="text-sm md:text-xl font-semibold text-white">
                Local Guides
              </h3>
              <p className="mt-1 text-xs md:text-base text-gray-100/80">
                Authentic experiences everywhere.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-15 w-15 items-center justify-center rounded-full bg-violet-400/50">
              <span className="text-xl">
                <Calendar size={32} />
              </span>
            </div>
            <div>
              <h3 className="text-sm md:text-xl font-semibold text-white">
                Flexible Booking
              </h3>
              <p className="mt-1 text-xs md:text-base text-gray-100/80">
                Easy changes and cancellations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
