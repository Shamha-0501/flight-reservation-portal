"use client";

import { useEffect, useMemo, useState } from "react";
import {
  changeTenantMemberRole,
  getTenantMembers,
  inviteTenantMember,
  removeTenantMember,
  resendTenantInvitation,
  type TenantInvitation,
  type TenantMember,
} from "@/src/api/routes/tenant/members";
import { useAuth } from "@/src/shared/auth/AuthProvider";
import {
  AdminButton,
  AdminPage,
  EmptyState,
  FilterSelect,
  LoadingSkeleton,
  StatusBadge,
  SurfaceCard,
  TableShell,
} from "@/src/shared/components/admin/AdminUI";

const roleOptions = [
  "tenant_owner",
  "tenant_admin",
  "agency_manager",
  "agency_staff",
];

export default function AdminUsersPage() {
  const { selectedTenant, roleLabel, canManageTenantMembership } = useAuth();
  const tenantKey = selectedTenant?.key ?? "";
  const tenantName = selectedTenant?.name ?? "this workspace";
  const [filter, setFilter] = useState<string>("All");
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [invites, setInvites] = useState<TenantInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("agency_staff");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [draftRoles, setDraftRoles] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!tenantKey) {
      setMembers([]);
      setInvites([]);
      setLoading(false);
      return;
    }

    void loadMembers(tenantKey);
  }, [tenantKey]);

  const filteredMembers = useMemo(() => {
    if (filter === "All") return members;
    return members.filter((member) => normalizeStatus(member.status) === filter);
  }, [filter, members]);

  async function loadMembers(currentTenantKey: string) {
    try {
      setLoading(true);
      setError(null);
      const data = await getTenantMembers(currentTenantKey);
      setMembers(data.members);
      setInvites(data.invites);
      setDraftRoles(
        Object.fromEntries(
          data.members.map((member) => [member.id, member.role_key ?? "agency_staff"]),
        ),
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load workspace users.");
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite() {
    if (!tenantKey || !email.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      await inviteTenantMember({
        tenantKey,
        email: email.trim(),
        role_key: role,
      });
      setEmail("");
      setSuccessMessage("Invitation sent successfully.");
      await loadMembers(tenantKey);
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "Failed to send invitation.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRoleSave(member: TenantMember) {
    if (!tenantKey) return;

    try {
      setActiveRowId(`member-role-${member.id}`);
      setError(null);
      setSuccessMessage(null);
      await changeTenantMemberRole(member.id, {
        tenantKey,
        role_key: draftRoles[member.id] ?? member.role_key ?? "agency_staff",
      });
      setSuccessMessage(`Updated role for ${member.name ?? member.email ?? "member"}.`);
      await loadMembers(tenantKey);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Failed to update role.");
    } finally {
      setActiveRowId(null);
    }
  }

  async function handleRemove(member: TenantMember) {
    if (!tenantKey) return;

    try {
      setActiveRowId(`member-remove-${member.id}`);
      setError(null);
      setSuccessMessage(null);
      await removeTenantMember(member.id, tenantKey);
      setSuccessMessage(`Removed ${member.name ?? member.email ?? "member"} from the workspace.`);
      await loadMembers(tenantKey);
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Failed to remove member.");
    } finally {
      setActiveRowId(null);
    }
  }

  async function handleResend(invitation: TenantInvitation) {
    if (!tenantKey) return;

    try {
      setActiveRowId(`invite-resend-${invitation.id}`);
      setError(null);
      setSuccessMessage(null);
      await resendTenantInvitation(invitation.id, tenantKey);
      setSuccessMessage(`Invitation resent to ${invitation.email}.`);
      await loadMembers(tenantKey);
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : "Failed to resend invitation.");
    } finally {
      setActiveRowId(null);
    }
  }

  return (
    <AdminPage
      eyebrow="Tenant workspace"
      title="Team Members"
      description="Invite tenant owners, admins, managers, and staff to work inside this agency workspace."
      actions={
        <>
          <AdminButton
            variant="secondary"
            onClick={() => {
              if (tenantKey) void loadMembers(tenantKey);
            }}
          >
            Refresh Team
          </AdminButton>
          <AdminButton disabled={!canManageTenantMembership || submitting} onClick={() => void handleInvite()}>
            {submitting ? "Sending..." : "Invite Member"}
          </AdminButton>
        </>
      }
    >
      {error ? <Message tone="error" message={error} /> : null}
      {successMessage ? <Message tone="success" message={successMessage} /> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.85fr)]">
        <SurfaceCard
          title="Workspace members"
          description={`Current team access for ${tenantName}. ${roleLabel} can review the list below.`}
          actions={
            <FilterSelect
              value={filter}
              onChange={setFilter}
              options={["All", "Active", "Inactive", "Suspended"]}
            />
          }
        >
          {loading ? (
            <LoadingSkeleton />
          ) : filteredMembers.length ? (
            <TableShell columns={["Name", "Email", "Role", "Status", "Invited By", "Actions"]}>
              {filteredMembers.map((member) => {
                const isRoleSaving = activeRowId === `member-role-${member.id}`;
                const isRemoving = activeRowId === `member-remove-${member.id}`;
                const isLocked = !canManageTenantMembership || isRoleSaving || isRemoving;

                return (
                  <tr key={member.id}>
                    <td className="px-4 py-4">
                      <div className="text-sm font-semibold text-slate-950">
                        {member.name ?? "Unnamed member"}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">{member.email ?? "-"}</td>
                    <td className="px-4 py-4">
                      <div className="flex min-w-52 items-center gap-2">
                        <div className="min-w-[180px]">
                          <FilterSelect
                          value={draftRoles[member.id] ?? member.role_key ?? "agency_staff"}
                          onChange={(value) =>
                            setDraftRoles((current) => ({
                              ...current,
                              [member.id]: value,
                            }))
                          }
                          options={[...roleOptions]}
                          disabled={!canManageTenantMembership}
                          />
                        </div>
                        {canManageTenantMembership ? (
                          <AdminButton
                            variant="secondary"
                            disabled={isLocked || (draftRoles[member.id] ?? member.role_key) === member.role_key}
                            onClick={() => void handleRoleSave(member)}
                          >
                            {isRoleSaving ? "Saving..." : "Save"}
                          </AdminButton>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge value={normalizeStatus(member.status)} />
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">{member.invited_by ?? "-"}</td>
                    <td className="px-4 py-4">
                      {canManageTenantMembership ? (
                        <AdminButton
                          variant="danger"
                          disabled={isLocked}
                          onClick={() => void handleRemove(member)}
                        >
                          {isRemoving ? "Removing..." : "Remove"}
                        </AdminButton>
                      ) : (
                        <span className="text-sm font-semibold text-slate-400">View only</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </TableShell>
          ) : (
            <EmptyState
              title="No members found"
              description="This tenant does not have any active workspace members yet."
            />
          )}
        </SurfaceCard>

        <div className="space-y-5">
          {canManageTenantMembership ? (
            <SurfaceCard title="Invite member" description="Create access for a new team member in this tenant workspace.">
              <div className="space-y-4">
                <Field
                  label="Email address"
                  value={email}
                  onChange={setEmail}
                  placeholder="member@example.com"
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Role</label>
                  <FilterSelect value={role} onChange={setRole} options={[...roleOptions]} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Workspace access</label>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    {role === "tenant_owner" || role === "tenant_admin"
                      ? "Can manage users, bookings, and workspace settings."
                      : role === "agency_manager"
                        ? "Can manage bookings, cancellations, and reschedules."
                        : "Can handle day-to-day operations inside the workspace."}
                  </div>
                </div>
                <AdminButton disabled={!canManageTenantMembership || submitting || !email.trim()} onClick={() => void handleInvite()}>
                  {submitting ? "Sending..." : "Send Invite"}
                </AdminButton>
              </div>
            </SurfaceCard>
          ) : (
            <SurfaceCard title="Invite member" description="Team membership changes are restricted in this workspace.">
              <p className="text-sm leading-6 text-slate-600">
                Tenant admins can view tenant members, but only the tenant owner can invite, remove, or change roles.
              </p>
            </SurfaceCard>
          )}

          <SurfaceCard title="Pending invitations" description="Outstanding invitations from the backend invite endpoint.">
            {loading ? (
              <LoadingSkeleton />
            ) : invites.length ? (
              <div className="space-y-3">
                {invites.map((invitation) => {
                  const isBusy = activeRowId === `invite-resend-${invitation.id}`;

                  return (
                    <div
                      key={invitation.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="text-sm font-semibold text-slate-950">{invitation.email}</div>
                          <div className="mt-1 text-sm text-slate-600">
                            {invitation.role ?? invitation.role_key ?? "Member"} ·{" "}
                            {normalizeStatus(invitation.status)}
                          </div>
                          <div className="mt-1 text-xs font-medium text-slate-500">
                            Expires {formatDate(invitation.expires_at)}
                          </div>
                        </div>
                        {canManageTenantMembership ? (
                          <AdminButton
                            variant="secondary"
                            disabled={!canManageTenantMembership || isBusy}
                            onClick={() => void handleResend(invitation)}
                          >
                            {isBusy ? "Resending..." : "Resend"}
                          </AdminButton>
                        ) : (
                          <span className="text-sm font-semibold text-slate-400">View only</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="No pending invitations"
                description="All workspace invitations have been accepted or there are no invites yet."
              />
            )}
          </SurfaceCard>

          <SurfaceCard title="Access policy" description="Role rules for this workspace.">
            <div className="space-y-3 text-sm leading-6 text-slate-600">
              <p>
                Tenant owners manage invites, removals, and role changes.
              </p>
              <p>
                Tenant admins can review members in the workspace, but cannot make membership changes.
              </p>
              <p>
                Every invite should create a pending membership until the user accepts it.
              </p>
            </div>
          </SurfaceCard>
        </div>
      </div>
    </AdminPage>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
      />
    </div>
  );
}

function Message({ tone, message }: { tone: "success" | "error"; message: string }) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
        tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-rose-200 bg-rose-50 text-rose-700"
      }`}
    >
      {message}
    </div>
  );
}

function normalizeStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
