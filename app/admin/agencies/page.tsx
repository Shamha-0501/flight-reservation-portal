"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Ban,
  CheckCircle2,
  Clock3,
  Eye,
  Loader2,
  MoreVertical,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Users2,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  approveTenant,
  getAllAdminTenants,
  getPendingTenants,
  reactivateTenant,
  rejectTenant,
  suspendTenant,
  type AdminTenant,
} from "@/src/api/routes/admin/tenants";
import {
  AdminButton,
  AdminPage,
  EmptyState,
  LoadingSkeleton,
  StatusBadge,
  SurfaceCard,
  Drawer,
} from "@/src/shared/components/admin/AdminUI";

type TenantAction = "approve" | "reject" | "suspend" | "reactivate";
type ToastTone = "success" | "error" | "info";

type ToastItem = {
  id: number;
  tone: ToastTone;
  title: string;
  message: string;
};

export default function AdminAgenciesPage() {
  const [queueTenants, setQueueTenants] = useState<AdminTenant[]>([]);
  const [allTenants, setAllTenants] = useState<AdminTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionTenantId, setActionTenantId] = useState<number | null>(null);
  const [detailTenant, setDetailTenant] = useState<AdminTenant | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    tenant: AdminTenant;
    action: TenantAction;
  } | null>(null);
  const [openMenuTenantId, setOpenMenuTenantId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastIdRef = useRef(0);

  useEffect(() => {
    void loadTenants();
  }, []);

  useEffect(() => {
    if (!openMenuTenantId) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-agency-menu]")) return;
      setOpenMenuTenantId(null);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMenuTenantId(null);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenuTenantId]);

  useEffect(() => {
    if (!toasts.length) return;

    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id));
      }, 4000),
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [toasts]);

  const summary = useMemo(() => {
    return {
      pending: queueTenants.filter((tenant) => tenant.status === "pending").length,
      suspended: queueTenants.filter((tenant) => tenant.status === "suspended").length,
      rejected: queueTenants.filter((tenant) => tenant.status === "rejected").length,
      total: allTenants.length,
      active: allTenants.filter((tenant) => tenant.status === "active").length,
    };
  }, [allTenants, queueTenants]);

  async function loadTenants() {
    try {
      setLoading(true);
      const [pendingData, allData] = await Promise.all([
        getPendingTenants(),
        getAllAdminTenants(),
      ]);
      setQueueTenants(pendingData);
      setAllTenants(mergeTenants(allData, pendingData));
    } catch (loadError) {
      pushToast("error", "Load failed", loadError instanceof Error ? loadError.message : "Failed to load tenants.");
    } finally {
      setLoading(false);
    }
  }

  function openActionModal(tenant: AdminTenant, action: TenantAction) {
    setPendingAction({ tenant, action });
    setOpenMenuTenantId(null);
  }

  async function confirmPendingAction() {
    if (!pendingAction) return;

    const { tenant, action } = pendingAction;
    setPendingAction(null);

    try {
      setActionTenantId(tenant.id);

      const updatedTenant =
        action === "approve"
          ? await approveTenant(tenant.id)
          : action === "reject"
            ? await rejectTenant(tenant.id)
            : action === "suspend"
              ? await suspendTenant(tenant.id)
              : await reactivateTenant(tenant.id);

      setQueueTenants((current) =>
        current
          .map((item) => (item.id === tenant.id ? updatedTenant : item))
          .filter((tenant) => tenant.status !== "active"),
      );
      setAllTenants((current) =>
        mergeTenants(
          current.map((item) => (item.id === tenant.id ? updatedTenant : item)),
          [updatedTenant],
        ),
      );
      pushToast(
        "success",
        "Agency updated",
        `${updatedTenant.name} updated to ${formatStatus(updatedTenant.status)}.`,
      );
    } catch (actionError) {
      pushToast(
        "error",
        "Update failed",
        actionError instanceof Error ? actionError.message : "Tenant action failed.",
      );
    } finally {
      setActionTenantId(null);
    }
  }

  function pushToast(tone: ToastTone, title: string, message: string) {
    const id = ++toastIdRef.current;
    setToasts((current) => [...current, { id, tone, title, message }]);
  }

  return (
    <AdminPage
      title="Agency approvals"
      description="Review new agency applications, manage active workspaces, and keep approval decisions in one place."
      actions={
        <button
          type="button"
          onClick={() => void loadTenants()}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/15 text-white transition hover:bg-white/25"
          aria-label="Refresh queue"
          title="Refresh queue"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      }
    >
      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        <SummaryCard
          label="Pending"
          value={String(summary.pending)}
          note="Requires review"
          tone="amber"
          icon={Clock3}
        />
        <SummaryCard
          label="Suspended"
          value={String(summary.suspended)}
          note="Account paused"
          tone="rose"
          icon={ShieldAlert}
        />
        <SummaryCard
          label="Rejected"
          value={String(summary.rejected)}
          note="Not approved"
          tone="slate"
          icon={Ban}
        />
        <SummaryCard
          label="All Agencies"
          value={String(summary.total)}
          note="Total in database"
          tone="blue"
          icon={Users2}
        />
        <SummaryCard
          label="Active Agencies"
          value={String(summary.active)}
          note="Currently active"
          tone="emerald"
          icon={CheckCircle2}
        />
      </section>

      <SurfaceCard
        title={<SectionTitle icon={Clock3} label="Approval queue" />}
        description="Pending applications waiting for review."
      >
        {loading ? (
          <LoadingSkeleton />
        ) : queueTenants.length ? (
          <div className="space-y-3">
            {queueTenants.map((tenant) => {
              const isBusy = actionTenantId === tenant.id;
              const contactEmail = asText(tenant.meta?.contact_email);
              const contactPhone = asText(tenant.meta?.contact_phone);
              const country = asText(tenant.meta?.country);

              return (
                <div
                  key={tenant.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-px hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex flex-col gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-sm font-semibold text-amber-700">
                          {getTenantInitials(tenant.name)}
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-lg font-semibold tracking-tight text-slate-950">
                            {tenant.name}
                          </h2>
                          <p className="mt-1 text-xs text-slate-500">
                            Tenant key:{" "}
                            <span className="font-semibold text-slate-900">{tenant.key}</span>
                          </p>
                        </div>
                        <StatusBadge value={formatStatus(tenant.status)} />
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <AgencyMetric label="Contact email" value={contactEmail} />
                        <AgencyMetric label="Contact phone" value={contactPhone} />
                        <AgencyMetric label="Country" value={country} />
                        <AgencyMetric
                          label="Members"
                          value={tenant.member_count != null ? String(tenant.member_count) : "-"}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <AdminButton
                          variant="secondary"
                          disabled={isBusy}
                          onClick={() => setDetailTenant(tenant)}
                        >
                          View details
                        </AdminButton>
                        <AdminButton
                          variant="danger"
                          disabled={isBusy}
                          onClick={() => openActionModal(tenant, "reject")}
                        >
                          {isBusy ? <InlineLoading label="Updating" /> : "Reject"}
                        </AdminButton>
                        <AdminButton
                          variant="primary"
                          disabled={isBusy}
                          onClick={() => openActionModal(tenant, "approve")}
                        >
                          {isBusy ? <InlineLoading label="Updating" /> : "Approve agency"}
                        </AdminButton>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No queued agencies"
            description="There are no pending, suspended, or rejected tenant workspaces waiting for admin action."
          />
        )}
      </SurfaceCard>

      <SurfaceCard
        title={<SectionTitle icon={Users2} label="All agencies" />}
        description="All registered agencies in the platform."
      >
        {loading ? (
          <LoadingSkeleton />
        ) : allTenants.length ? (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {allTenants.map((tenant) => {
              const contactEmail = asText(tenant.meta?.contact_email);
              const contactPhone = asText(tenant.meta?.contact_phone);
              const country = asText(tenant.meta?.country);
              const industry = asText(tenant.meta?.industry);

              return (
                <SurfaceCard key={tenant.id} className="relative h-full overflow-hidden p-4">
                  <div className="absolute right-3 top-3" data-agency-menu>
                    <button
                      type="button"
                      onClick={() => setOpenMenuTenantId((current) => (current === tenant.id ? null : tenant.id))}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-transparent text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                      aria-label={`Open menu for ${tenant.name}`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {openMenuTenantId === tenant.id ? (
                      <div className="absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
                        <MenuItem
                          icon={Eye}
                          label="View details"
                          onClick={() => {
                            setDetailTenant(tenant);
                            setOpenMenuTenantId(null);
                          }}
                        />
                        {tenant.status === "active" ? (
                          <>
                            <MenuItem
                              icon={ShieldAlert}
                              label="Suspend agency"
                              onClick={() => openActionModal(tenant, "suspend")}
                            />
                            <MenuItem
                              icon={Ban}
                              label="Reject agency"
                              tone="danger"
                              onClick={() => openActionModal(tenant, "reject")}
                            />
                          </>
                        ) : tenant.status === "pending" ? (
                          <>
                            <MenuItem
                              icon={CheckCircle2}
                              label="Approve agency"
                              onClick={() => openActionModal(tenant, "approve")}
                            />
                            <MenuItem
                              icon={Ban}
                              label="Reject agency"
                              tone="danger"
                              onClick={() => openActionModal(tenant, "reject")}
                            />
                          </>
                        ) : tenant.status === "suspended" ? (
                          <>
                            <MenuItem
                              icon={RotateCcw}
                              label="Reactivate agency"
                              onClick={() => openActionModal(tenant, "reactivate")}
                            />
                            <MenuItem
                              icon={Ban}
                              label="Reject agency"
                              tone="danger"
                              onClick={() => openActionModal(tenant, "reject")}
                            />
                          </>
                        ) : (
                          <>
                            <MenuItem
                              icon={CheckCircle2}
                              label="Approve agency"
                              onClick={() => openActionModal(tenant, "approve")}
                            />
                            <MenuItem
                              icon={RotateCcw}
                              label="Reactivate agency"
                              onClick={() => openActionModal(tenant, "reactivate")}
                            />
                          </>
                        )}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-start gap-3 pr-10">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-sm font-semibold text-blue-700">
                      {getTenantInitials(tenant.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-base font-semibold tracking-tight text-slate-950">
                          {tenant.name}
                        </h2>
                        <StatusBadge value={formatStatus(tenant.status)} />
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-500">{tenant.key}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <AgencyMetric label="Email" value={contactEmail} compact />
                    <AgencyMetric label="Phone" value={contactPhone} compact />
                    <AgencyMetric label="Country" value={country} compact />
                    <AgencyMetric
                      label="Members"
                      value={tenant.member_count != null ? String(tenant.member_count) : "-"}
                      compact
                    />
                  </div>

                  <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                      Industry
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{industry}</div>
                  </div>
                </SurfaceCard>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No agencies found"
            description="There are no agencies available to display."
          />
        )}
      </SurfaceCard>

      {detailTenant ? (
        <Drawer
          open={Boolean(detailTenant)}
          title={detailTenant.name}
          description="Agency details and metadata."
          onClose={() => setDetailTenant(null)}
        >
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-base font-semibold text-blue-700">
                {getTenantInitials(detailTenant.name)}
              </div>
              <div>
                <StatusBadge value={formatStatus(detailTenant.status)} />
                <p className="mt-2 text-sm font-semibold text-slate-950">{detailTenant.key}</p>
              </div>
            </div>

            <DetailGrid
              items={[
                ["Contact email", asText(detailTenant.meta?.contact_email)],
                ["Contact phone", asText(detailTenant.meta?.contact_phone)],
                ["Country", asText(detailTenant.meta?.country)],
                ["Industry", asText(detailTenant.meta?.industry)],
                ["Timezone", asText(detailTenant.timezone)],
                ["Locale", asText(detailTenant.locale)],
                ["Members", detailTenant.member_count != null ? String(detailTenant.member_count) : "-"],
              ]}
            />

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Description
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {asText(detailTenant.meta?.description)}
              </p>
            </div>
          </div>
        </Drawer>
      ) : null}

      {pendingAction ? (
        <ConfirmModal
          title={
            pendingAction.action === "approve"
              ? "Approve agency"
              : pendingAction.action === "reject"
                ? "Reject agency"
                : pendingAction.action === "suspend"
                  ? "Suspend agency"
                  : "Reactivate agency"
          }
          message={`This will update ${pendingAction.tenant.name} to ${formatStatus(
            pendingAction.action === "approve"
              ? "active"
              : pendingAction.action === "reject"
                ? "rejected"
                : pendingAction.action === "suspend"
                  ? "suspended"
                  : "active",
          )}.`}
          confirmLabel={
            pendingAction.action === "approve"
              ? "Approve agency"
              : pendingAction.action === "reject"
                ? "Reject agency"
                : pendingAction.action === "suspend"
                  ? "Suspend agency"
                  : "Reactivate agency"
          }
          confirmTone={pendingAction.action === "reject" ? "danger" : "primary"}
          loading={actionTenantId === pendingAction.tenant.id}
          onCancel={() => setPendingAction(null)}
          onConfirm={confirmPendingAction}
        />
      ) : null}

      <div className="fixed right-4 top-4 z-[60] flex w-[min(100vw-2rem,22rem)] flex-col gap-3">
        {toasts.map((toast) => (
          <ToastCard
            key={toast.id}
            tone={toast.tone}
            title={toast.title}
            message={toast.message}
            onClose={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
          />
        ))}
      </div>
    </AdminPage>
  );
}

function AgencyMetric({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-slate-50 ${compact ? "p-3" : "p-4"}`}>
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
        {label}
      </div>
      <div className="mt-1.5 break-words text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  note,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  tone: "amber" | "rose" | "slate" | "blue" | "emerald";
  icon: LucideIcon;
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-200 bg-amber-50"
      : tone === "rose"
        ? "border-rose-200 bg-rose-50"
        : tone === "blue"
          ? "border-blue-200 bg-blue-50"
          : tone === "emerald"
            ? "border-emerald-200 bg-emerald-50"
        : "border-slate-200 bg-slate-50";

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">{label}</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</div>
          <div className="mt-1 text-sm text-slate-500">{note}</div>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-slate-700 shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
        <Icon className="h-4 w-4" />
      </span>
      <span>{label}</span>
    </span>
  );
}

function ToastCard({
  tone,
  title,
  message,
  onClose,
}: {
  tone: ToastTone;
  title: string;
  message: string;
  onClose: () => void;
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "error"
        ? "border-rose-200 bg-rose-50 text-rose-800"
        : "border-blue-200 bg-blue-50 text-blue-800";

  return (
    <div className={`rounded-2xl border p-4 shadow-lg ${toneClass}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80">
          {tone === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : tone === "error" ? (
            <Ban className="h-4 w-4" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{title}</div>
          <p className="mt-1 text-sm leading-6">{message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/60"
          aria-label="Dismiss toast"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ConfirmModal({
  title,
  message,
  confirmLabel,
  confirmTone,
  loading,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  confirmTone: "primary" | "danger";
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Confirm action
            </div>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
            aria-label="Close confirmation modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
              confirmTone === "danger"
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  tone = "default",
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  tone?: "default" | "danger";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
        tone === "danger" ? "text-rose-600 hover:bg-rose-50" : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </button>
  );
}

function DetailGrid({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
            {label}
          </div>
          <div className="mt-1.5 break-words text-sm font-semibold text-slate-900">{value}</div>
        </div>
      ))}
    </div>
  );
}

function asText(value: unknown) {
  return typeof value === "string" && value.trim() ? value : "-";
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getTenantInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function mergeTenants(primary: AdminTenant[], secondary: AdminTenant[]) {
  const tenantMap = new Map<number, AdminTenant>();

  for (const tenant of [...primary, ...secondary]) {
    tenantMap.set(tenant.id, {
      ...(tenantMap.get(tenant.id) ?? {}),
      ...tenant,
    });
  }

  return Array.from(tenantMap.values()).sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}
