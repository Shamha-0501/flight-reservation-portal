"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import TourCard from "../../ui/TourCard";
import { useEffect, useState } from "react";
import { Destination, DESTINATIONS } from "../../constants/destinations";

export default function TrendingDestinations() {
  const [trendings, setTrendings] = useState<Destination[]>([]);

  useEffect(() => {
    setTrendings(DESTINATIONS.slice(0, 3));
  }, []);

  return (
    <div className="py-20 w-[90%] max-w-5xl">
      <h1 className="text-4xl text-gray-800 font-bold">
        Trending Destinations
      </h1>
      <div className="flex justify-between items-center">
        <p className="text-md text-gray-500 font-extralight pt-4">
          Explore our most popular tour packages loved by travelers worldwide.
        </p>
        <div className="flex items-center gap-1">
          <Link href={""} className="text-emerald-500 text-md font-bold">
            View All Tours
          </Link>
          <ArrowRight className="text-emerald-500" />
        </div>
      </div>
      <div className="flex justify-between mt-14">
        {trendings.map((trending, idx) => (
          <TourCard
            key={idx}
            path={trending.path}
            country={trending.country}
            duration={trending.duration}
            title={trending.title}
            description={trending.description}
            price={trending.price}
            rating={trending.rating}
          />
        ))}
      </div>
    </div>
  );
}
