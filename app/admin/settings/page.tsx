"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/src/shared/auth/AuthProvider";
import {
  AdminButton,
  AdminPage,
  FilterSelect,
  LoadingSkeleton,
  SurfaceCard,
} from "@/src/shared/components/admin/AdminUI";
import {
  getAdminSettings,
  updateAdminSettings,
  type AdminSettingsPayload,
} from "@/src/api/routes/admin/settings";

export default function AdminSettingsPage() {
  const { isPlatformAdmin, selectedTenant, roleLabel, canManageTenantSettings } = useAuth();
  const scope = isPlatformAdmin ? "platform" : "tenant";
  const [settings, setSettings] = useState<AdminSettingsPayload>(() =>
    getDefaultSettings(scope, selectedTenant?.name ?? null),
  );
  const [baseline, setBaseline] = useState<AdminSettingsPayload>(() =>
    getDefaultSettings(scope, selectedTenant?.name ?? null),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!canManageTenantSettings) {
      setLoading(false);
      return;
    }

    let active = true;

    async function loadSettings() {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      try {
        const payload = await getAdminSettings({
          scope,
          tenantKey: selectedTenant?.key,
        });

        if (!active) return;

        setSettings(payload);
        setBaseline(payload);
      } catch (requestError) {
        if (!active) return;

        const fallback = getDefaultSettings(scope, selectedTenant?.name ?? null);
        setSettings(fallback);
        setBaseline(fallback);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to load settings.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, [canManageTenantSettings, scope, selectedTenant?.key, selectedTenant?.name]);

  const notificationItems = useMemo(
    () => [
      {
        key: "refund_status_updates" as const,
        label: "Refund status updates",
        description: "Notify staff when a refund is approved, pending, or completed.",
      },
      {
        key: "reschedule_approvals" as const,
        label: "Reschedule approvals",
        description: "Send alerts when itinerary changes need review or have been approved.",
      },
      {
        key: "daily_booking_digest" as const,
        label: "Daily booking digest",
        description: "Summarize the day’s bookings, cancellations, and revenue in one email.",
      },
      {
        key: "agency_onboarding_alerts" as const,
        label: "Agency onboarding alerts",
        description: "Alert platform admins when a new agency joins, verifies, or needs approval.",
      },
      {
        key: "security_alerts" as const,
        label: "Security alerts",
        description: "Flag suspicious sign-ins, permission changes, or account recovery events.",
      },
      {
        key: "operational_alerts" as const,
        label: "Operational alerts",
        description: "Broadcast service-impacting events and workflow failures to the admin team.",
      },
    ],
    [],
  );

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const updated = (await updateAdminSettings({
        ...settings,
        scope,
        tenantKey: selectedTenant?.key,
      })) as AdminSettingsPayload;

      setSettings(updated);
      setBaseline(updated);
      setSuccessMessage("Settings saved successfully.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to save settings.",
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

  if (!canManageTenantSettings) {
    return (
      <AdminPage
        title="Settings"
        description={`Settings are restricted for ${selectedTenant?.name ?? "this workspace"}.`}
      >
        <SurfaceCard
          title="Owner-only area"
          description="Tenant admins can view the workspace but cannot change settings."
        >
          <p className="text-sm leading-6 text-slate-600">
            Only the tenant owner can access tenant settings. Tenant admins have read-only access to operational pages.
          </p>
        </SurfaceCard>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      title="Settings"
      description={
        isPlatformAdmin
          ? "Global portal settings, approval controls, and operational preferences for the platform."
          : `Tenant information and workspace preferences for ${selectedTenant?.name ?? "this workspace"}.`
      }
      actions={
        <>
          <AdminButton variant="primary" disabled={loading || saving} onClick={handleSave}>
            {saving ? "Saving..." : "Save Changes"}
          </AdminButton>
          <AdminButton variant="ghost" onClick={handleReset} disabled={loading || saving}>
            Reset
          </AdminButton>
        </>
      }
    >
      {error ? (
        <SurfaceCard>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        </SurfaceCard>
      ) : null}

      {successMessage ? (
        <SurfaceCard>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {successMessage}
          </div>
        </SurfaceCard>
      ) : null}

      <SurfaceCard
        title={isPlatformAdmin ? "Portal information" : "Tenant information"}
        description={loading ? "Loading saved settings from the backend..." : undefined}
      >
        {loading ? <LoadingSkeleton /> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label={isPlatformAdmin ? "Platform Name" : "Company Name"}
            value={settings.workspace_name}
            onChange={(value) => setSettings((current) => ({ ...current, workspace_name: value }))}
          />
          <TextField
            label="Email"
            value={settings.email}
            onChange={(value) => setSettings((current) => ({ ...current, email: value }))}
          />
          <TextField
            label="Phone"
            value={settings.phone}
            onChange={(value) => setSettings((current) => ({ ...current, phone: value }))}
          />
          <TextField
            label={isPlatformAdmin ? "Location" : "Address"}
            value={settings.location}
            onChange={(value) => setSettings((current) => ({ ...current, location: value }))}
          />
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Timezone</label>
            <FilterSelect
              value={settings.timezone}
              onChange={(value) => setSettings((current) => ({ ...current, timezone: value }))}
              options={["Asia/Colombo", "Asia/Dubai", "Asia/Singapore"]}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Currency</label>
            <FilterSelect
              value={settings.currency}
              onChange={(value) => setSettings((current) => ({ ...current, currency: value }))}
              options={["USD", "LKR", "AED"]}
              disabled={loading}
            />
          </div>
        </div>
      </SurfaceCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <SurfaceCard title={isPlatformAdmin ? "Brand theme" : "Theme"}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              {isPlatformAdmin ? "Platform theme" : "Portal theme"}
            </label>
            <FilterSelect
              value={settings.theme}
              onChange={(value) => setSettings((current) => ({ ...current, theme: value }))}
              options={["Portal Blue", "Ocean Sky", "Slate Air"]}
              disabled={loading}
            />
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="Notification preferences"
          description={
            isPlatformAdmin
              ? "These toggles control which admin alerts are stored and sent by the backend."
              : `These alerts cover ${roleLabel.toLowerCase()} workspace updates.`
          }
        >
          <div className="space-y-3">
            {notificationItems.map((item) => (
              <label
                key={item.key}
                className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-700">{item.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    {item.description}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.notifications[item.key]}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      notifications: {
                        ...current.notifications,
                        [item.key]: event.target.checked,
                      },
                    }))
                  }
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
                />
              </label>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </AdminPage>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
      />
    </div>
  );
}

function getDefaultSettings(scope: "platform" | "tenant", tenantName: string | null): AdminSettingsPayload {
  if (scope === "platform") {
    return {
      scope,
      workspace_name: "Flight Portal",
      email: "support@flightportal.com",
      phone: "+94 11 200 0000",
      location: "Platform operations center",
      timezone: "Asia/Colombo",
      currency: "USD",
      theme: "Portal Blue",
      notifications: {
        refund_status_updates: true,
        reschedule_approvals: true,
        daily_booking_digest: true,
        agency_onboarding_alerts: true,
        security_alerts: true,
        operational_alerts: true,
      },
    };
  }

  return {
    scope,
    workspace_name: tenantName ?? "SkyWay Travels",
    email: "ops@skywaytravels.com",
    phone: "+94 11 230 4400",
    location: "142 Galle Road, Colombo 03",
    timezone: "Asia/Colombo",
    currency: "USD",
    theme: "Portal Blue",
    notifications: {
      refund_status_updates: true,
      reschedule_approvals: true,
      daily_booking_digest: true,
      agency_onboarding_alerts: true,
      security_alerts: true,
      operational_alerts: true,
    },
  };
}
