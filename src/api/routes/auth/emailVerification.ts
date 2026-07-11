import { csrf, http } from "../../config/http";

type SendVerificationCodeResponse = {
  ok?: boolean;
  message?: string;
  requires_login?: boolean;
  account_exists?: boolean;
  account_state?: string;
};

type EmailBookingStatusResponse = {
  ok?: boolean;
  message?: string;
  requires_login?: boolean;
  account_exists?: boolean;
  account_state?: string | null;
};

type VerifyEmailCodeResponse = {
  ok?: boolean;
  verified?: boolean;
  message?: string;
};

type ResendVerificationCodeResponse = {
  ok?: boolean;
  message?: string;
  expires_in?: number;
};

export async function sendEmailVerificationCode(payload: {
  email: string;
  name?: string;
}): Promise<SendVerificationCodeResponse> {
  try {
    await csrf();
    const response = await http.post("/auth/send-verification-code", payload);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to send verification code."));
  }
}

export async function verifyEmailWithCode(payload: {
  email: string;
  code: string;
}): Promise<VerifyEmailCodeResponse> {
  try {
    await csrf();
    const response = await http.post("/auth/verify-email-code", payload);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to verify email code."));
  }
}

export async function resendVerificationCode(payload: {
  email: string;
  name?: string;
}): Promise<ResendVerificationCodeResponse> {
  try {
    await csrf();
    // Use send-verification-code so resend also sends numeric OTP code,
    // not the magic-link email template.
    const response = await http.post("/auth/send-verification-code", payload);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to resend verification code."));
  }
}

export async function getEmailBookingStatus(payload: {
  email: string;
}): Promise<EmailBookingStatusResponse> {
  try {
    await csrf();
    const response = await http.post("/auth/email-booking-status", payload);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to check email account status.")
    );
  }
}

function getApiErrorMessage(error: unknown, fallback: string) {
  const responseError = error as {
    response?: {
      data?: {
        message?: string;
        error?: string;
        errors?: Record<string, string[]>;
        code?: string;
      };
    };
  };

  const firstValidationError = responseError.response?.data?.errors
    ? Object.values(responseError.response.data.errors)[0]?.[0]
    : undefined;

  return (
    responseError.response?.data?.message ||
    responseError.response?.data?.error ||
    firstValidationError ||
    (error instanceof Error ? error.message : fallback)
  );
}
