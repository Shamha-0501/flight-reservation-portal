import type { OrderAddonPayload } from "@/src/api/routes/orders/create";
import type { AddonItem, PolicyGroup } from "../components/booking/steps/ExtrasStep";

type EnabledPricedSetting = {
  enabled: boolean;
  price: string | number | null;
};

export type TenantAddonSettings = {
  tenant_id: number;
  currency: string;

  cancellation_guarantee: EnabledPricedSetting & {
    type: "50_percent" | "80_percent" | "100_percent" | "voucher" | null;
  };
  flexible_change: EnabledPricedSetting;
  rebooking_assistance: EnabledPricedSetting;
  name_correction: EnabledPricedSetting;
  travel_insurance: EnabledPricedSetting;
  priority_support: EnabledPricedSetting;
  sms_alert: EnabledPricedSetting;
  whatsapp_alert: EnabledPricedSetting;
  airport_assistance: EnabledPricedSetting;
  checkin_assistance: EnabledPricedSetting;
  baggage_protection: EnabledPricedSetting;
  disruption_support: EnabledPricedSetting;
  lounge_access: EnabledPricedSetting;
  fast_track: EnabledPricedSetting;
  priority_boarding: EnabledPricedSetting;
};

type AgencyAddonSelectionSummary = {
  payload: OrderAddonPayload;
  amount: number;
};

export function toMoneyAmount(price: string | number | null | undefined) {
  if (price === null || price === undefined || price === "") return 0;
  const amount = Number(price);
  return Number.isFinite(amount) ? amount : 0;
}

export function formatAddonPrice(
  price: string | number | null | undefined,
  currency: string
) {
  if (price === null || price === undefined) return "Included";

  return `+ ${new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(toMoneyAmount(price))}`;
}

function getCancellationTitle(
  type: TenantAddonSettings["cancellation_guarantee"]["type"]
) {
  switch (type) {
    case "50_percent":
      return "50% refund guarantee";
    case "80_percent":
      return "80% refund guarantee";
    case "100_percent":
      return "100% refund guarantee";
    case "voucher":
      return "Cancel for travel credit";
    default:
      return "Cancellation guarantee";
  }
}

export function mapTenantSettingsToPolicies(
  settings: TenantAddonSettings
): PolicyGroup[] {
  const currency = settings.currency || "USD";

  const cancellationUpgrades: PolicyGroup["upgrades"] = [];
  const changeUpgrades: PolicyGroup["upgrades"] = [];

  if (settings.cancellation_guarantee.enabled) {
    cancellationUpgrades.push({
      id: "cancellation-guarantee",
      label: getCancellationTitle(settings.cancellation_guarantee.type),
      description:
        "Add refund protection if your plans change before departure.",
      price: formatAddonPrice(settings.cancellation_guarantee.price, currency),
      priceAmount: toMoneyAmount(settings.cancellation_guarantee.price),
      recommended: settings.cancellation_guarantee.type === "100_percent",
    });
  }

  if (settings.flexible_change.enabled) {
    changeUpgrades.push({
      id: "flexible-change",
      label: "Flexible date change",
      description: "Change travel dates with reduced platform service fees.",
      price: formatAddonPrice(settings.flexible_change.price, currency),
      priceAmount: toMoneyAmount(settings.flexible_change.price),
    });
  }

  if (settings.rebooking_assistance.enabled) {
    changeUpgrades.push({
      id: "rebooking-assistance",
      label: "Rebooking assistance",
      description: "Get agent support if you need help changing your booking.",
      price: formatAddonPrice(settings.rebooking_assistance.price, currency),
      priceAmount: toMoneyAmount(settings.rebooking_assistance.price),
    });
  }

  if (settings.name_correction.enabled) {
    changeUpgrades.push({
      id: "name-correction",
      label: "Name correction support",
      description:
        "Get help requesting minor passenger-name corrections where allowed.",
      price: formatAddonPrice(settings.name_correction.price, currency),
      priceAmount: toMoneyAmount(settings.name_correction.price),
    });
  }

  return [
    {
      id: "cancellation",
      title: "Cancellation",
      includedLabel: "Included policy",
      includedValue: "Standard airline fare rules apply",
      upgrades: cancellationUpgrades,
    },
    {
      id: "changes",
      title: "Changes",
      includedLabel: "Included policy",
      includedValue: "Changes depend on airline fare rules",
      upgrades: changeUpgrades,
    },
  ].filter((group) => group.upgrades.length > 0);
}

