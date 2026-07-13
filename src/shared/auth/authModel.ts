export type AuthTenant = {
  id: number;
  key: string;
  name: string;
  role: string;
  role_key?: string | null;
  status?: string | null;
};

export type AuthUser = {
  id?: number;
  name: string;
  email: string;
  role?: string | null;
  phone?: string | null;
  country?: string | null;
  city?: string | null;
  postal_code?: string | null;
  address?: string | null;
  tenant_id?: number | null;
  tenant_key?: string | null;
  tenants: AuthTenant[];
};

export type AuthAlertTone = "info" | "error";

export type AuthAccessResult =
  | { kind: "customer"; destination: "/bookings" }
  | { kind: "platform"; destination: "/admin/dashboard" }
  | { kind: "tenant"; destination: "/admin/dashboard" }
  | { kind: "blocked"; tone: AuthAlertTone; message: string }
  | { kind: "guest"; destination: "/login" };

const CUSTOMER_ROLES = new Set(["customer"]);
const PLATFORM_ROLES = new Set(["system_developer", "super_admin", "admin"]);
const TENANT_LEADERSHIP_ROLES = new Set(["tenant_owner", "tenant_admin", "agency_owner"]);
const TENANT_OPERATION_ROLES = new Set([
  "tenant_owner",
  "tenant_admin",
  "agency_manager",
  "agency_staff",
  "agency_owner",
]);

export function getPrimaryTenant(user: AuthUser | null | undefined) {
  return user?.tenants?.[0] ?? null;
}

export function normalizeRoleKey(value?: string | null) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function resolveUserRole(user: AuthUser | null | undefined) {
  if (!user) return null;

  const directRole = normalizeRoleKey(user.role);
  if (directRole) return directRole;

  const tenant = getPrimaryTenant(user);
  const tenantRole = normalizeRoleKey(tenant?.role_key || tenant?.role);
  if (tenantRole) return tenantRole;

  if (!tenant && user.email) return "customer";
  return null;
}

export function isCustomerRole(role: string | null | undefined) {
  return Boolean(role && CUSTOMER_ROLES.has(role));
}

export function isPlatformAdminRole(role: string | null | undefined) {
  return Boolean(role && PLATFORM_ROLES.has(role));
}

export function isTenantAdminRole(role: string | null | undefined) {
  return Boolean(role && TENANT_LEADERSHIP_ROLES.has(role));
}

export function isTenantWorkspaceRole(role: string | null | undefined) {
  return Boolean(role && TENANT_OPERATION_ROLES.has(role));
}

export function isTenantOwnerRole(role: string | null | undefined) {
  return role === "tenant_owner";
}

export function isAgencyManagerRole(role: string | null | undefined) {
  return role === "agency_manager";
}

export function isAgencyStaffRole(role: string | null | undefined) {
  return role === "agency_staff";
}

export function canManageAgencies(role: string | null | undefined) {
  return isPlatformAdminRole(role);
}

export function canManageTenantUsers(role: string | null | undefined) {
  return isTenantAdminRole(role);
}

export function canManageTenantMembership(role: string | null | undefined) {
  return isTenantOwnerRole(role);
}

export function canManageTenantSettings(role: string | null | undefined) {
  return isTenantOwnerRole(role) || isPlatformAdminRole(role);
}

export function canAccessWorkspace(role: string | null | undefined) {
  return isPlatformAdminRole(role) || isTenantWorkspaceRole(role) || isCustomerRole(role);
}

export function formatRoleLabel(role: string | null | undefined) {
  if (!role) return "User";

  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getTenantAccessMessage(status?: string | null) {
  switch (normalizeRoleKey(status)) {
    case "pending":
      return {
        tone: "info" as const,
        message:
          "Your agency account is pending approval. You can access the workspace after an admin approves your agency.",
      };
    case "suspended":
      return {
        tone: "error" as const,
        message: "Your agency account is suspended. Please contact the platform administrator.",
      };
    case "rejected":
    case "archived":
      return {
        tone: "error" as const,
        message: "Your agency account is not allowed to access the workspace. Please contact support.",
      };
    default:
      return null;
  }
}

export function getPostLoginAccess(user: AuthUser | null | undefined): AuthAccessResult {
  if (!user) {
    return { kind: "guest", destination: "/login" };
  }

  const role = resolveUserRole(user);
  if (isCustomerRole(role)) {
    return { kind: "customer", destination: "/bookings" };
  }

  if (isPlatformAdminRole(role)) {
    return { kind: "platform", destination: "/admin/dashboard" };
  }

  if (isTenantWorkspaceRole(role)) {
    const tenant = getPrimaryTenant(user);
    const blocked = getTenantAccessMessage(tenant?.status);
    if (blocked) {
      return { kind: "blocked", ...blocked };
    }

    return { kind: "tenant", destination: "/admin/dashboard" };
  }

  return { kind: "customer", destination: "/bookings" };
}
