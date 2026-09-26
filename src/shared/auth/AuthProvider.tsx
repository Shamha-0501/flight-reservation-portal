"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  canManageAgencies,
  canManageTenantMembership,
  canManageTenantSettings,
  canManageTenantUsers,
  canAccessWorkspace,
  formatRoleLabel,
  getPostLoginAccess,
  getPrimaryTenant,
  isAgencyManagerRole,
  isAgencyStaffRole,
  isCustomerRole,
  isPlatformAdminRole,
  isTenantAdminRole,
  isTenantOwnerRole,
  isTenantWorkspaceRole,
  resolveUserRole,
  type AuthTenant,
  type AuthUser,
} from "@/src/shared/auth/authModel";
import { useAppSelector } from "@/src/shared/redux/store/hooks";

type AuthContextValue = {
  user: AuthUser | null;
  tenants: AuthTenant[];
  selectedTenant: AuthTenant | null;
  role: string | null;
  roleLabel: string;
  isCustomer: boolean;
  isAdmin: boolean;
  isPlatformAdmin: boolean;
  isTenantAdmin: boolean;
  isTenantOwner: boolean;
  isTenantWorkspaceRole: boolean;
  isAgencyManager: boolean;
  isAgencyStaff: boolean;
  canManageAgencies: boolean;
  canManageTenantUsers: boolean;
  canManageTenantMembership: boolean;
  canManageTenantSettings: boolean;
  canAccessWorkspace: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  access: ReturnType<typeof getPostLoginAccess>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, authStatus, requestStatus, meChecked } = useAppSelector(
    (state) => state.auth,
  );

  const tenants = user?.tenants ?? [];
  const selectedTenant = getPrimaryTenant(user);
  const role = resolveUserRole(user);
  const isCustomer = isCustomerRole(role);
  const isPlatformAdmin = isPlatformAdminRole(role);
  const isTenantAdmin = isTenantAdminRole(role);
  const isTenantOwner = isTenantOwnerRole(role);
  const isTenantWorkspaceRoleValue = isTenantWorkspaceRole(role);
  const isAgencyManager = isAgencyManagerRole(role);
  const isAgencyStaff = isAgencyStaffRole(role);
  const access = getPostLoginAccess(user);

  const value: AuthContextValue = {
    user,
    tenants,
    selectedTenant,
    role,
    roleLabel: formatRoleLabel(role),
    isCustomer,
    isAdmin: access.kind === "platform" || access.kind === "tenant",
    isPlatformAdmin,
    isTenantAdmin,
    isTenantOwner,
    isTenantWorkspaceRole: isTenantWorkspaceRoleValue,
    isAgencyManager,
    isAgencyStaff,
    canManageAgencies: canManageAgencies(role),
    canManageTenantUsers: canManageTenantUsers(role),
    canManageTenantMembership: canManageTenantMembership(role),
    canManageTenantSettings: canManageTenantSettings(role),
    canAccessWorkspace: canAccessWorkspace(role),
    loading:
      authStatus === "unknown" ||
      !meChecked ||
      (requestStatus === "loading" && authStatus !== "authenticated"),
    isAuthenticated: authStatus === "authenticated",
    access,
  };
  
  // makes all those auth values available to every component underneath AuthProvider
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

/**
 * Provides authentication and authorization data to the application.
 *
 * It reads the current auth state from Redux, resolves the user's role,
 * tenant information, access type, and permissions, then exposes them
 * through `AuthContext`.
 *
 * Components can use the `useAuth()` hook to easily access values such as
 * the current user, selected tenant, role, authentication status,
 * loading state, and permission checks.
 */