export function mapTenantSettingsToAddons(
  settings: TenantAddonSettings
): AddonItem[] {
  const currency = settings.currency || "USD";

  const addons: AddonItem[] = [];

  if (settings.travel_insurance.enabled) {
    addons.push({
      id: "travel-insurance",
      title: "Travel insurance",
      description:
        "Coverage support for selected travel disruptions, delays and emergencies.",
      price: formatAddonPrice(settings.travel_insurance.price, currency),
      priceAmount: toMoneyAmount(settings.travel_insurance.price),
      tag: "Protection",
    });
  }

  if (settings.priority_support.enabled) {
    addons.push({
      id: "priority-support",
      title: "Priority support",
      description:
        "Get faster support for booking questions, changes and travel issues.",
      price: formatAddonPrice(settings.priority_support.price, currency),
      priceAmount: toMoneyAmount(settings.priority_support.price),
      tag: "Support",
    });
  }

  if (settings.sms_alert.enabled) {
    addons.push({
      id: "sms-alerts",
      title: "SMS ticket updates",
      description: "Receive ticket details and important booking updates by SMS.",
      price: formatAddonPrice(settings.sms_alert.price, currency),
      priceAmount: toMoneyAmount(settings.sms_alert.price),
      tag: "Updates",
    });
  }

  if (settings.whatsapp_alert.enabled) {
    addons.push({
      id: "whatsapp-alerts",
      title: "WhatsApp travel alerts",
      description:
        "Receive reminders, booking updates and travel alerts on WhatsApp.",
      price: formatAddonPrice(settings.whatsapp_alert.price, currency),
      priceAmount: toMoneyAmount(settings.whatsapp_alert.price),
      tag: "Updates",
    });
  }

  if (settings.airport_assistance.enabled) {
    addons.push({
      id: "airport-assistance",
      title: "Airport assistance",
      description: "Get support at the airport for a smoother journey.",
      price: formatAddonPrice(settings.airport_assistance.price, currency),
      priceAmount: toMoneyAmount(settings.airport_assistance.price),
      tag: "Airport",
    });
  }

  if (settings.checkin_assistance.enabled) {
    addons.push({
      id: "checkin-assistance",
      title: "Check-in assistance",
      description:
        "Get check-in reminders and help preparing your boarding details.",
      price: formatAddonPrice(settings.checkin_assistance.price, currency),
      priceAmount: toMoneyAmount(settings.checkin_assistance.price),
      tag: "Support",
    });
  }

  if (settings.baggage_protection.enabled) {
    addons.push({
      id: "baggage-protection",
      title: "Baggage protection",
      description:
        "Support for delayed, damaged or lost baggage claim assistance.",
      price: formatAddonPrice(settings.baggage_protection.price, currency),
      priceAmount: toMoneyAmount(settings.baggage_protection.price),
      tag: "Protection",
    });
  }

  if (settings.disruption_support.enabled) {
    addons.push({
      id: "disruption-support",
      title: "Flight disruption support",
      description: "Get help if your flight is delayed, changed or cancelled.",
      price: formatAddonPrice(settings.disruption_support.price, currency),
      priceAmount: toMoneyAmount(settings.disruption_support.price),
      tag: "Support",
    });
  }

  if (settings.lounge_access.enabled) {
    addons.push({
      id: "lounge-access",
      title: "Airport lounge access",
      description: "Relax before your flight with lounge access where available.",
      price: formatAddonPrice(settings.lounge_access.price, currency),
      priceAmount: toMoneyAmount(settings.lounge_access.price),
      tag: "Premium",
    });
  }

  if (settings.fast_track.enabled) {
    addons.push({
      id: "fast-track",
      title: "Fast-track airport service",
      description: "Move faster through selected airport processes.",
      price: formatAddonPrice(settings.fast_track.price, currency),
      priceAmount: toMoneyAmount(settings.fast_track.price),
      tag: "Premium",
    });
  }

  if (settings.priority_boarding.enabled) {
    addons.push({
      id: "priority-boarding",
      title: "Priority boarding support",
      description: "Add boarding support where available for your journey.",
      price: formatAddonPrice(settings.priority_boarding.price, currency),
      priceAmount: toMoneyAmount(settings.priority_boarding.price),
      tag: "Premium",
    });
  }

  return addons;
}

