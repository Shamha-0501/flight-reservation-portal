"use client";

import React, { useEffect, useMemo, useState } from "react";
import { isValidPhoneNumber } from "react-phone-number-input";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

import type { OrderPassengerPayload } from "@/src/api/routes/orders/create";
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
  initialPayload?: TravellerOrderPayload | null;
  initialDraft?: TravellerStepDraft | null;
  onDraftChange?: (draft: TravellerStepDraft) => void;
  onValidationChange?: (result: TravellerValidationResult) => void;
  showValidationErrors?: boolean;
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

export type TravellerOrderPassenger = OrderPassengerPayload;

export type TravellerOrderPayload = {
  passengers: TravellerOrderPassenger[];
  contact: {
    email: string;
    phone_number?: string;
  };
};

export type TravellerStepDraft = {
  openId: string | null;
  contactEmail: string;
  phoneNumber: string;
  travellerForms: Record<string, TravellerFormValue>;
};

export type TravellerValidationResult = {
  isValid: boolean;
  travellerErrors: Record<string, Partial<Record<keyof TravellerFormValue, string>>>;
  contactErrors: {
    email?: string;
    phone_number?: string;
  };
  globalErrors: string[];
};

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
  if (
    !form.loyalty_programme_number.trim() ||
    !form.loyalty_programme_airline.trim()
  ) {
    return [];
  }

  return [
    {
      account_number: form.loyalty_programme_number.trim(),
      airline_iata_code: form.loyalty_programme_airline.trim().toUpperCase(),
    },
  ];
}

function buildInitialTravellerFormState(
  travellers: Traveller[],
  initialPayload?: TravellerOrderPayload | null
) {
  const byPassengerId = new Map(
    (initialPayload?.passengers ?? []).map((passenger) => [passenger.id, passenger])
  );

  return travellers.reduce<Record<string, TravellerFormValue>>((acc, traveller) => {
    const passenger = byPassengerId.get(traveller.id);
    const loyaltyAccount = passenger?.loyalty_programme_accounts?.[0];

    acc[traveller.id] = {
      title: passenger?.title ?? "",
      given_name: passenger?.given_name ?? "",
      family_name: passenger?.family_name ?? "",
      gender: passenger?.gender ?? "",
      born_on: passenger?.born_on ?? "",
      nationality: "",
      passport_number: "",
      passport_expiry: "",
      issuing_country: "",
      loyalty_programme_airline: loyaltyAccount?.airline_iata_code ?? "",
      loyalty_programme_number: loyaltyAccount?.account_number ?? "",
    };

    return acc;
  }, {});
}

function buildTravellerFormsFromDraft(
  travellers: Traveller[],
  draft?: TravellerStepDraft | null
) {
  const draftForms = draft?.travellerForms ?? {};

  return travellers.reduce<Record<string, TravellerFormValue>>((acc, traveller) => {
    acc[traveller.id] = draftForms[traveller.id] ?? buildEmptyTravellerFormValue();
    return acc;
  }, {});
}

