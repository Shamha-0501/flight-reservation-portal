"use client";

import { useEffect, useState, type ComponentType } from "react";
import {
  Building2,
  CircleUserRound,
  Mail,
  MapPin,
  PencilLine,
  Phone,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  getAdminSettings,
  updateAdminSettings,
  type AdminSettingsPayload,
} from "@/src/api/routes/admin/settings";
import { updateMyProfile } from "@/src/api/routes/profile";
import { useAuth } from "@/src/shared/auth/AuthProvider";
import { authMe } from "@/src/shared/redux/store/authSlice";
import { useAppDispatch } from "@/src/shared/redux/store/hooks";
import {
  AdminButton,
  AdminPage,
  Drawer,
  StatusBadge,
  SurfaceCard,
} from "@/src/shared/components/admin/AdminUI";
import {
  formatRoleLabel,
  getPrimaryTenant,
  isPlatformAdminRole,
  isTenantWorkspaceRole,
  resolveUserRole,
} from "@/src/shared/auth/authModel";

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { user, role, selectedTenant, isPlatformAdmin, isTenantWorkspaceRole: isWorkspaceRole } = useAuth();
  const resolvedRole = resolveUserRole(user);
  const primaryTenant = getPrimaryTenant(user);
  const tenant = selectedTenant ?? primaryTenant;
  const isAgencyProfile = Boolean(isWorkspaceRole || isTenantWorkspaceRole(resolvedRole));
  const isAdminProfile = Boolean(isPlatformAdmin || isPlatformAdminRole(resolvedRole));
  const isCustomerProfile = !isAgencyProfile && !isAdminProfile;

  const [agencySettings, setAgencySettings] = useState<AdminSettingsPayload | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const displayName = user?.name ?? "User";
  const email = user?.email ?? "-";
  const roleLabel = formatRoleLabel(role ?? resolvedRole);
  const profileInitials = getInitials(displayName);

  const displayPersonal = {
    name: displayName,
    email,
    phone: displayValue(user?.phone, "-"),
    country: displayValue(user?.country, "Sri Lanka"),
    city: displayValue(user?.city, "Colombo"),
    postalCode: displayValue(user?.postal_code, "-"),
    address: displayValue(user?.address, "Not set"),
  };

  const draftAgencySettings = agencySettings ?? buildDefaultAgencySettings(tenant?.name ?? displayName);
  const displayAgency = {
    contactEmail: displayValue(agencySettings?.email, "-"),
    contactPhone: displayValue(agencySettings?.phone, "-"),
    currency: displayValue(agencySettings?.currency, "-"),
    timezone: displayValue(agencySettings?.timezone, "-"),
  };

  useEffect(() => {
    const tenantKey = tenant?.key ?? "";

    if (!isAgencyProfile || !tenantKey) return;

    let active = true;

    async function loadTenantSettings() {
      try {
        const payload = await getAdminSettings({ scope: "tenant", tenantKey });
        if (active) {
          setAgencySettings(payload);
        }
      } catch {
        if (active) {
          setAgencySettings(buildDefaultAgencySettings(tenant?.name ?? displayName));
        }
      }
    }

    void loadTenantSettings();

    return () => {
      active = false;
    };
  }, [isAgencyProfile, tenant?.key]);

  async function handleSaveProfile() {
    if (!draft) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      await updateMyProfile({
        name: draft.personal.name.trim(),
        email: draft.personal.email.trim(),
        phone: toNullable(draft.personal.phone),
        country: toNullable(draft.personal.country),
        city: toNullable(draft.personal.city),
        postal_code: toNullable(draft.personal.postalCode),
        address: toNullable(draft.personal.address),
      });

      if (draft.isAgency && tenant?.key) {
        const current = draftAgencySettings;
        const updatedSettings = await updateAdminSettings({
          scope: "tenant",
          tenantKey: tenant.key,
          workspace_name: current.workspace_name,
          email: draft.agency.contactEmail.trim(),
          phone: draft.agency.contactPhone.trim(),
          location: current.location,
          timezone: draft.agency.timezone.trim(),
          currency: draft.agency.currency.trim(),
          theme: current.theme,
          notifications: current.notifications,
        });

        setAgencySettings(updatedSettings as AdminSettingsPayload);
      }

      await dispatch(authMe()).unwrap();
      setEditOpen(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminPage
      eyebrow="Profile"
      title="My Profile"
      description={
        isCustomerProfile
          ? "Personal account information for travelers and customers."
          : isAgencyProfile
            ? "Workspace and contact information for agency users."
            : "Account information for platform administrators and system developers."
      }
    >
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-2xl font-semibold text-slate-700">
                {profileInitials}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                  Account
                </div>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  {displayName}
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">{email}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <StatusBadge value={roleLabel} />
                  {tenant ? <StatusBadge value={formatTenantStatus(tenant.status)} /> : null}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <AdminButton
                variant="secondary"
                onClick={() =>
                  openEditDrawer(
                    {
                      personal: {
                        name: displayPersonal.name,
                        email: displayPersonal.email,
                        phone: inputValue(user?.phone),
                        country: inputValue(user?.country),
                        city: inputValue(user?.city),
                        postalCode: inputValue(user?.postal_code),
                        address: inputValue(user?.address),
                      },
                      agency: {
                        contactEmail: inputValue(draftAgencySettings.email),
                        contactPhone: inputValue(draftAgencySettings.phone),
                        currency: inputValue(draftAgencySettings.currency),
                        timezone: inputValue(draftAgencySettings.timezone),
                      },
                      isAgencyProfile,
                    },
                    setDraft,
                    setEditOpen,
                  )
                }
              >
                <PencilLine className="mr-2 h-4 w-4" />
                Edit
              </AdminButton>
              <AdminButton variant="ghost">Security</AdminButton>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
        <SurfaceCard
          title="Personal Information"
          description="Basic account details shared across customer, agency, and admin profiles."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <InfoField icon={CircleUserRound} label="Name" value={displayName} />
            <InfoField icon={Mail} label="Email" value={displayPersonal.email} />
            <InfoField icon={Phone} label="Phone" value={displayPersonal.phone} />
            <InfoField icon={ShieldCheck} label="Role" value={roleLabel} />
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="Account Summary"
          description="Quick access details based on your current role."
        >
          <div className="space-y-3">
            <SummaryRow label="User ID" value={String(user?.id ?? "-")} />
            <SummaryRow label="Tenant" value={tenant?.name ?? "No tenant"} />
            <SummaryRow label="Tenant Status" value={formatTenantStatus(tenant?.status)} />
            <SummaryRow label="Primary Role" value={roleLabel} />
          </div>
        </SurfaceCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SurfaceCard title="Address" description="Personal or workspace location details.">
          <div className="grid gap-4 md:grid-cols-2">
            <InfoField icon={MapPin} label="Country" value={displayPersonal.country} />
            <InfoField icon={MapPin} label="City" value={displayPersonal.city} />
            <InfoField icon={MapPin} label="Postal Code" value={displayPersonal.postalCode} />
            <InfoField icon={MapPin} label="Address" value={displayPersonal.address} />
          </div>
        </SurfaceCard>

        <SurfaceCard title="Security" description="Account protection and login settings.">
          <div className="grid gap-4 md:grid-cols-2">
            <InfoField icon={ShieldCheck} label="Password" value="Change password" />
            <InfoField icon={ShieldCheck} label="Sessions" value="Signed-in devices" />
            <InfoField icon={ShieldCheck} label="2FA" value="Not enabled" />
            <InfoField icon={ShieldCheck} label="Recovery" value="Email recovery only" />
          </div>
        </SurfaceCard>
      </div>

      {isCustomerProfile ? <CustomerSection /> : null}
      {isAgencyProfile ? <AgencySection tenant={tenant} settings={agencySettings} /> : null}
      {isAdminProfile ? <AdminSection /> : null}

      <Drawer
        open={editOpen}
        title="Edit Profile"
        description="Update the profile details shown on this page."
        onClose={() => {
          if (!isSaving) setEditOpen(false);
        }}
      >
        {draft ? (
          <div className="space-y-5">
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                Personal Information
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Name"
                  value={draft.personal.name}
                  onChange={(value) =>
                    setDraft((current) =>
                      current ? { ...current, personal: { ...current.personal, name: value } } : current,
                    )
                  }
                />
                <TextField
                  label="Email"
                  value={draft.personal.email}
                  onChange={(value) =>
                    setDraft((current) =>
                      current ? { ...current, personal: { ...current.personal, email: value } } : current,
                    )
                  }
                />
                <TextField
                  label="Phone"
                  value={draft.personal.phone}
                  onChange={(value) =>
                    setDraft((current) =>
                      current ? { ...current, personal: { ...current.personal, phone: value } } : current,
                    )
                  }
                />
                <TextField
                  label="Address"
                  value={draft.personal.address}
                  onChange={(value) =>
                    setDraft((current) =>
                      current ? { ...current, personal: { ...current.personal, address: value } } : current,
                    )
                  }
                />
                <TextField
                  label="City"
                  value={draft.personal.city}
                  onChange={(value) =>
                    setDraft((current) =>
                      current ? { ...current, personal: { ...current.personal, city: value } } : current,
                    )
                  }
                />
                <TextField
                  label="Country"
                  value={draft.personal.country}
                  onChange={(value) =>
                    setDraft((current) =>
                      current ? { ...current, personal: { ...current.personal, country: value } } : current,
                    )
                  }
                />
                <TextField
                  label="Postal Code"
                  value={draft.personal.postalCode}
                  onChange={(value) =>
                    setDraft((current) =>
                      current ? { ...current, personal: { ...current.personal, postalCode: value } } : current,
                    )
                  }
                />
              </div>
            </section>

            {draft.isAgency ? (
              <section className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Agency Information
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label="Contact Email"
                    value={draft.agency.contactEmail}
                    onChange={(value) =>
                      setDraft((current) =>
                        current ? { ...current, agency: { ...current.agency, contactEmail: value } } : current,
                      )
                    }
                  />
                  <TextField
                    label="Contact Phone"
                    value={draft.agency.contactPhone}
                    onChange={(value) =>
                      setDraft((current) =>
                        current ? { ...current, agency: { ...current.agency, contactPhone: value } } : current,
                      )
                    }
                  />
                  <TextField
                    label="Currency"
                    value={draft.agency.currency}
                    onChange={(value) =>
                      setDraft((current) =>
                        current ? { ...current, agency: { ...current.agency, currency: value } } : current,
                      )
                    }
                  />
                  <TextField
                    label="Timezone"
                    value={draft.agency.timezone}
                    onChange={(value) =>
                      setDraft((current) =>
                        current ? { ...current, agency: { ...current.agency, timezone: value } } : current,
                      )
                    }
                  />
                </div>
              </section>
            ) : null}

            {saveError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {saveError}
              </div>
            ) : null}

            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
              <AdminButton variant="ghost" onClick={() => setEditOpen(false)} disabled={isSaving}>
                Cancel
              </AdminButton>
              <AdminButton variant="primary" onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </AdminButton>
            </div>
          </div>
        ) : null}
      </Drawer>
    </AdminPage>
  );
}

