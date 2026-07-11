import { csrf, http } from "@/src/api/config/http";

export type UpdateProfilePayload = {
  name: string;
  email: string;
  phone?: string | null;
  country?: string | null;
  city?: string | null;
  postal_code?: string | null;
  address?: string | null;
};

type ProfileResponse = {
  ok?: boolean;
  message?: string;
  user?: unknown;
};

export async function updateMyProfile(payload: UpdateProfilePayload) {
  try {
    await csrf();
    const response = await http.patch<ProfileResponse>("/api/me/profile", payload);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to save profile."));
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
