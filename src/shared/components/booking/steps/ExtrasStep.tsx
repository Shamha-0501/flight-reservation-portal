"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import ExtrasIntroCard from "./components/ExtrasIntroCard";
import FlightExtrasSection from "./components/FlightExtrasSection";
import PolicyOptionsSection from "./components/PolicyOptionsSection";
import AddonsSection from "./components/AddonsSection";
import type { OrderAddonPayload } from "@/src/api/routes/orders/create";
import {
  buildBookingAddonSnapshots,
  mapAgencyAddonsToBookingItems,
  type AgencyAddonRecord,
  type BookingAddonSnapshot,
} from "@/src/shared/lib/agencyAddons";
import type {
  DuffelSeatMapResponse,
  SeatServiceSelection,
} from "@/src/shared/lib/seatMaps";
import {
  buildAgencyAddonPayload,
  mapTenantSettingsToPolicies,
  type TenantAddonSettings,
} from "../../../lib/tenantAddonSettings";

export type BaggageOption = {
  id: string;
  label: string;
  price: string;
  description?: string;
  amount?: number;
  currency?: string;
};

export type TravellerBaggage = {
  travellerId: string;
  travellerLabel: string;
  includedLabel: string;
  options: BaggageOption[];
};

export type SeatSelectionSummary = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  available?: boolean;
};

export type PolicyUpgrade = {
  id: string;
  label: string;
  description?: string;
  price: string;
  priceAmount?: number;
  recommended?: boolean;
};

export type PolicyGroup = {
  id: string;
  title: string;
  includedLabel: string;
  includedValue: string;
  upgrades: PolicyUpgrade[];
};

export type AddonItem = {
  id: string;
  code?: string;
  title: string;
  description: string;
  price: string;
  priceAmount?: number;
  tag?: string;
  addonId?: number;
  currency?: string;
  isEnabled?: boolean;
  finalName?: string;
  finalDescription?: string;
};

export type ExtrasOrderSelection = {
  selectedBaggageByTraveller: Record<string, string>;
  selectedPolicyByGroup: Record<string, string | null>;
  selectedAddonIds: string[];
  bookingAddons: BookingAddonSnapshot[];
  seatServices: SeatServiceSelection[];
  seatServicesAmount: number;
  seatServicesCount: number;
  seatCurrency: string;
  addons: OrderAddonPayload;
  agencyAddonsAmount: number;
  duffelAddonsAmount: number;
  totalAddonsAmount: number;
  currency: string;
};

type ExtrasStepProps = {
  travellers: Array<{
    id: string;
    label: string;
    type: "ADULT" | "CHILD" | "INFANT";
    note?: string;
  }>;
  baggageSelections: TravellerBaggage[];
  seatSelection: SeatSelectionSummary;
  seatMaps?: DuffelSeatMapResponse | null;
  seatMapStatus?: string;
  seatMapLoading?: boolean;
  seatMapError?: string | null;
  tenantAddonSettings?: TenantAddonSettings | null;
  bookingAddons?: AgencyAddonRecord[] | null;
  policies?: PolicyGroup[];
  addons?: AddonItem[];
  initialSelection?: ExtrasOrderSelection | null;
  onSelectionChange?: (selection: ExtrasOrderSelection) => void;
};