function CustomerSection() {
  return (
    <SurfaceCard
      title="Customer Profile"
      description="Travelers only need a lightweight personal profile."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <ProfileTile label="Travel status" value="Active traveler account" />
        <ProfileTile label="Bookings" value="Available in booking history" />
        <ProfileTile label="Security" value="Password and login controls" />
      </div>
    </SurfaceCard>
  );
}

function AgencySection({
  tenant,
  settings,
}: {
  tenant: ReturnType<typeof getPrimaryTenant>;
  settings: AdminSettingsPayload | null;
}) {
  return (
    <SurfaceCard
      title="Agency / Workspace Information"
      description="Agency users need workspace details in addition to their personal account."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <InfoField icon={Building2} label="Agency Name" value={tenant?.name ?? "Agency workspace"} />
        <InfoField icon={MapPin} label="Workspace Status" value={formatTenantStatus(tenant?.status)} />
        <InfoField icon={Users} label="Access Role" value={tenant?.role ? formatRoleLabel(tenant.role) : "Member"} />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ProfileTile label="Contact Email" value={settings?.email ?? "-"} />
        <ProfileTile label="Contact Phone" value={settings?.phone ?? "-"} />
        <ProfileTile label="Currency" value={settings?.currency ?? "-"} />
        <ProfileTile label="Timezone" value={settings?.timezone ?? "-"} />
      </div>

      <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-4 text-sm leading-6 text-slate-600">
        For agency users, this profile uses tenant settings for workspace contact details and can
        later be expanded with member count, approval logs, and business identity data.
      </div>
    </SurfaceCard>
  );
}

