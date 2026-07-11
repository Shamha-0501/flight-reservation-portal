export type PlatformAddonCategory =
  | "Updates"
  | "Support"
  | "Protection"
  | "Travel"
  | "Airport"
  | "Identity"
  | "Emergency";

export type PlatformAddonDefinition = {
  id: number;
  code: string;
  default_name: string;
  default_description: string;
  category: PlatformAddonCategory;
  is_active: boolean;
  sort_order: number;
};

export type AgencyAddonRecord = PlatformAddonDefinition & {
  tenant_addon_id?: number | null;
  tenant_id?: number | null;
  is_enabled: boolean;
  display_name: string | null;
  display_description: string | null;
  price: string | number | null;
  currency: string | null;
  final_name?: string;
  final_description?: string;
};

export type AgencyAddonUpdatePayload = {
  is_enabled: boolean;
  display_name?: string | null;
  display_description?: string | null;
  price: number;
  currency: string;
  is_active?: boolean;
};

export type BookingAddonItem = {
  id: string;
  code: string;
  title: string;
  description: string;
  price: string;
  priceAmount: number;
  tag?: string;
  addonId: number;
  currency: string;
  isEnabled: boolean;
  finalName: string;
  finalDescription: string;
};

export type BookingAddonSnapshot = {
  addon_id: number;
  addon_code: string;
  addon_name: string;
  price: number;
  currency: string;
  meta?: Record<string, unknown> | null;
};

export const DEFAULT_PLATFORM_ADDONS: PlatformAddonDefinition[] = [
  {
    id: 1,
    code: "sms_alert",
    default_name: "SMS Alert",
    default_description: "Receive SMS notifications about booking updates and travel reminders.",
    category: "Updates",
    is_active: true,
    sort_order: 10,
  },
  {
    id: 2,
    code: "whatsapp_alert",
    default_name: "WhatsApp Alert",
    default_description: "Get ticket updates and trip reminders on WhatsApp.",
    category: "Updates",
    is_active: true,
    sort_order: 20,
  },
  {
    id: 3,
    code: "email_itinerary",
    default_name: "Email Itinerary Copy",
    default_description: "Send a branded itinerary copy directly to the customer email.",
    category: "Updates",
    is_active: true,
    sort_order: 30,
  },
  {
    id: 4,
    code: "priority_support",
    default_name: "Priority Support",
    default_description: "Offer faster booking and post-booking support.",
    category: "Support",
    is_active: true,
    sort_order: 40,
  },
  {
    id: 5,
    code: "after_hours_support",
    default_name: "After Hours Support",
    default_description: "Provide support outside normal working hours.",
    category: "Support",
    is_active: true,
    sort_order: 50,
  },
  {
    id: 6,
    code: "cancellation_assistance",
    default_name: "Cancellation Assistance",
    default_description: "Help customers handle airline cancellation steps and follow-up.",
    category: "Support",
    is_active: true,
    sort_order: 60,
  },
  {
    id: 7,
    code: "reschedule_assistance",
    default_name: "Reschedule Assistance",
    default_description: "Assist customers with airline itinerary changes and repricing.",
    category: "Support",
    is_active: true,
    sort_order: 70,
  },
  {
    id: 8,
    code: "name_correction_support",
    default_name: "Name Correction Support",
    default_description: "Support minor passenger-name corrections where permitted.",
    category: "Identity",
    is_active: true,
    sort_order: 80,
  },
  {
    id: 9,
    code: "travel_insurance",
    default_name: "Travel Insurance",
    default_description: "Sell insurance coverage for selected trip disruptions and emergencies.",
    category: "Protection",
    is_active: true,
    sort_order: 90,
  },
  {
    id: 10,
    code: "baggage_protection",
    default_name: "Baggage Protection",
    default_description: "Offer support for baggage claim assistance and protection.",
    category: "Protection",
    is_active: true,
    sort_order: 100,
  },
  {
    id: 11,
    code: "flight_delay_support",
    default_name: "Flight Delay Support",
    default_description: "Support customers when flights are delayed or disrupted.",
    category: "Protection",
    is_active: true,
    sort_order: 110,
  },
  {
    id: 12,
    code: "airport_assistance",
    default_name: "Airport Assistance",
    default_description: "Arrange support for a smoother airport experience.",
    category: "Airport",
    is_active: true,
    sort_order: 120,
  },
  {
    id: 13,
    code: "checkin_assistance",
    default_name: "Check-in Assistance",
    default_description: "Help prepare boarding details and check-in reminders.",
    category: "Airport",
    is_active: true,
    sort_order: 130,
  },
  {
    id: 14,
    code: "emergency_hotline",
    default_name: "Emergency Hotline",
    default_description: "Provide urgent travel support through an emergency hotline.",
    category: "Emergency",
    is_active: true,
    sort_order: 140,
  },
];

