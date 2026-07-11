export type AgencyMarkupMode = "percentage" | "fixed";

export type AgencyMarkupSettings = {
  tenant_id?: number | null;
  is_enabled: boolean;
  markup_mode: AgencyMarkupMode;
  markup_value: number;
  currency: string;
  display_label?: string | null;
  final_label?: string;
};

export type AgencyMarkupSnapshot = {
  enabled: boolean;
  mode: AgencyMarkupMode;
  value: number;
  amount: number;
  currency: string;
  label: string;
};

export function normalizeAgencyMarkupSettings(
  settings: Partial<AgencyMarkupSettings>,
): AgencyMarkupSettings {
  const markupMode: AgencyMarkupMode =
    settings.markup_mode === "fixed" ? "fixed" : "percentage";

  return {
    tenant_id: settings.tenant_id ?? null,
    is_enabled: Boolean(settings.is_enabled),
    markup_mode: markupMode,
    markup_value: normalizeMarkupValue(settings.markup_value),
    currency: (settings.currency || "LKR").toString().toUpperCase(),
    display_label: normalizeText(settings.display_label),
    final_label: normalizeText(settings.display_label) || "Agency markup",
  };
}

export function buildDefaultAgencyMarkupSettings(): AgencyMarkupSettings {
  return {
    tenant_id: null,
    is_enabled: false,
    markup_mode: "percentage",
    markup_value: 0,
    currency: "LKR",
    display_label: null,
    final_label: "Agency markup",
  };
}

export function calculateAgencyMarkupAmount(
  baseFareAmount: number,
  settings: AgencyMarkupSettings | null | undefined,
) {
  if (!settings?.is_enabled) return 0;

  const value = normalizeMarkupValue(settings.markup_value);
  if (value <= 0) return 0;

  if (settings.markup_mode === "fixed") {
    return roundMoney(value);
  }

  return roundMoney((normalizeMoneyAmount(baseFareAmount) * value) / 100);
}

export function buildAgencyMarkupSnapshot(
  settings: AgencyMarkupSettings | null | undefined,
  baseFareAmount: number,
) : AgencyMarkupSnapshot | null {
  if (!settings?.is_enabled) return null;

  const amount = calculateAgencyMarkupAmount(baseFareAmount, settings);
  return {
    enabled: true,
    mode: settings.markup_mode,
    value: normalizeMarkupValue(settings.markup_value),
    amount,
    currency: (settings.currency || "LKR").toString().toUpperCase(),
    label: settings.final_label || settings.display_label || "Agency markup",
  };
}

export function formatMoneyAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function normalizeMarkupValue(value?: number | string | null) {
  if (value === null || value === undefined || value === "") return 0;
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
}

export function normalizeText(value?: string | null) {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function normalizeMoneyAmount(amount: number) {
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
}

function roundMoney(amount: number) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
