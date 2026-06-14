"use client";

import React, { useEffect, useMemo, useState } from "react";
import ExtrasIntroCard from "./components/ExtrasIntroCard";
import FlightExtrasSection from "./components/FlightExtrasSection";
import PolicyOptionsSection from "./components/PolicyOptionsSection";
import AddonsSection from "./components/AddonsSection";
import type { OrderAddonPayload } from "@/src/api/routes/orders/create";
import {
  buildAgencyAddonPayload,
  mapTenantSettingsToAddons,
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
  title: string;
  description: string;
  price: string;
  priceAmount?: number;
  tag?: string;
};

export type ExtrasOrderSelection = {
  selectedBaggageByTraveller: Record<string, string>;
  selectedPolicyByGroup: Record<string, string | null>;
  selectedAddonIds: string[];
  addons: OrderAddonPayload;
  agencyAddonsAmount: number;
  duffelAddonsAmount: number;
  totalAddonsAmount: number;
  currency: string;
};

type ExtrasStepProps = {
  baggageSelections: TravellerBaggage[];
  seatSelection: SeatSelectionSummary;
  tenantAddonSettings?: TenantAddonSettings | null;
  policies?: PolicyGroup[];
  addons?: AddonItem[];
  initialSelection?: ExtrasOrderSelection | null;
  onSelectionChange?: (selection: ExtrasOrderSelection) => void;
};

export default function ExtrasStep({
  baggageSelections,
  seatSelection,
  tenantAddonSettings,
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
    () =>
      tenantAddonSettings
        ? mapTenantSettingsToAddons(tenantAddonSettings)
        : fallbackAddons,
    [tenantAddonSettings, fallbackAddons]
  );

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

  const toggleAddon = (id: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const currency = tenantAddonSettings?.currency || "USD";

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

  const orderAddons = useMemo<OrderAddonPayload>(() => {
    const duffelAddonsAmount = roundMoney(duffelBaggageSummary.amount);
    const agencyAddonsAmount = roundMoney(agencyAddonSummary.amount);

    return {
      duffel_baggage_enabled: duffelBaggageSummary.count > 0,
      duffel_baggage_count: duffelBaggageSummary.count,
      duffel_baggage_amount: duffelAddonsAmount,
      duffel_baggage_currency: currency,

      duffel_seat_enabled: false,
      duffel_seat_count: 0,
      duffel_seat_amount: 0,
      duffel_seat_currency: currency,

      ...agencyAddonSummary.payload,

      agency_addons_amount: agencyAddonsAmount,
      duffel_addons_amount: duffelAddonsAmount,
      total_addons_amount: roundMoney(agencyAddonsAmount + duffelAddonsAmount),
      currency,
    };
  }, [agencyAddonSummary, currency, duffelBaggageSummary]);

  useEffect(() => {
    onSelectionChange?.({
      selectedBaggageByTraveller,
      selectedPolicyByGroup,
      selectedAddonIds,
      addons: orderAddons,
      agencyAddonsAmount: orderAddons.agency_addons_amount ?? 0,
      duffelAddonsAmount: orderAddons.duffel_addons_amount ?? 0,
      totalAddonsAmount: orderAddons.total_addons_amount ?? 0,
      currency,
    });
  }, [
    currency,
    onSelectionChange,
    orderAddons,
    selectedAddonIds,
    selectedBaggageByTraveller,
    selectedPolicyByGroup,
  ]);

  return (
    <div className="space-y-5">
      <ExtrasIntroCard
        title="Customize your trip"
        description="Choose flight extras, flexibility options and platform services before review."
      />

      <FlightExtrasSection
        baggageSelections={baggageSelections}
        selectedBaggageByTraveller={selectedBaggageByTraveller}
        onBaggageSelect={(travellerId, optionId) => {
          setSelectedBaggageByTraveller((prev) => ({
            ...prev,
            [travellerId]: optionId,
          }));
        }}
        seatSelection={seatSelection}
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