export function buildAgencyAddonPayload(
  settings: TenantAddonSettings,
  selectedPolicyIds: string[],
  selectedAddonIds: string[]
): AgencyAddonSelectionSummary {
  const selected = new Set([...selectedPolicyIds, ...selectedAddonIds]);
  const payload: OrderAddonPayload = {
    cancellation_guarantee_enabled: selected.has("cancellation-guarantee"),
    cancellation_guarantee_type: selected.has("cancellation-guarantee")
      ? settings.cancellation_guarantee.type
      : null,

    flexible_date_change_enabled: selected.has("flexible-change"),
    flexible_date_change_type: selected.has("flexible-change")
      ? "reduced_fee"
      : null,

    rebooking_assistance_enabled: selected.has("rebooking-assistance"),
    name_correction_support_enabled: selected.has("name-correction"),
    schedule_change_support_enabled: false,

    travel_insurance_enabled: selected.has("travel-insurance"),
    travel_insurance_plan: selected.has("travel-insurance") ? "standard" : null,

    notification_alerts_enabled:
      selected.has("sms-alerts") || selected.has("whatsapp-alerts"),
    sms_alerts_enabled: selected.has("sms-alerts"),
    whatsapp_alerts_enabled: selected.has("whatsapp-alerts"),

    priority_support_enabled: selected.has("priority-support"),
    priority_support_type: selected.has("priority-support") ? "24_7" : null,

    disruption_compensation_support_enabled: selected.has("disruption-support"),
    baggage_protection_enabled: selected.has("baggage-protection"),
    airport_assistance_enabled: selected.has("airport-assistance"),
    checkin_assistance_enabled: selected.has("checkin-assistance"),

    travel_connectivity_enabled: false,
    travel_connectivity_type: null,

    premium_airport_services_enabled:
      selected.has("lounge-access") ||
      selected.has("fast-track") ||
      selected.has("priority-boarding"),
    premium_airport_service_type: getPremiumAirportServiceType(selected),
  };

  return {
    payload,
    amount: getSelectedAgencyAddonAmount(settings, selected),
  };
}

function getPremiumAirportServiceType(selected: Set<string>) {
  if (selected.has("lounge-access")) return "lounge";
  if (selected.has("fast-track")) return "fast_track_security";
  if (selected.has("priority-boarding")) return "priority_boarding";
  return null;
}

function getSelectedAgencyAddonAmount(
  settings: TenantAddonSettings,
  selected: Set<string>
) {
  const selectedPrices = [
    ["cancellation-guarantee", settings.cancellation_guarantee.price],
    ["flexible-change", settings.flexible_change.price],
    ["rebooking-assistance", settings.rebooking_assistance.price],
    ["name-correction", settings.name_correction.price],
    ["travel-insurance", settings.travel_insurance.price],
    ["priority-support", settings.priority_support.price],
    ["sms-alerts", settings.sms_alert.price],
    ["whatsapp-alerts", settings.whatsapp_alert.price],
    ["airport-assistance", settings.airport_assistance.price],
    ["checkin-assistance", settings.checkin_assistance.price],
    ["baggage-protection", settings.baggage_protection.price],
    ["disruption-support", settings.disruption_support.price],
    ["lounge-access", settings.lounge_access.price],
    ["fast-track", settings.fast_track.price],
    ["priority-boarding", settings.priority_boarding.price],
  ] as const;

  return selectedPrices.reduce((total, [id, price]) => {
    return selected.has(id) ? total + toMoneyAmount(price) : total;
  }, 0);
}
