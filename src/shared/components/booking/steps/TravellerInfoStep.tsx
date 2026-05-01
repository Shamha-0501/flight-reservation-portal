"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  onPayloadChange?: (payload: TravellerOrderPayload) => void;
};

export type TravellerFormValue = {
  title: string;
  given_name: string;
  family_name: string;
  gender: string;
  born_on: string;
  nationality: string;
  passport_number: string;
  passport_expiry: string;
  issuing_country: string;
  loyalty_programme_airline: string;
  loyalty_programme_number: string;
};

export type TravellerOrderPassenger = {
  id: string;
  type: "adult" | "child" | "infant_without_seat";
  title: string;
  given_name: string;
  family_name: string;
  born_on: string;
  gender: string;
  email?: string;
  phone_number?: string;
  loyalty_programme_accounts?: Array<{
    account_number: string;
    airline_iata_code: string;
  }>;
  infant_passenger_id?: string;
};

export type TravellerOrderPayload = {
  passengers: TravellerOrderPassenger[];
  contact: {
    email: string;
    phone_number?: string;
  };
};

export type CreateOrderRequestBody = {
  offer_id: string;
  passengers: TravellerOrderPassenger[];
};

export function buildCreateOrderRequestBody(
  offerId: string,
  payload: TravellerOrderPayload
): CreateOrderRequestBody {
  return {
    offer_id: offerId,
    passengers: payload.passengers,
  };
}

function mapTravellerType(travellerType: Traveller["type"]) {
  if (travellerType === "ADULT") return "adult";
  if (travellerType === "CHILD") return "child";
  return "infant_without_seat";
}

function getTravellerSequenceNumber(travellerId: string) {
  const match = travellerId.match(/-(\d+)$/);
  return match ? Number(match[1]) : 1;
}

function buildInfantPassengerLink(
  traveller: Traveller,
  adultTravellers: Traveller[]
) {
  if (traveller.type !== "INFANT" || adultTravellers.length === 0) {
    return undefined;
  }

  const infantNumber = getTravellerSequenceNumber(traveller.id);
  return adultTravellers[infantNumber - 1]?.id ?? adultTravellers[0]?.id;
}

function buildLoyaltyProgrammeAccounts(form: TravellerFormValue) {
  if (!form.loyalty_programme_number.trim()) {
    return [];
  }

  return [
    {
      account_number: form.loyalty_programme_number.trim(),
      airline_iata_code: form.loyalty_programme_airline.trim().toUpperCase(),
    },
  ];
}

function buildInitialTravellerFormState(travellers: Traveller[]) {
  return travellers.reduce<Record<string, TravellerFormValue>>((acc, traveller) => {
    acc[traveller.id] = {
      title: "",
      given_name: "",
      family_name: "",
      gender: "",
      born_on: "",
      nationality: "",
      passport_number: "",
      passport_expiry: "",
      issuing_country: "",
      loyalty_programme_airline: "",
      loyalty_programme_number: "",
    };

    return acc;
  }, {});
}

export default function TravellerInfoStep({
  travellers,
  onPayloadChange,
}: TravellerInfoStepProps) {
  const [openId, setOpenId] = useState<string | null>(
    travellers.length ? travellers[0].id : null
  );
  const [contactEmail, setContactEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState<string | undefined>("");
  const [travellerForms, setTravellerForms] = useState<Record<string, TravellerFormValue>>(
    () => buildInitialTravellerFormState(travellers)
  );

  const inputClass =
    "h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
  const labelClass = "mb-1.5 block text-sm font-medium text-slate-800";

  const toggleTraveller = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const updateTravellerForm = (
    travellerId: string,
    field: keyof TravellerFormValue,
    value: string
  ) => {
    setTravellerForms((prev) => ({
      ...prev,
      [travellerId]: {
        ...prev[travellerId],
        [field]: value,
      },
    }));
  };

  const orderPayload = useMemo<TravellerOrderPayload>(() => {
    const adultTravellers = travellers.filter(
      (traveller) => traveller.type === "ADULT"
    );

    return {
      passengers: travellers.map((traveller) => {
        const form = travellerForms[traveller.id];

        return {
          id: traveller.id,
          type: mapTravellerType(traveller.type),
          title: form.title.trim(),
          given_name: form.given_name.trim(),
          family_name: form.family_name.trim(),
          born_on: form.born_on,
          gender: form.gender.trim(),
          email: contactEmail.trim() || undefined,
          phone_number: phoneNumber || undefined,
          loyalty_programme_accounts: buildLoyaltyProgrammeAccounts(form),
          infant_passenger_id: buildInfantPassengerLink(
            traveller,
            adultTravellers
          ),
        };
      }),
      contact: {
        email: contactEmail.trim(),
        phone_number: phoneNumber || undefined,
      },
    };
  }, [contactEmail, phoneNumber, travellerForms, travellers]);

  useEffect(() => {
    onPayloadChange?.(orderPayload);
  }, [onPayloadChange, orderPayload]);

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
            value={travellerForms[traveller.id]}
            isOpen={openId === traveller.id}
            onToggle={() => toggleTraveller(traveller.id)}
            onChange={(field, value) =>
              updateTravellerForm(traveller.id, field, value)
            }
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
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
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
