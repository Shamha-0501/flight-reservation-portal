import { csrf, http } from "@/src/api/config/http";

export type TenantMember = {
  id: number;
  tenant_id: number;
  user_id: number;
  name: string | null;
  email: string | null;
  role: string | null;
  role_key: string | null;
  status: string;
  invited_by_user_id?: number | null;
  invited_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
};

export type TenantInvitation = {
  id: number;
  tenant_id: number;
  email: string;
  role: string | null;
  role_key: string | null;
  status: string;
  expires_at?: string | null;
  accepted_at?: string | null;
  revoked_at?: string | null;
  invited_by_user_id?: number | null;
  invited_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type TenantMembersPayload = {
  members: TenantMember[];
  invites: TenantInvitation[];
};

export async function getTenantMembers(tenantKey: string): Promise<TenantMembersPayload> {
  try {
    const response = await http.get("/api/tenants/members", {
      params: { tenantKey },
    });
    const payload = response.data?.data ?? response.data;

    if (!payload || typeof payload !== "object") {
      throw new Error("Tenant member payload was not returned by the backend.");
    }

    return {
      members: Array.isArray(payload.members) ? payload.members : [],
      invites: Array.isArray(payload.invites) ? payload.invites : [],
    };
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to load tenant members."));
  }
}

export async function inviteTenantMember(payload: {
  tenantKey: string;
  email: string;
  role_key: string;
}) {
  try {
    await csrf();
    const response = await http.post("/api/tenants/members/invite", payload);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to invite tenant member."));
  }
}

export async function changeTenantMemberRole(
  memberId: number | string,
  payload: { tenantKey: string; role_key: string },
) {
  try {
    await csrf();
    const response = await http.patch(`/api/tenants/members/${memberId}/role`, payload);
    return response.data?.member ?? response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to update member role."));
  }
}

export async function removeTenantMember(memberId: number | string, tenantKey: string) {
  try {
    await csrf();
    await http.delete(`/api/tenants/members/${memberId}`, {
      data: { tenantKey },
    });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to remove tenant member."));
  }
}

export async function resendTenantInvitation(
  invitationId: number | string,
  tenantKey: string,
) {
  try {
    await csrf();
    const response = await http.post(`/api/tenants/invitations/${invitationId}/resend`, {
      tenantKey,
    });
    return response.data?.invitation ?? response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to resend invitation."));
  }
}

export async function acceptTenantInvitation(payload: {
  token: string;
  name?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
}) {
  try {
    await csrf();
    const response = await http.post("/api/tenant-invitations/accept", payload);
    return response.data;
  } catch (error) {
    throw error;
  }
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
