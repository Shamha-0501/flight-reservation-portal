import { Check, CheckCheckIcon, CheckCircle, CheckIcon, CopyCheck, Send, SendHorizonal } from "lucide-react";
import Image from "next/image";
import React from "react";

export default function Quote() {
  return (
    <div className="w-full rounded-4xl bg-gray-100 flex">
      <div className="w-1/2 items-center text-black">
        <div className="relative w-full h-full overflow-hidden  rounded-l-4xl">
          <Image
            src="/assets/images/forms/f1.png"
            alt="Plan your own trip"
            fill
            className="object-cover"
          />
          <div className="absolute w-full h-full bg-blue-500/50" />
          <div className="absolute p-14 text-white h-full flex flex-col justify-center">
            <h1 className="text-4xl font-bold">Ready for your next adventure?</h1>
            <p className="text-lg mt-5">
              Fill out the form and our travel experts will get back to you with
              a personalized itinerary and quote within 24 hours.
            </p>
            <ul className="mt-5">
              <li className="flex items-center gap-2 mt-1"><Check /> Free consultation</li>
              <li className="flex items-center gap-2 mt-1"><Check /> Custom itinerary design</li>
              <li className="flex items-center gap-2 mt-1"><Check /> No hidden fees</li>
            </ul>
          </div>
        </div>
      </div>
      <form action="" className="w-1/2 text-black placeholder-gray-300/50 p-8">
        <label htmlFor="" className="text-black">
          Get a Free Quote
        </label>
        <div className="flex gap-3 mt-3">
          <div className="flex-1">
            <label htmlFor="fullname" className="text-sm">
              Full Name
            </label>
            <input
              type="text"
              id="fullname"
              placeholder="John Doe"
              className="border border-gray-400/40 ps-2 py-1 mt-1 rounded-lg h-10 w-full"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="email" className="text-sm">
              Email Address
            </label>
            <input
              type="text"
              id="email"
              placeholder="john@example.com"
              className="border border-gray-400/40 ps-2 py-1 mt-1 rounded-lg h-10 w-full"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-3">
          <div className="flex-1">
            <label htmlFor="destination" className="text-sm">
              Destination
            </label>
            <input
              type="text"
              id="destination"
              placeholder="e.g. Japan, Italy"
              className="border border-gray-400/40 ps-2 py-1 mt-1 rounded-lg h-10 w-full"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="contact" className="text-sm">
              Contact
            </label>
            <input
              type="text"
              id="contact"
              placeholder="+94777777777"
              className="border border-gray-400/40 ps-2 py-1 mt-1 rounded-lg h-10 w-full"
            />
          </div>
        </div>
        <div className="mt-3">
          <label htmlFor="details">Additional Details</label>
          <textarea
            placeholder="Tell us about your preferences, dates, or specific requirements..."
            rows={5}
            className="border border-gray-400/40 w-full mt-1 px-3 py-1 rounded-lg"
          ></textarea>
        </div>
        <button
          type="submit"
          className="flex justify-center items-center gap-2 w-full mt-3 bg-neutral-900 p-3 text-lg font-semibold text-gray-100 rounded-lg"
        >
          Send Request <SendHorizonal size={20} />
        </button>
      </form>
    </div>
  );
}