function buildEmptyTravellerFormValue(): TravellerFormValue {
  return {
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
}

function validateName(value: string) {
  return /^[A-Za-z][A-Za-z\s'-]*$/.test(value.trim());
}

function validateLoyaltyAirlineCode(value: string) {
  return /^[A-Za-z0-9]{2,3}$/.test(value.trim());
}

function getAgeOnDate(bornOn: string, referenceDate = new Date()) {
  const dateOfBirth = new Date(`${bornOn}T00:00:00`);

  if (Number.isNaN(dateOfBirth.getTime()) || Number.isNaN(referenceDate.getTime())) {
    return null;
  }

  let age = referenceDate.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = referenceDate.getMonth() - dateOfBirth.getMonth();
  const dayDiff = referenceDate.getDate() - dateOfBirth.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age;
}

export default function TravellerInfoStep({
  travellers,
  onPayloadChange,
  initialPayload,
  initialDraft,
  onDraftChange,
  onValidationChange,
  showValidationErrors = false,
}: TravellerInfoStepProps) {
  const [openId, setOpenId] = useState<string | null>(
    initialDraft?.openId ?? (travellers.length ? travellers[0].id : null)
  );
  const [contactEmail, setContactEmail] = useState(
    initialDraft?.contactEmail ?? initialPayload?.contact?.email ?? ""
  );
  const [phoneNumber, setPhoneNumber] = useState<string | undefined>(
    initialDraft?.phoneNumber ?? initialPayload?.contact?.phone_number ?? ""
  );
  const [travellerForms, setTravellerForms] = useState<Record<string, TravellerFormValue>>(
    () =>
      initialDraft
        ? buildTravellerFormsFromDraft(travellers, initialDraft)
        : buildInitialTravellerFormState(travellers, initialPayload)
  );

  useEffect(() => {
    setTravellerForms((prev) =>
      travellers.reduce<Record<string, TravellerFormValue>>((acc, traveller) => {
        acc[traveller.id] = prev[traveller.id] ?? buildEmptyTravellerFormValue();
        return acc;
      }, {})
    );
  }, [travellers]);

  const inputClass =
    "h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
  const labelClass = "mb-1.5 block text-sm font-medium text-slate-800";

  const validationResult = useMemo<TravellerValidationResult>(() => {
    const travellerErrors: TravellerValidationResult["travellerErrors"] = {};
    const globalErrors: string[] = [];
    const trimmedEmail = contactEmail.trim();
    const trimmedPhone = phoneNumber?.trim() ?? "";

    const contactErrors: TravellerValidationResult["contactErrors"] = {};

    if (!trimmedEmail) {
      contactErrors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      contactErrors.email = "Enter a valid email address.";
    }

    if (!trimmedPhone) {
      contactErrors.phone_number = "Phone number is required.";
    } else if (!isValidPhoneNumber(trimmedPhone)) {
      contactErrors.phone_number =
        "Enter a valid phone number in international format.";
    }

    const passengerIdentityKeys = new Set<string>();
    const adultCount = travellers.filter((traveller) => traveller.type === "ADULT").length;
    const infantCount = travellers.filter((traveller) => traveller.type === "INFANT").length;

    if (infantCount > adultCount) {
      globalErrors.push("Each infant must be accompanied by an adult.");
    }

    travellers.forEach((traveller) => {
      const form = travellerForms[traveller.id] ?? buildEmptyTravellerFormValue();
      const errors: Partial<Record<keyof TravellerFormValue, string>> = {};

      if (!form.title.trim()) {
        errors.title = "Title is required.";
      }

      if (!form.given_name.trim()) {
        errors.given_name = "First name is required.";
      } else if (!validateName(form.given_name)) {
        errors.given_name = "Use letters only for first name.";
      }

      if (!form.family_name.trim()) {
        errors.family_name = "Last name is required.";
      } else if (!validateName(form.family_name)) {
        errors.family_name = "Use letters only for last name.";
      }

      if (!form.gender.trim()) {
        errors.gender = "Gender is required.";
      }

      if (!form.born_on) {
        errors.born_on = "Date of birth is required.";
      } else {
        const age = getAgeOnDate(form.born_on);
        if (age === null || age < 0) {
          errors.born_on = "Enter a valid date of birth.";
        } else if (traveller.type === "ADULT" && age < 12) {
          errors.born_on = "Adult must be at least 12 years old.";
        } else if (traveller.type === "CHILD" && (age < 2 || age >= 12)) {
          errors.born_on = "Child must be between 2 and 11 years old.";
        } else if (traveller.type === "INFANT" && age >= 2) {
          errors.born_on = "Infant must be under 2 years old.";
        }
      }

      if (form.loyalty_programme_airline.trim() || form.loyalty_programme_number.trim()) {
        if (!form.loyalty_programme_airline.trim()) {
          errors.loyalty_programme_airline = "Airline code is required.";
        } else if (!validateLoyaltyAirlineCode(form.loyalty_programme_airline)) {
          errors.loyalty_programme_airline = "Use a valid 2-3 character airline code.";
        }

        if (!form.loyalty_programme_number.trim()) {
          errors.loyalty_programme_number = "Frequent flyer number is required.";
        } else if (form.loyalty_programme_number.trim().length < 4) {
          errors.loyalty_programme_number = "Frequent flyer number looks too short.";
        }
      }

      const identityKey = [
        mapTravellerType(traveller.type),
        form.given_name.trim().toLowerCase(),
        form.family_name.trim().toLowerCase(),
        form.born_on,
      ].join("|");

      if (
        form.given_name.trim() &&
        form.family_name.trim() &&
        form.born_on
      ) {
        if (passengerIdentityKeys.has(identityKey)) {
          globalErrors.push(
            `Duplicate passenger details detected for ${traveller.label}.`
          );
        } else {
          passengerIdentityKeys.add(identityKey);
        }
      }

      if (Object.keys(errors).length > 0) {
        travellerErrors[traveller.id] = errors;
      }
    });

    return {
      isValid:
        Object.keys(travellerErrors).length === 0 &&
        Object.keys(contactErrors).length === 0 &&
        globalErrors.length === 0,
      travellerErrors,
      contactErrors,
      globalErrors,
    };
  }, [contactEmail, phoneNumber, travellerForms, travellers]);

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
        const form =
          travellerForms[traveller.id] ?? buildEmptyTravellerFormValue();

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

  useEffect(() => {
    onDraftChange?.({
      openId,
      contactEmail,
      phoneNumber: phoneNumber ?? "",
      travellerForms,
    });
  }, [contactEmail, onDraftChange, openId, phoneNumber, travellerForms]);

  useEffect(() => {
    onValidationChange?.(validationResult);
  }, [onValidationChange, validationResult]);

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
        {showValidationErrors && validationResult.globalErrors.length > 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <ul className="space-y-1">
              {validationResult.globalErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {travellers.map((traveller) => (
          <TravellerFormCard
            key={traveller.id}
            traveller={traveller}
            value={travellerForms[traveller.id]}
            errors={validationResult.travellerErrors[traveller.id] ?? {}}
            showErrors={showValidationErrors}
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
              {showValidationErrors && validationResult.contactErrors.email ? (
                <p className="mt-1.5 text-xs font-medium text-rose-600">
                  {validationResult.contactErrors.email}
                </p>
              ) : null}
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
              {showValidationErrors && validationResult.contactErrors.phone_number ? (
                <p className="mt-1.5 text-xs font-medium text-rose-600">
                  {validationResult.contactErrors.phone_number}
                </p>
              ) : null}
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