export function buildDefaultAgencyAddonRows(): AgencyAddonRecord[] {
  return DEFAULT_PLATFORM_ADDONS.map((addon) => ({
    ...addon,
    is_enabled: false,
    display_name: null,
    display_description: null,
    price: 0,
    currency: "LKR",
    final_name: addon.default_name,
    final_description: addon.default_description,
  }));
}

export function mapAgencyAddonsToBookingItems(
  records: AgencyAddonRecord[]
): BookingAddonItem[] {
  return [...records]
    .filter((addon) => addon.is_active && addon.is_enabled)
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((addon) => {
      const priceAmount = normalizePrice(addon.price);
      const currency = (addon.currency || "LKR").toString().toUpperCase();
      const finalName = addon.final_name || addon.display_name || addon.default_name;
      const finalDescription =
        addon.final_description ||
        addon.display_description ||
        addon.default_description;

      return {
        id: addon.code,
        code: addon.code,
        title: finalName,
        description: finalDescription,
        price: formatCurrencyAmount(priceAmount, currency),
        priceAmount,
        tag: addon.category,
        addonId: addon.id,
        currency,
        isEnabled: Boolean(addon.is_enabled),
        finalName,
        finalDescription,
      };
    });
}

export function buildBookingAddonSnapshots(
  records: AgencyAddonRecord[],
  selectedCodes: string[]
): BookingAddonSnapshot[] {
  const selected = new Set(selectedCodes);

  return records
    .filter((addon) => selected.has(addon.code))
    .map((addon) => ({
      addon_id: addon.id,
      addon_code: addon.code,
      addon_name: addon.final_name || addon.display_name || addon.default_name,
      price: normalizePrice(addon.price),
      currency: (addon.currency || "LKR").toString().toUpperCase(),
      meta: {
        category: addon.category,
        tenant_addon_id: addon.tenant_addon_id ?? null,
      },
    }));
}

export function normalizeAgencyAddonRecord(
  addon: Partial<AgencyAddonRecord> & Pick<PlatformAddonDefinition, "id" | "code" | "default_name" | "default_description" | "category" | "is_active" | "sort_order">
): AgencyAddonRecord {
  const displayName = normalizeText(addon.display_name);
  const displayDescription = normalizeText(addon.display_description);
  const currency = (addon.currency || "LKR").toString().toUpperCase();

  return {
    ...addon,
    display_name: displayName,
    display_description: displayDescription,
    price: normalizePrice(addon.price),
    currency,
    is_enabled: Boolean(addon.is_enabled),
    final_name: displayName || addon.default_name,
    final_description: displayDescription || addon.default_description,
  };
}

export function mergeAgencyAddonRows(
  records: Partial<AgencyAddonRecord>[]
): AgencyAddonRecord[] {
  const byCode = new Map<string, Partial<AgencyAddonRecord>>();

  for (const record of records) {
    if (!record) continue;
    const code = record.code?.toString();
    if (!code) continue;
    byCode.set(code, record);
  }

  return DEFAULT_PLATFORM_ADDONS.map((addon) =>
    normalizeAgencyAddonRecord({
      ...addon,
      ...(byCode.get(addon.code) ?? {}),
    } as Partial<AgencyAddonRecord> & PlatformAddonDefinition)
  );
}

export function formatCurrencyAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function normalizeText(value?: string | null) {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function normalizePrice(value?: string | number | null) {
  if (value === null || value === undefined || value === "") return 0;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
}
