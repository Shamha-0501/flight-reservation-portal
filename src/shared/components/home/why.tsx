"use client";
import { Award, Heart, Shield, Users } from "lucide-react";
import { useCountUp } from "../../hooks/useCountUp";
import { useEffect, useRef, useState } from "react";

export default function Why() {
  const statsRef = useRef<HTMLDivElement | null>(null);
  const [startCount, setStartCount] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStartCount(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const travelers = useCountUp(10, 2000, startCount);
  const destinations = useCountUp(50, 2000, startCount);
  const years = useCountUp(15, 2000, startCount);
  const awards = useCountUp(20, 2000, startCount);

  return (
    <div className="bg-neutral-900 w-full h-full justify-items-center">
      <div className="w-[90%] max-w-5xl flex py-16 gap-5">
        <div className="pointer-events-none absolute translate-x-120 translate-y-40">
          <div className="h-40 w-40 rounded-full bg-emerald-400/10 blur-xl" />
        </div>
        <div className="pointer-events-none absolute translate-x-220 translate-y-80 z-20">
          <div className="h-40 w-40 rounded-full bg-blue-400/10 blur-xl" />
        </div>
        <div className="text-gray-100 pt-10 w-1/2">
          <h1 className="text-4xl font-bold">
            Why Choose <span className="text-emerald-500">GlobalTours</span>?
          </h1>
          <p className="text-lg text-gray-500 pt-5">
            We don't just sell tours; we craft experiences. With over 15 years
            of excellence in the tourism industry, we've helped thousands of
            travelers discover the world in ways they never imagined.
          </p>
          <div className="grid grid-cols-2">
            <div className="mt-5 max-w-[200px]">
              <Shield size={35} className="text-blue-500 mb-3" />
              <h2 className="text-lg font-bold text-gray-100 mb-3">
                Safe & Secure
              </h2>
              <p className="text-sm font-light text-gray-500 mb-3">
                Your safety is our priority. We partner with certified guides
                and secure accommodations.
              </p>
            </div>
            <div className="mt-5 max-w-[200px]">
              <Users size={35} className="text-blue-500 mb-3" />
              <h2 className="text-lg font-bold text-gray-100 mb-3">
                Expert Guides
              </h2>
              <p className="text-sm font-light text-gray-500 mb-3">
                Travel with locals who know the history, culture, and hidden
                gems of every destination.
              </p>
            </div>
            <div className="mt-5 max-w-[200px]">
              <Heart size={35} className="text-blue-500 mb-3" />
              <h2 className="text-lg font-bold text-gray-100 mb-3">
                Personalized Care
              </h2>
              <p className="text-sm font-light text-gray-500 mb-3">
                24/7 support and itineraries tailored to your preferences and
                pace.
              </p>
            </div>
            <div className="mt-5 max-w-[200px]">
              <Award size={35} className="text-blue-500 mb-3" />
              <h2 className="text-lg font-bold text-gray-100 mb-3">
                Best Price Guarantee
              </h2>
              <p className="text-sm font-light text-gray-500 mb-3">
                We offer competitive prices without compromising on quality or
                experience.
              </p>
            </div>
          </div>
        </div>
        <div className="relative flex items-center gap-6">
          <div className="relative w-50 h-60 rounded-3xl overflow-hidden mt-30">
            <img
              src="/assets/images/destinations/td1.png"
              className="w-full h-full object-cover"
              alt=""
            />
          </div>
          <div className="relative w-50 h-60 rounded-3xl overflow-hidden">
            <img
              src="/assets/images/destinations/td3.png"
              className="w-full h-full object-cover relative z-10"
              alt=""
            />
          </div>
        </div>
      </div>
      <div ref={statsRef} className="bg-emerald-500 w-full py-16 justify-items-center">
        <div className="w-[90%] max-w-5xl flex justify-between text-gray-100">
          <div className="justify-items-center">
            <h1 className="text-5xl font-bold">{travelers}k+</h1>
            <p className="text-lg font-semibold mt-2">Happy Travelers</p>
          </div>
          <div className="justify-items-center">
            <h1 className="text-5xl font-bold">{destinations}+</h1>
            <p className="text-lg font-semibold mt-2">Destinations</p>
          </div>
          <div className="justify-items-center">
            <h1 className="text-5xl font-bold">{years}+</h1>
            <p className="text-lg font-semibold mt-2">Years Experience</p>
          </div>
          <div className="justify-items-center">
            <h1 className="text-5xl font-bold">{awards}+</h1>
            <p className="text-lg font-semibold mt-2">Awards Won</p>
          </div>
        </div>
      </div>
    </div>
  );
}
