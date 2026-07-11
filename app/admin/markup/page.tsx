"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgePercent, DollarSign, Percent } from "lucide-react";
import { useAuth } from "@/src/shared/auth/AuthProvider";
import {
  AdminButton,
  AdminPage,
  EmptyState,
  FilterSelect,
  LoadingSkeleton,
  StatCard,
  SurfaceCard,
} from "@/src/shared/components/admin/AdminUI";
import {
  getAgencyMarkupSettings,
  updateAgencyMarkupSettings,
} from "@/src/api/routes/agency/markup";
import {
  buildDefaultAgencyMarkupSettings,
  calculateAgencyMarkupAmount,
  formatMoneyAmount,
  normalizeAgencyMarkupSettings,
  normalizeMarkupValue,
  type AgencyMarkupSettings,
} from "@/src/shared/lib/agencyMarkup";

export default function AdminMarkupPage() {
  const { isPlatformAdmin, selectedTenant, canManageTenantSettings, roleLabel } = useAuth();
  const canManage = isPlatformAdmin || canManageTenantSettings;

  const [settings, setSettings] = useState<AgencyMarkupSettings>(() =>
    buildDefaultAgencyMarkupSettings(),
  );
  const [baseline, setBaseline] = useState<AgencyMarkupSettings>(() =>
    buildDefaultAgencyMarkupSettings(),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!canManage) {
      setLoading(false);
      return;
    }

    let active = true;

    async function loadMarkup() {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      try {
        const payload = await getAgencyMarkupSettings(selectedTenant?.key ?? "");
        if (!active) return;

        const normalized = normalizeAgencyMarkupSettings(
          payload ?? buildDefaultAgencyMarkupSettings(),
        );
        setSettings(normalized);
        setBaseline(normalized);
      } catch (requestError) {
        if (!active) return;

        const fallback = buildDefaultAgencyMarkupSettings();
        setSettings(fallback);
        setBaseline(fallback);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to load markup settings.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadMarkup();

    return () => {
      active = false;
    };
  }, [canManage, selectedTenant?.key]);

  const markupAmount = useMemo(
    () => calculateAgencyMarkupAmount(100000, settings),
    [settings],
  );

  const markupLabel = useMemo(() => {
    if (!settings.is_enabled) return "Disabled";
    return settings.markup_mode === "percentage"
      ? `${normalizeMarkupValue(settings.markup_value)}%`
      : formatMoneyAmount(normalizeMarkupValue(settings.markup_value), settings.currency);
  }, [settings.currency, settings.is_enabled, settings.markup_mode, settings.markup_value]);

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const updated = await updateAgencyMarkupSettings({
        ...settings,
        tenantKey: selectedTenant?.key,
      });
      const normalized = normalizeAgencyMarkupSettings(updated);

      setSettings(normalized);
      setBaseline(normalized);
      setSuccessMessage("Markup settings saved successfully.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to save markup settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setSettings(baseline);
    setError(null);
    setSuccessMessage(null);
  }

  if (!canManage) {
    return (
      <AdminPage
        eyebrow="Agency pricing"
        title="Agency Markup"
        description={`Markup settings are available to the workspace owner and platform admins for ${selectedTenant?.name ?? "this workspace"}.`}
      >
        <SurfaceCard
          title="Read-only access"
          description={`Your current role (${roleLabel}) can view the workspace, but cannot manage markup.`}
        >
          <p className="text-sm leading-6 text-slate-600">
            Only the workspace owner or a platform admin can change agency markup.
          </p>
        </SurfaceCard>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      eyebrow="Agency pricing"
      title="Agency Markup"
      description={
        isPlatformAdmin
          ? "Set workspace pricing adjustments that are applied on top of the Duffel fare."
          : `Configure the markup applied to bookings for ${selectedTenant?.name ?? "this workspace"}.`
      }
      actions={
        <>
          <AdminButton variant="secondary" disabled={loading || saving} onClick={handleReset}>
            Reset
          </AdminButton>
          <AdminButton disabled={loading || saving} onClick={() => void handleSave()}>
            {saving ? "Saving..." : "Save Changes"}
          </AdminButton>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Markup"
          value={markupLabel}
          note="Applied to each booking"
          icon={BadgePercent}
          iconTone="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Example"
          value={formatMoneyAmount(markupAmount, settings.currency)}
          note="On a 100,000 fare sample"
          icon={DollarSign}
          iconTone="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Mode"
          value={settings.markup_mode === "percentage" ? "Percentage" : "Fixed"}
          note="How the booking adjustment is calculated"
          icon={Percent}
          iconTone="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="Status"
          value={settings.is_enabled ? "Enabled" : "Disabled"}
          note="Controls whether markup is applied"
          icon={BadgePercent}
          iconTone="bg-slate-50 text-slate-600"
        />
      </div>

      {error ? (
        <SurfaceCard>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        </SurfaceCard>
      ) : null}

      {successMessage ? (
        <SurfaceCard>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        </SurfaceCard>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <SurfaceCard
          title="Markup settings"
          description={
            loading
              ? "Fetching markup settings..."
              : "Set a percentage or fixed adjustment for this workspace."
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Status</label>
              <ToggleButton
                checked={settings.is_enabled}
                label={settings.is_enabled ? "Enabled" : "Disabled"}
                onClick={() =>
                  setSettings((current) => ({
                    ...current,
                    is_enabled: !current.is_enabled,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Mode</label>
              <FilterSelect
                value={settings.markup_mode === "percentage" ? "Percentage" : "Fixed amount"}
                onChange={(value) =>
                  setSettings((current) => ({
                    ...current,
                    markup_mode: value === "Fixed amount" ? "fixed" : "percentage",
                  }))
                }
                options={["Percentage", "Fixed amount"]}
                disabled={loading}
              />
            </div>

            <Field
              label={settings.markup_mode === "percentage" ? "Markup percentage" : "Markup amount"}
              value={String(settings.markup_value)}
              onChange={(value) =>
                setSettings((current) => ({
                  ...current,
                  markup_value: normalizeMarkupValue(value),
                }))
              }
              type="number"
              min={0}
              step={settings.markup_mode === "percentage" ? "0.01" : "1"}
            />

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Currency</label>
              <FilterSelect
                value={settings.currency || "LKR"}
                onChange={(value) =>
                  setSettings((current) => ({
                    ...current,
                    currency: value,
                  }))
                }
                options={["LKR", "USD", "AED"]}
                disabled={loading}
              />
            </div>

            <div className="md:col-span-2">
              <Field
                label="Display label"
                value={settings.display_label ?? ""}
                onChange={(value) =>
                  setSettings((current) => ({
                    ...current,
                    display_label: value,
                  }))
                }
                placeholder="Agency markup"
              />
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="Markup Preview"
          description="This is only a preview. Actual totals are calculated using the real Duffel fare during booking."
        >
          {loading ? <LoadingSkeleton /> : null}
          <div className="space-y-4">
            <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-4">
              <div className="space-y-2 text-sm text-slate-700">
                <Row label="Sample fare:" value={formatMoneyAmount(100000, settings.currency)} />
                <Row
                  label={
                    settings.markup_mode === "percentage"
                      ? `Agency markup ${normalizeMarkupValue(settings.markup_value)}%:`
                      : "Agency markup:"
                  }
                  value={formatMoneyAmount(markupAmount, settings.currency)}
                />
                <Row
                  label="Preview total:"
                  value={formatMoneyAmount(100000 + markupAmount, settings.currency)}
                />
              </div>
            </div>

            {settings.markup_value < 0 ? (
              <EmptyState
                title="Invalid markup"
                description="Markup must be zero or higher."
              />
            ) : null}
          </div>
        </SurfaceCard>
      </div>
    </AdminPage>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  min?: number;
  step?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-slate-700">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        min={min}
        step={step}
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
      />
    </div>
  );
}

function ToggleButton({
  checked,
  onClick,
  label,
}: {
  checked: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-11 items-center justify-between gap-3 rounded-xl border px-4 text-sm font-bold transition ${
        checked
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-white"
      }`}
    >
      <span>{label}</span>
      <span
        className={`inline-flex h-6 w-11 items-center rounded-full p-0.5 transition ${
          checked ? "bg-emerald-500 justify-end" : "bg-slate-300 justify-start"
        }`}
      >
        <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
      </span>
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className="text-sm font-bold text-slate-950">{value}</span>
    </div>
  );
}
