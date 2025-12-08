"use client";

import { useEffect, useMemo, useState } from "react";
import { Testimonial, TESTIMONIALS } from "../../constants/testimonials";
import TestimonialCard from "../../ui/TestimonialCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

const VISIBLE = 3;
const CARD_WIDTH = 344; // 320 card + ~24 gap (gap-6)

export default function WhatTravelersSay() {
  const [slides, setSlides] = useState<Testimonial[]>([]);
  const [current, setCurrent] = useState(0);        // index on track (left-most visible)
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const items = TESTIMONIALS.slice(0, 9);
    setSlides(items);
  }, []);

  const { track, startIndex, total, trackLength } = useMemo(() => {
    const total = slides.length;
    if (!total) {
      return { track: [] as Testimonial[], startIndex: 0, total, trackLength: 0 };
    }

    // clone last 3 and first 3 for infinite loop
    const cloneHead = slides.slice(-VISIBLE);
    const cloneTail = slides.slice(0, VISIBLE);

    const track = [...cloneHead, ...slides, ...cloneTail];
    const startIndex = cloneHead.length; // first REAL slide
    const trackLength = track.length;

    return { track, startIndex, total, trackLength };
  }, [slides]);

  // initialize current when slides ready
  useEffect(() => {
    if (track.length && current === 0) {
      setCurrent(startIndex);
    }
  }, [track, startIndex, current]);

  if (!total) {
    return null;
  }

  const next = () => {
    if (!isAnimating) return;
    setCurrent((prev) => prev + 1);
  };

  const prev = () => {
    if (!isAnimating) return;
    setCurrent((prev) => prev - 1);
  };

  const handleTransitionEnd = () => {
    if (!trackLength) return;

    let newIndex = current;
    let needSnap = false;

    // if we've moved into the tail clones: snap back into real range
    if (current >= trackLength - VISIBLE) {
      newIndex = current - total;
      needSnap = true;
    }

    // if we've moved into the head clones: snap to equivalent real index at end
    if (current < VISIBLE) {
      newIndex = current + total;
      needSnap = true;
    }

    if (needSnap) {
      // disable animation, jump, then re-enable
      setIsAnimating(false);
      requestAnimationFrame(() => {
        setCurrent(newIndex);
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    }
  };

  // active dot based on real index
  const activeDot =
    ((current - VISIBLE) % total + total) % total;

  return (
    <div className="justify-items-center py-20 w-[90%] max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-800">What Travelers Say</h1>
      <p className="text-md font-extralight text-gray-500 mt-5 max-w-2xl text-center">
        Don't just take our word for it. Here's what our happy travelers say.
      </p>

      <div className="relative w-full mt-16">
        {/* LEFT BUTTON */}
        <button
          onClick={prev}
          className="absolute left-[-100px] top-[175px] border border-emerald-500 shadow-md rounded-full w-10 h-10 flex items-center justify-center z-20"
        >
          <ChevronLeft className="text-emerald-500" />
        </button>

        {/* RIGHT BUTTON */}
        <button
          onClick={next}
          className="absolute right-[-100px] top-[175px] border border-emerald-500 shadow-md rounded-full w-10 h-10 flex items-center justify-center z-20"
        >
          <ChevronRight className="text-emerald-500" />
        </button>

        {/* SLIDER VIEWPORT */}
        <div className="overflow-hidden w-full">
          <div
            className={`flex gap-6 ${isAnimating ? "transition-transform duration-500" : ""}`}
            style={{
              transform: `translateX(-${current * CARD_WIDTH}px)`,
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {track.map((t, i) => (
              <div key={i} className="w-[320px] shrink-0">
                <TestimonialCard
                  quote={t.quote}
                  fname={t.fname}
                  lname={t.lname}
                  image={t.image}
                  type={t.type}
                />
              </div>
            ))}
          </div>
        </div>

        {/* DOTS */}
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              onClick={() => {
                // jump to chosen real index
                setCurrent(startIndex + i);
              }}
              className={`h-2.5 w-2.5 rounded-full transition-all ${
                i === activeDot
                  ? "bg-emerald-500 scale-110"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
