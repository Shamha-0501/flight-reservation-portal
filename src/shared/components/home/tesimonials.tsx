"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import Container from "@/src/shared/ui/Container"; // <-- adjust path

interface Testimonial {
  name: string;
  role: string;
  company: string;
  rating: number;
  quote: string;
  location: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Nuwan Perera",
    role: "Travel Agent",
    company: "Colombo",
    rating: 5,
    quote:
      "The agent tools save a lot of time. Comparing fares and booking for multiple customers is much faster now.",
    location: "Sri Lanka",
  },
  {
    name: "Ayesha Rahman",
    role: "Frequent Traveler",
    company: "Kandy",
    rating: 5,
    quote:
      "Super smooth booking flow. I got my e-ticket instantly and the prices were better than I expected.",
    location: "Sri Lanka",
  },
  {
    name: "Imran Khan",
    role: "Agency Owner",
    company: "Dubai Desk",
    rating: 5,
    quote:
      "We handle many bookings daily. The workflow is agent-friendly and support responds quickly when needed.",
    location: "UAE",
  },
  {
    name: "Sarah Johnson",
    role: "Business Traveler",
    company: "London Office",
    rating: 5,
    quote:
      "Excellent service and competitive prices. The booking process is straightforward and customer support is top-notch.",
    location: "UK",
  },
  {
    name: "Ravi Kumar",
    role: "Family Traveler",
    company: "Mumbai",
    rating: 5,
    quote:
      "Booked flights for my entire family with ease. The interface is intuitive and the payment process is secure.",
    location: "India",
  },
  {
    name: "Emma Chen",
    role: "Corporate Travel Manager",
    company: "Singapore Hub",
    rating: 5,
    quote:
      "Managing corporate travel has never been easier. The reporting features and bulk booking options are fantastic.",
    location: "Singapore",
  },
];

export default function TestimonialsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardsPerView = 3;
  const totalPages = Math.ceil(testimonials.length / cardsPerView);

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % totalPages);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages);
  const goToSlide = (index: number) => setCurrentIndex(index);

  const visibleTestimonials = testimonials.slice(
    currentIndex * cardsPerView,
    currentIndex * cardsPerView + cardsPerView
  );

  return (
    <section className="w-full bg-gradient-to-br from-gray-50 to-blue-50 py-16">
      <Container size="container">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-3">
            What Our Customers Say
          </h2>
          <p className="text-gray-600 text-lg">
            Trusted by travelers and agents worldwide
          </p>
        </div>

        <div className="relative">
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white hover:bg-blue-600 text-gray-700 hover:text-white rounded-full p-3 shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Previous testimonials"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-8">
            {visibleTestimonials.map((testimonial, index) => (
              <div key={`${testimonial.name}-${index}`} className="flex flex-col">
                {/* CARD */}
                <div className="bg-white rounded-2xl shadow-xl p-8 relative flex-1 flex flex-col">
                  {/* nicer quote marks */}
                  <div className="absolute top-6 left-6 text-gray-200 text-6xl leading-none font-serif select-none">
                    “
                  </div>
                  <div className="absolute bottom-6 right-6 text-gray-200 text-6xl leading-none font-serif select-none">
                    ”
                  </div>

                  {/* quote */}
                  <div className="relative z-10 flex-1 flex items-center">
                    <p className="text-gray-700 text-base leading-relaxed italic">
                      {testimonial.quote}
                    </p>
                  </div>

                  {/* avatar (keep your style) */}
                  <div className="mt-7 flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-lg ring-4 ring-white">
                      {testimonial.name.charAt(0)}
                    </div>
                  </div>

                  {/* ✅ moved INSIDE card */}
                  <div className="mt-4 text-center">
                    <div className="flex justify-center mb-2">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-5 h-5 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>

                    <h3 className="text-lg font-bold text-gray-800">
                      {testimonial.name}
                    </h3>
                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      {testimonial.company} • {testimonial.location}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white hover:bg-blue-600 text-gray-700 hover:text-white rounded-full p-3 shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Next testimonials"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        <div className="flex justify-center mt-12 gap-2">
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-1 rounded-full transition-all duration-300 focus:outline-none ${
                index === currentIndex
                  ? "w-8 bg-blue-600"
                  : "w-6 bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
