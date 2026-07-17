import { csrf, http } from "@/src/api/config/http";
import { getActiveAgencies, type TenantAgency } from "@/src/api/routes/tenant/agencies";

export type AdminTenant = {
  id: number;
  key: string;
  name: string;
  status: string;
  is_active?: boolean;
  timezone?: string | null;
  locale?: string | null;
  trial_ends_at?: string | null;
  suspended_at?: string | null;
  created_by_user_id?: number | null;
  member_count?: number | null;
  meta?: {
    contact_email?: string;
    business_email?: string;
    contact_phone?: string;
    business_phone?: string;
    country?: string;
    industry?: string;
    [key: string]: unknown;
  } | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type TenantAction = "approve" | "reject" | "suspend" | "reactivate";

export async function getAllAdminTenants(): Promise<AdminTenant[]> {
  const activeTenants = await getActiveAgencies();

  return activeTenants.map(normalizeAdminTenant);
}

export async function getPendingTenants(): Promise<AdminTenant[]> {
  try {
    const response = await http.get("/api/admin/tenants/pending");
    const tenants = response.data?.data ?? response.data;

    if (!Array.isArray(tenants)) {
      throw new Error("Pending tenants were not returned by the backend.");
    }

    return tenants.map(normalizeAdminTenant);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to load pending tenants."));
  }
}

export async function approveTenant(tenantId: number | string) {
  return mutateTenant(tenantId, "approve");
}

export async function rejectTenant(tenantId: number | string) {
  return mutateTenant(tenantId, "reject");
}

export async function suspendTenant(tenantId: number | string) {
  return mutateTenant(tenantId, "suspend");
}

export async function reactivateTenant(tenantId: number | string) {
  return mutateTenant(tenantId, "reactivate");
}

async function mutateTenant(tenantId: number | string, action: TenantAction): Promise<AdminTenant> {
  try {
    await csrf();
    const response = await http.post(`/api/admin/tenants/${tenantId}/${action}`);
    const tenant = response.data?.tenant ?? response.data?.data ?? response.data;

    if (!tenant || typeof tenant !== "object") {
      throw new Error("Tenant update response was not returned by the backend.");
    }

    return normalizeAdminTenant(tenant as AdminTenant);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, `Failed to ${action} tenant.`));
  }
}

function normalizeAdminTenant(tenant: AdminTenant | TenantAgency): AdminTenant {
  const contactEmail =
    typeof tenant.meta?.contact_email === "string"
      ? tenant.meta.contact_email
      : typeof tenant.meta?.business_email === "string"
        ? tenant.meta.business_email
        : undefined;
  const contactPhone =
    typeof tenant.meta?.contact_phone === "string"
      ? tenant.meta.contact_phone
      : typeof tenant.meta?.business_phone === "string"
        ? tenant.meta.business_phone
        : undefined;

  return {
    ...tenant,
    status: tenant.status ?? "active",
    meta: tenant.meta
      ? {
          ...tenant.meta,
          contact_email: contactEmail,
          contact_phone: contactPhone,
        }
      : tenant.meta,
  };
}

function getApiErrorMessage(error: unknown, fallback: string) {
  const responseError = error as {
    response?: { data?: { message?: string; error?: string } };
  };

  return (
    responseError.response?.data?.message ||
    responseError.response?.data?.error ||
    (error instanceof Error ? error.message : fallback)
  );
}
