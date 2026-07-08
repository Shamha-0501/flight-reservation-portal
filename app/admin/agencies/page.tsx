"use client";

import { useEffect, useMemo, useState } from "react";
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
} from "@/src/shared/components/admin/AdminUI";

type TenantAction = "approve" | "reject" | "suspend" | "reactivate";

export default function AdminAgenciesPage() {
  const [queueTenants, setQueueTenants] = useState<AdminTenant[]>([]);
  const [allTenants, setAllTenants] = useState<AdminTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionTenantId, setActionTenantId] = useState<number | null>(null);

  useEffect(() => {
    void loadTenants();
  }, []);

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
      setError(null);
      const [pendingData, allData] = await Promise.all([
        getPendingTenants(),
        getAllAdminTenants(),
      ]);
      setQueueTenants(pendingData);
      setAllTenants(mergeTenants(allData, pendingData));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load tenants.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(tenantId: number, action: TenantAction) {
    try {
      setActionTenantId(tenantId);
      setError(null);
      setSuccessMessage(null);

      const updatedTenant =
        action === "approve"
          ? await approveTenant(tenantId)
          : action === "reject"
            ? await rejectTenant(tenantId)
            : action === "suspend"
              ? await suspendTenant(tenantId)
              : await reactivateTenant(tenantId);

      setQueueTenants((current) =>
        current
          .map((tenant) => (tenant.id === tenantId ? updatedTenant : tenant))
          .filter((tenant) => tenant.status !== "active"),
      );
      setAllTenants((current) =>
        mergeTenants(
          current.map((tenant) => (tenant.id === tenantId ? updatedTenant : tenant)),
          [updatedTenant],
        ),
      );
      setSuccessMessage(`${updatedTenant.name} updated to ${formatStatus(updatedTenant.status)}.`);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Tenant action failed.");
    } finally {
      setActionTenantId(null);
    }
  }

  return (
    <AdminPage
      title="Agency approvals"
      description="Load pending tenant workspaces from the backend and process approval, rejection, suspension, or reactivation from one queue."
      actions={
        <>
          <AdminButton variant="secondary" onClick={() => void loadTenants()}>
            Refresh Queue
          </AdminButton>
        </>
      }
    >
      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Pending" value={String(summary.pending)} tone="amber" />
        <SummaryCard label="Suspended" value={String(summary.suspended)} tone="rose" />
        <SummaryCard label="Rejected" value={String(summary.rejected)} tone="slate" />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <SummaryCard label="All Agencies" value={String(summary.total)} tone="blue" />
        <SummaryCard label="Active Agencies" value={String(summary.active)} tone="emerald" />
      </section>

      <SurfaceCard
        title="Approval queue"
        description="These tenants come from `/api/admin/tenants/pending` and stay here until their status becomes active."
      >
        {error ? <Message tone="error" message={error} /> : null}
        {successMessage ? <Message tone="success" message={successMessage} /> : null}

        {loading ? (
          <LoadingSkeleton />
        ) : queueTenants.length ? (
          <div className="space-y-4">
            {queueTenants.map((tenant) => {
              const isBusy = actionTenantId === tenant.id;
              const contactEmail = asText(tenant.meta?.contact_email);
              const contactPhone = asText(tenant.meta?.contact_phone);
              const country = asText(tenant.meta?.country);

              return (
                <div
                  key={tenant.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-extrabold tracking-tight text-slate-950">
                          {tenant.name}
                        </h2>
                        <StatusBadge value={formatStatus(tenant.status)} />
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Tenant key: <span className="font-semibold text-slate-900">{tenant.key}</span>
                      </p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <AgencyMetric label="Contact email" value={contactEmail} />
                        <AgencyMetric label="Contact phone" value={contactPhone} />
                        <AgencyMetric label="Country" value={country} />
                        <AgencyMetric
                          label="Members"
                          value={tenant.member_count != null ? String(tenant.member_count) : "-"}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 xl:max-w-64 xl:justify-end">
                      {getTenantActions(tenant.status).map((action) => (
                        <AdminButton
                          key={action}
                          variant={action === "reject" ? "danger" : "secondary"}
                          disabled={isBusy}
                          onClick={() => void handleAction(tenant.id, action)}
                        >
                          {isBusy ? "Updating..." : actionLabel(action)}
                        </AdminButton>
                      ))}
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
        title="All agencies"
        description="This section lists the broader agency database for platform admins. It uses `/api/admin/tenants`, and falls back to active tenants until that endpoint exists."
      >
        {loading ? (
          <LoadingSkeleton />
        ) : allTenants.length ? (
          <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {allTenants.map((tenant) => {
              const contactEmail = asText(tenant.meta?.contact_email);
              const contactPhone = asText(tenant.meta?.contact_phone);
              const country = asText(tenant.meta?.country);
              const industry = asText(tenant.meta?.industry);

              return (
                <SurfaceCard key={tenant.id} className="h-full">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-lg font-extrabold text-blue-700">
                        {tenant.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div>
                        <h2 className="text-lg font-extrabold tracking-tight text-slate-950">
                          {tenant.name}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">{tenant.key}</p>
                      </div>
                    </div>
                    <StatusBadge value={formatStatus(tenant.status)} />
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <AgencyMetric label="Email" value={contactEmail} />
                    <AgencyMetric label="Phone" value={contactPhone} />
                    <AgencyMetric label="Country" value={country} />
                    <AgencyMetric
                      label="Members"
                      value={tenant.member_count != null ? String(tenant.member_count) : "-"}
                    />
                  </div>

                  <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Industry
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{industry}</div>
                  </div>
                </SurfaceCard>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No agencies found"
            description="The admin agency list endpoint returned no tenants."
          />
        )}
      </SurfaceCard>
    </AdminPage>
  );
}

function AgencyMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "amber" | "rose" | "slate" | "blue" | "emerald";
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
    <div className={`rounded-2xl border p-5 shadow-sm ${toneClass}`}>
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">{value}</div>
    </div>
  );
}

function Message({ tone, message }: { tone: "success" | "error"; message: string }) {
  return (
    <div
      className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-medium ${
        tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-rose-200 bg-rose-50 text-rose-700"
      }`}
    >
      {message}
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

function actionLabel(action: TenantAction) {
  if (action === "approve") return "Approve";
  if (action === "reject") return "Reject";
  if (action === "suspend") return "Suspend";
  return "Reactivate";
}

function getTenantActions(status: string): TenantAction[] {
  switch (status) {
    case "pending":
      return ["approve", "reject", "suspend"];
    case "suspended":
      return ["reactivate", "reject"];
    case "rejected":
      return ["approve", "reactivate"];
    default:
      return ["suspend"];
  }
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