export default function ExtrasStep({
  travellers,
  baggageSelections,
  seatSelection,
  seatMaps,
  seatMapStatus,
  seatMapLoading,
  seatMapError,
  tenantAddonSettings,
  bookingAddons,
  policies: fallbackPolicies = [],
  addons: fallbackAddons = [],
  initialSelection,
  onSelectionChange,
}: ExtrasStepProps) {
  const policies = useMemo(
    () =>
      tenantAddonSettings
        ? mapTenantSettingsToPolicies(tenantAddonSettings)
        : fallbackPolicies,
    [tenantAddonSettings, fallbackPolicies]
  );

  const addons = useMemo(
    () => {
      if (bookingAddons?.length) {
        return mapAgencyAddonsToBookingItems(bookingAddons);
      }

      return fallbackAddons;
    },
    [bookingAddons, fallbackAddons]
  );
  const hasBookingAddons = Boolean(bookingAddons?.length);

  const [selectedBaggageByTraveller, setSelectedBaggageByTraveller] = useState<
    Record<string, string>
  >(() =>
    baggageSelections.reduce<Record<string, string>>((acc, traveller) => {
      const initialOptionId =
        initialSelection?.selectedBaggageByTraveller?.[traveller.travellerId];
      const hasInitialOption = traveller.options.some(
        (option) => option.id === initialOptionId
      );

      acc[traveller.travellerId] = traveller.options[0]?.id ?? "";
      if (hasInitialOption && initialOptionId) {
        acc[traveller.travellerId] = initialOptionId;
      }

      return acc;
    }, {})
  );

  const [selectedPolicyByGroup, setSelectedPolicyByGroup] = useState<
    Record<string, string | null>
  >(initialSelection?.selectedPolicyByGroup ?? {});

  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>(
    initialSelection?.selectedAddonIds ?? []
  );

  const [selectedSeatServices, setSelectedSeatServices] = useState<
    SeatServiceSelection[]
  >(initialSelection?.seatServices ?? []);
  const hydratedSelectionKeyRef = useRef<string | null>(null);
  const lastEmittedSelectionRef = useRef<string | null>(null);

  useEffect(() => {
    const travellerKey = baggageSelections
      .map((traveller) => traveller.travellerId)
      .join("|");
    const hydrationKey = `${travellerKey}:${initialSelection ? "provided" : "empty"}`;

    if (!travellerKey && !initialSelection) return;
    if (hydratedSelectionKeyRef.current === hydrationKey) return;

    hydratedSelectionKeyRef.current = hydrationKey;

    setSelectedBaggageByTraveller(
      baggageSelections.reduce<Record<string, string>>((acc, traveller) => {
        const initialOptionId =
          initialSelection?.selectedBaggageByTraveller?.[traveller.travellerId];
        const hasInitialOption = traveller.options.some(
          (option) => option.id === initialOptionId
        );

        acc[traveller.travellerId] = traveller.options[0]?.id ?? "";
        if (hasInitialOption && initialOptionId) {
          acc[traveller.travellerId] = initialOptionId;
        }

        return acc;
      }, {})
    );
    setSelectedPolicyByGroup(initialSelection?.selectedPolicyByGroup ?? {});
    setSelectedAddonIds(initialSelection?.selectedAddonIds ?? []);
    setSelectedSeatServices(initialSelection?.seatServices ?? []);
  }, [baggageSelections, initialSelection]);

  const toggleAddon = (id: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const currency =
    bookingAddons?.[0]?.currency ||
    tenantAddonSettings?.currency ||
    "USD";

  const selectedPolicyIds = useMemo(
    () =>
      Object.values(selectedPolicyByGroup).filter(
        (policyId): policyId is string => Boolean(policyId)
      ),
    [selectedPolicyByGroup]
  );

  const duffelBaggageSummary = useMemo(() => {
    return baggageSelections.reduce(
      (summary, traveller) => {
        const selectedOptionId =
          selectedBaggageByTraveller[traveller.travellerId];
        const selectedOption = traveller.options.find(
          (option) => option.id === selectedOptionId
        );
        const amount = selectedOption?.amount ?? 0;

        if (amount > 0) {
          summary.count += 1;
          summary.amount += amount;
        }

        return summary;
      },
      { count: 0, amount: 0 }
    );
  }, [baggageSelections, selectedBaggageByTraveller]);

  const agencyAddonSummary = useMemo(
    () =>
      tenantAddonSettings
        ? buildAgencyAddonPayload(
            tenantAddonSettings,
            selectedPolicyIds,
            selectedAddonIds
          )
        : { payload: {}, amount: 0 },
    [tenantAddonSettings, selectedPolicyIds, selectedAddonIds]
  );

  const bookingAddonSnapshots = useMemo(
    () => buildBookingAddonSnapshots(bookingAddons ?? [], selectedAddonIds),
    [bookingAddons, selectedAddonIds]
  );

  const bookingAddonAmount = useMemo(
    () => roundMoney(bookingAddonSnapshots.reduce((total, addon) => total + addon.price, 0)),
    [bookingAddonSnapshots]
  );

  const seatServiceAmount = useMemo(
    () => roundMoney(selectedSeatServices.reduce((total, seat) => total + seat.amount, 0)),
    [selectedSeatServices]
  );

  const orderAddons = useMemo<OrderAddonPayload>(() => {
    const duffelAddonsAmount = roundMoney(duffelBaggageSummary.amount);
    const totalDuffelAmount = roundMoney(duffelAddonsAmount + seatServiceAmount);
    const agencyAddonsAmount = hasBookingAddons
      ? bookingAddonAmount
      : roundMoney(agencyAddonSummary.amount);

    return {
      duffel_baggage_enabled: duffelBaggageSummary.count > 0,
      duffel_baggage_count: duffelBaggageSummary.count,
      duffel_baggage_amount: duffelAddonsAmount,
      duffel_baggage_currency: currency,

      duffel_seat_enabled: selectedSeatServices.length > 0,
      duffel_seat_count: selectedSeatServices.length,
      duffel_seat_amount: seatServiceAmount,
      duffel_seat_currency: currency,

      ...agencyAddonSummary.payload,

      agency_addons_amount: agencyAddonsAmount,
      duffel_addons_amount: totalDuffelAmount,
      total_addons_amount: roundMoney(agencyAddonsAmount + totalDuffelAmount),
      currency,
    };
  }, [
    agencyAddonSummary,
    bookingAddonAmount,
    currency,
    duffelBaggageSummary,
    hasBookingAddons,
    seatServiceAmount,
    selectedSeatServices.length,
  ]);

  useEffect(() => {
    const nextSelection: ExtrasOrderSelection = {
      selectedBaggageByTraveller,
      selectedPolicyByGroup,
      selectedAddonIds,
      bookingAddons: bookingAddonSnapshots,
      seatServices: selectedSeatServices,
      seatServicesAmount: seatServiceAmount,
      seatServicesCount: selectedSeatServices.length,
      seatCurrency: currency,
      addons: orderAddons,
      agencyAddonsAmount: orderAddons.agency_addons_amount ?? 0,
      duffelAddonsAmount: orderAddons.duffel_addons_amount ?? 0,
      totalAddonsAmount: orderAddons.total_addons_amount ?? 0,
      currency,
    };

    const signature = JSON.stringify(nextSelection);
    if (lastEmittedSelectionRef.current === signature) return;

    lastEmittedSelectionRef.current = signature;
    onSelectionChange?.(nextSelection);
  }, [
    currency,
    onSelectionChange,
    orderAddons,
    selectedAddonIds,
    selectedBaggageByTraveller,
    selectedPolicyByGroup,
    bookingAddonSnapshots,
    selectedSeatServices,
    seatServiceAmount,
  ]);

  return (
    <div className="space-y-5">
      <ExtrasIntroCard
        title="Customize your trip"
        description="Choose flight extras, flexibility options and platform services before review."
      />

      <FlightExtrasSection
        travellers={travellers}
        baggageSelections={baggageSelections}
        selectedBaggageByTraveller={selectedBaggageByTraveller}
        onBaggageSelect={(travellerId, optionId) => {
          setSelectedBaggageByTraveller((prev) => ({
            ...prev,
            [travellerId]: optionId,
          }));
        }}
        seatSelection={seatSelection}
        seatMaps={seatMaps}
        seatMapStatus={seatMapStatus}
        seatMapLoading={seatMapLoading}
        seatMapError={seatMapError}
        selectedSeatServices={selectedSeatServices}
        onSeatServicesChange={setSelectedSeatServices}
      />

      <PolicyOptionsSection
        policies={policies}
        selectedPolicyByGroup={selectedPolicyByGroup}
        onPolicySelect={(groupId, optionId) => {
          setSelectedPolicyByGroup((prev) => ({
            ...prev,
            [groupId]: prev[groupId] === optionId ? null : optionId,
          }));
        }}
      />

      <AddonsSection
        addons={addons}
        selectedAddonIds={selectedAddonIds}
        onAddonToggle={toggleAddon}
      />
    </div>
  );
}

function roundMoney(amount: number) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