function AdminSection() {
  return (
    <SurfaceCard
      title="Admin / Developer Profile"
      description="Platform users usually only need account and permission details here."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <ProfileTile label="Security" value="Change password, sessions, 2FA" />
        <ProfileTile label="Permissions" value="Platform-wide access" />
        <ProfileTile label="Audit" value="Admin actions and activity log" />
      </div>
    </SurfaceCard>
  );
}

function InfoField({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-600">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
            {label}
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className="max-w-[55%] text-right text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function ProfileTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function inputValue(value?: string | null) {
  return value?.trim() ?? "";
}

function displayValue(value?: string | null, fallback = "-") {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function toNullable(value: string) {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function formatTenantStatus(status?: string | null) {
  if (!status) return "Unknown";
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type ProfileDraft = {
  personal: {
    name: string;
    email: string;
    phone: string;
    country: string;
    city: string;
    postalCode: string;
    address: string;
  };
  agency: {
    contactEmail: string;
    contactPhone: string;
    currency: string;
    timezone: string;
  };
  isAgency: boolean;
};

type ProfileData = {
  personal: ProfileDraft["personal"];
  agency: ProfileDraft["agency"];
  isAgencyProfile: boolean;
};

function openEditDrawer(
  current: ProfileData,
  setDraft: (value: ProfileDraft) => void,
  setEditOpen: (value: boolean) => void,
) {
  setDraft({
    personal: current.personal,
    agency: current.agency,
    isAgency: current.isAgencyProfile,
  });
  setEditOpen(true);
}

function buildDefaultAgencySettings(workspaceName: string): AdminSettingsPayload {
  return {
    scope: "tenant",
    workspace_name: workspaceName,
    email: "ops@example.com",
    phone: "+94 11 200 0000",
    location: "Workspace address",
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
