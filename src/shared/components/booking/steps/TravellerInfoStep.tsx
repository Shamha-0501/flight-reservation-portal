"use client";

import React, { useState } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

import TravellerFormCard from "./components/TravellerFormCard";

type Traveller = {
  id: string;
  type: "ADULT" | "CHILD" | "INFANT";
  label: string;
  note?: string;
};

type TravellerInfoStepProps = {
  travellers: Traveller[];
};

export default function TravellerInfoStep({
  travellers,
}: TravellerInfoStepProps) {
  const [openId, setOpenId] = useState<string | null>(
    travellers.length ? travellers[0].id : null
  );
  const [phoneNumber, setPhoneNumber] = useState<string | undefined>("");

  const inputClass =
    "h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
  const labelClass = "mb-1.5 block text-sm font-medium text-slate-800";

  const toggleTraveller = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400" />
        <div className="p-5 sm:p-6">
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
            Traveller details
          </div>
          <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950 sm:text-[2rem]">
            Traveller information
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Enter each traveller’s details exactly as shown on the passport or
            government-issued ID.
          </p>
        </div>
      </section>

      <div className="space-y-4">
        {travellers.map((traveller) => (
          <TravellerFormCard
            key={traveller.id}
            traveller={traveller}
            isOpen={openId === traveller.id}
            onToggle={() => toggleTraveller(traveller.id)}
          />
        ))}
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
            Booking contact
          </div>
          <h3 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950">
            Contact information
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Your e-ticket, booking confirmation and travel updates will be sent
            to these details.
          </p>
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Email</label>
              <input
                className={inputClass}
                placeholder="you@example.com"
                type="email"
              />
            </div>

            <div>
              <label className={labelClass}>Phone Number</label>
              <PhoneInput
                placeholder="Enter phone number"
                defaultCountry="LK"
                international
                value={phoneNumber}
                onChange={setPhoneNumber}
                className="flex h-11 items-center rounded-xl border border-slate-300 bg-white px-3 transition-all duration-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100"
                numberInputProps={{
                  className:
                    "flex-1 bg-transparent px-2 text-sm text-slate-900 outline-none placeholder:text-slate-400",
                }}
                countrySelectProps={{
                  className:
                    "cursor-pointer bg-transparent text-sm text-slate-700 outline-none",
                }}
              />
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Make sure your email address and phone number are active so you can
            receive ticketing and travel notifications without delay.
          </div>
        </div>
      </section>
    </div>
  );
}
