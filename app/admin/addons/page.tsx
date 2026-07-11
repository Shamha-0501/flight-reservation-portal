"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, ChevronDown, ChevronRight, Package, Sparkles } from "lucide-react";
import { useAuth } from "@/src/shared/auth/AuthProvider";
import {
  AdminButton,
  AdminPage,
  EmptyState,
  FilterSelect,
  LoadingSkeleton,
  SearchInput,
  StatCard,
  SurfaceCard,
} from "@/src/shared/components/admin/AdminUI";
import {
  getAgencyAddons,
  resetAgencyAddon,
  updateAgencyAddon,
} from "@/src/api/routes/agency/addons";
import {
  buildDefaultAgencyAddonRows,
  formatCurrencyAmount,
  mergeAgencyAddonRows,
  normalizeAgencyAddonRecord,
  normalizePrice,
  normalizeText,
  type AgencyAddonRecord,
  type AgencyAddonUpdatePayload,
} from "@/src/shared/lib/agencyAddons";

type StatusFilter = "All" | "Enabled" | "Disabled";

export default function AdminAddonsPage() {
  const { isPlatformAdmin, selectedTenant, canManageTenantSettings, roleLabel } = useAuth();
  const canManage = isPlatformAdmin || canManageTenantSettings;
  const [addons, setAddons] = useState<AgencyAddonRecord[]>(() => buildDefaultAgencyAddonRows());
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [expandedAddonId, setExpandedAddonId] = useState<number | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<number, string | null>>({});

  useEffect(() => {
    let active = true;

    async function loadAddons() {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      try {
        const result = await getAgencyAddons();
        if (!active) return;

        setAddons(result.length ? mergeAgencyAddonRows(result) : buildDefaultAgencyAddonRows());
      } catch (requestError) {
        if (!active) return;

        setAddons(buildDefaultAgencyAddonRows());
        setError(
          requestError instanceof Error
            ? "We could not load the saved add-ons right now. The standard catalog is shown below."
            : "We could not load the saved add-ons right now. The standard catalog is shown below.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadAddons();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (expandedAddonId == null) {
      return;
    }

    if (!addons.some((addon) => addon.id === expandedAddonId)) {
      setExpandedAddonId(null);
    }
  }, [addons, expandedAddonId]);

  const categories = useMemo(
    () => ["All categories", ...Array.from(new Set(addons.map((addon) => addon.category)))],
    [addons],
  );

  const filteredAddons = useMemo(() => {
    const query = search.trim().toLowerCase();

    return addons.filter((addon) => {
      const matchesQuery =
        !query ||
        addon.code.toLowerCase().includes(query) ||
        addon.default_name.toLowerCase().includes(query) ||
        (addon.display_name ?? "").toLowerCase().includes(query) ||
        addon.default_description.toLowerCase().includes(query) ||
        (addon.display_description ?? "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All"
          ? true
          : statusFilter === "Enabled"
            ? addon.is_enabled
            : !addon.is_enabled;

      const matchesCategory =
        categoryFilter === "All categories" || addon.category === categoryFilter;

      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [addons, categoryFilter, search, statusFilter]);

  const totalCount = addons.length;
  const enabledCount = addons.filter((addon) => addon.is_enabled).length;
  const disabledCount = totalCount - enabledCount;
  const averageCurrency = addons[0]?.currency || "LKR";
  const averagePrice = totalCount
    ? addons.reduce((sum, addon) => sum + normalizePrice(addon.price), 0) / totalCount
    : 0;

  if (!canManage) {
    return (
      <AdminPage
        eyebrow="Agency add-ons"
        title="Add-on Management"
        description={`Add-on settings are available to the workspace owner and platform admins for ${selectedTenant?.name ?? "this workspace"}.`}
      >
        <SurfaceCard
          title="Read-only access"
          description={`Your current role (${roleLabel}) can view the workspace, but cannot manage add-ons.`}
        >
          <p className="text-sm leading-6 text-slate-600">
            Only the workspace owner or a platform admin can enable add-ons, change pricing, or edit the customer-facing text.
          </p>
        </SurfaceCard>
      </AdminPage>
    );
  }

  function updateAddon(addonId: number, patch: Partial<AgencyAddonRecord>) {
    setAddons((current) =>
      current.map((addon) =>
        addon.id === addonId ? { ...addon, ...patch } : addon,
      ),
    );
    setRowErrors((current) => ({ ...current, [addonId]: null }));
  }

  async function handleSave(addon: AgencyAddonRecord) {
    const normalizedPrice = normalizePrice(addon.price);
    if (normalizedPrice < 0) {
      setRowErrors((current) => ({ ...current, [addon.id]: "Price must be 0 or higher." }));
      return;
    }

    try {
      setSavingId(addon.id);
      setError(null);
      setSuccessMessage(null);
      setRowErrors((current) => ({ ...current, [addon.id]: null }));

      const payload: AgencyAddonUpdatePayload = {
        is_enabled: Boolean(addon.is_enabled),
        display_name: normalizeText(addon.display_name),
        display_description: normalizeText(addon.display_description),
        price: normalizedPrice,
        currency: (addon.currency || "LKR").toString().toUpperCase(),
        ...(isPlatformAdmin ? { is_active: Boolean(addon.is_active) } : {}),
      };

      const saved = await updateAgencyAddon(addon.id, payload);
      const normalized = normalizeAgencyAddonRecord({
        ...addon,
        ...saved,
      });

      setAddons((current) =>
        current.map((item) => (item.id === addon.id ? normalized : item)),
      );
      setSuccessMessage(`Saved ${normalized.final_name}.`);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? "We could not save that add-on right now. Please try again."
          : "We could not save that add-on right now. Please try again.",
      );
    } finally {
      setSavingId(null);
    }
  }

  async function handleReset(addon: AgencyAddonRecord) {
    try {
      setSavingId(addon.id);
      setError(null);
      setSuccessMessage(null);
      setRowErrors((current) => ({ ...current, [addon.id]: null }));

      const reset = await resetAgencyAddon(addon.id);
      const normalized = normalizeAgencyAddonRecord({
        ...addon,
        ...reset,
      });

      setAddons((current) =>
        current.map((item) => (item.id === addon.id ? normalized : item)),
      );
      setSuccessMessage(`Reset the customer text for ${normalized.default_name}.`);
    } catch (resetError) {
      setError(
        resetError instanceof Error
          ? "We could not reset the add-on right now. Please try again."
          : "We could not reset the add-on right now. Please try again.",
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <AdminPage
      eyebrow="Agency add-ons"
      title="Add-on Management"
      description={
        isPlatformAdmin
          ? "Manage the platform add-on catalog and tenant overrides from one view."
          : `Control the add-ons shown to customers for ${selectedTenant?.name ?? "this workspace"}.`
      }
      actions={
        <>
          <AdminButton
            variant="secondary"
            onClick={() => {
              setSearch("");
              setStatusFilter("All");
              setCategoryFilter("All categories");
            }}
          >
            Clear Filters
          </AdminButton>
          <AdminButton variant="secondary" onClick={() => window.location.reload()}>
            Refresh
          </AdminButton>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Add-ons"
          value={String(totalCount)}
          note="All add-ons in the workspace catalog"
          icon={Package}
          iconTone="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Enabled"
          value={String(enabledCount)}
          note="Visible to customers in booking flow"
          icon={Sparkles}
          iconTone="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Disabled"
          value={String(disabledCount)}
          note="Kept in the catalog but hidden"
          icon={ChevronRight}
          iconTone="bg-slate-50 text-slate-600"
        />
        <StatCard
          label="Average Add-on Price"
          value={formatCurrencyAmount(averagePrice, averageCurrency)}
          note="Average listed price across add-ons"
          icon={BadgeDollarSign}
          iconTone="bg-amber-50 text-amber-600"
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

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
        <SurfaceCard
          title="Workspace add-ons"
          description={
            loading
              ? "Fetching the add-on catalog..."
              : isPlatformAdmin
                ? "Toggle global availability, then set the tenant-facing names and prices."
                : `Edit how the enabled add-ons appear to customers for ${selectedTenant?.name ?? "this workspace"}.`
          }
          actions={
            <>
              <div className="min-w-52">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search by code, name, or description"
                />
              </div>
              <FilterSelect
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as StatusFilter)}
                options={["All", "Enabled", "Disabled"]}
              />
              <FilterSelect
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={categories}
              />
            </>
          }
        >
          {loading ? (
            <LoadingSkeleton />
          ) : filteredAddons.length ? (
            <div className="grid gap-3">
              {filteredAddons.map((addon) => {
                const isSaving = savingId === addon.id;
                const rowError = rowErrors[addon.id];
                const isExpanded = expandedAddonId === addon.id;

                return (
                  <section
                    key={addon.id}
                    className={`overflow-hidden rounded-2xl border transition ${
                      isExpanded
                        ? "border-blue-300 bg-blue-50/30 shadow-[0_12px_32px_rgba(37,99,235,0.06)]"
                        : "border-slate-200 bg-white hover:border-blue-200"
                    }`}
                  >
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-4 text-left sm:px-5"
                      onClick={() =>
                        setExpandedAddonId((current) => (current === addon.id ? null : addon.id))
                      }
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold tracking-tight text-slate-950 sm:text-lg">
                            {addon.default_name}
                          </h3>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                            {addon.category}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                              addon.is_enabled
                                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border border-slate-200 bg-slate-50 text-slate-500"
                            }`}
                          >
                            {addon.is_enabled ? "Enabled" : "Disabled"}
                          </span>
                        </div>

                        <div className="mt-1 truncate text-sm leading-6 text-slate-600">
                          {addon.default_description}
                        </div>
                      </div>
                    </button>

                    {isExpanded ? (
                      <div className="border-t border-slate-200/70 px-4 pb-4 pt-4 sm:px-5">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field
                            label="Agency display name"
                            value={addon.display_name ?? ""}
                            onChange={(value) =>
                              updateAddon(addon.id, {
                                display_name: value,
                              })
                            }
                            placeholder={addon.default_name}
                            disabled={!addon.is_enabled}
                          />
                          <Field
                            label="Price"
                            value={String(addon.price ?? 0)}
                            onChange={(value) =>
                              updateAddon(addon.id, {
                                price: value,
                              })
                            }
                            type="number"
                            min={0}
                            step="0.01"
                            disabled={!addon.is_enabled}
                          />
                          <div className="sm:col-span-2">
                            <Field
                              label="Agency description"
                              value={addon.display_description ?? ""}
                              onChange={(value) =>
                                updateAddon(addon.id, {
                                  display_description: value,
                                })
                              }
                              placeholder={addon.default_description}
                              textarea
                              disabled={!addon.is_enabled}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Currency</label>
                            <FilterSelect
                              value={addon.currency || "LKR"}
                              onChange={(value) =>
                                updateAddon(addon.id, {
                                  currency: value,
                                })
                              }
                              options={["LKR", "USD", "AED"]}
                              disabled={!addon.is_enabled}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">
                              Availability
                            </label>
                            <ToggleButton
                              checked={addon.is_enabled}
                              disabled={isSaving}
                              label={addon.is_enabled ? "Enabled" : "Disabled"}
                              onClick={() =>
                                updateAddon(addon.id, {
                                  is_enabled: !addon.is_enabled,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">
                              Platform status
                            </label>
                            {isPlatformAdmin ? (
                              <ToggleButton
                                checked={addon.is_active}
                                label={addon.is_active ? "Active" : "Inactive"}
                                onClick={() =>
                                  updateAddon(addon.id, {
                                    is_active: !addon.is_active,
                                  })
                                }
                              />
                            ) : (
                              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600">
                                {addon.is_active ? "Globally available" : "Unavailable globally"}
                              </div>
                            )}
                          </div>
                        </div>

                        {rowError ? (
                          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {rowError}
                          </div>
                        ) : null}

                        <div className="mt-4 flex flex-wrap gap-2">
                          <AdminButton
                            variant="secondary"
                            disabled={isSaving}
                            onClick={() => void handleReset(addon)}
                          >
                            {isSaving ? "Resetting..." : "Reset Defaults"}
                          </AdminButton>
                          <AdminButton
                            disabled={isSaving}
                            onClick={() => void handleSave(addon)}
                          >
                            {isSaving ? "Saving..." : "Save"}
                          </AdminButton>
                        </div>
                      </div>
                    ) : null}
                  </section>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No add-ons found"
              description="Try a different search or filter. The predefined catalog will appear once the list is available."
            />
          )}
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
  textarea = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  min?: number;
  step?: string;
  textarea?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={3}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={type}
          min={min}
          step={step}
          disabled={disabled}
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
        />
      )}
    </div>
  );
}

function ToggleButton({
  checked,
  onClick,
  label,
  disabled = false,
}: {
  checked: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-11 items-center justify-between gap-3 rounded-xl border px-4 text-sm font-semibold transition ${
        checked
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-white"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
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
