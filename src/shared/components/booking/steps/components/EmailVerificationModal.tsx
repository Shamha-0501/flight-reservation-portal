"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getEmailBookingStatus,
  resendVerificationCode,
  sendEmailVerificationCode,
  verifyEmailWithCode,
} from "@/src/api/routes/auth/emailVerification";

type EmailVerificationModalProps = {
  open: boolean;
  onClose: () => void;
  onVerified: (email: string) => void;
  initialEmail?: string;
  onLoginRequired?: (email: string, message?: string) => void;
};

export default function EmailVerificationModal({
  open,
  onClose,
  onVerified,
  initialEmail = "",
  onLoginRequired,
}: EmailVerificationModalProps) {
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [phase, setPhase] = useState<
    "email" | "otp" | "sending" | "verifying" | "resending"
  >("email");
  const [error, setError] = useState<string | null>(null);
  const [loginRequiredMessage, setLoginRequiredMessage] = useState<string | null>(
    null
  );
  const [checkingEmailStatus, setCheckingEmailStatus] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const canSend = useMemo(
    () => /^\S+@\S+\.\S+$/.test(email.trim()),
    [email]
  );

  useEffect(() => {
    if (!open) return;
    if (initialEmail) {
      setEmail(initialEmail);
    }
    setError(null);
    setLoginRequiredMessage(null);
    setPhase("email");
  }, [initialEmail, open]);

  if (!open) return null;

  const startCooldown = () => {
    let remaining = 30;
    setResendCooldown(remaining);
    const timer = window.setInterval(() => {
      remaining -= 1;
      setResendCooldown(remaining);
      if (remaining <= 0) {
        window.clearInterval(timer);
      }
    }, 1000);
  };

  const checkEmailStatus = async () => {
    if (!canSend) return;

    setCheckingEmailStatus(true);
    try {
      const result = await getEmailBookingStatus({ email: email.trim() });
      if (
        result?.requires_login ||
        result?.account_exists ||
        result?.account_state === "account"
      ) {
        setLoginRequiredMessage(
          result?.message ||
            "This email is already registered. Please sign in to continue booking."
        );
        setError(null);
      } else {
        setLoginRequiredMessage(null);
      }
    } catch {
      // Keep UX non-blocking; send flow still handles backend validation.
    } finally {
      setCheckingEmailStatus(false);
    }
  };

  const handleSendCode = async () => {
    setError(null);
    if (!canSend) {
      setError("Enter a valid email address.");
      return;
    }
    if (loginRequiredMessage) {
      return;
    }

    setPhase("sending");
    try {
      const normalizedEmail = email.trim();
      const result = await sendEmailVerificationCode({ email: normalizedEmail });

      if (
        result?.requires_login ||
        result?.account_exists ||
        result?.account_state === "account"
      ) {
        const message =
          result?.message ||
          "This email is already registered. Please sign in to continue booking.";
        setPhase("email");
        setLoginRequiredMessage(message);
        return;
      }

      setPhase("otp");
      startCooldown();
    } catch (sendError: unknown) {
      const message =
        sendError instanceof Error
          ? sendError.message
          : "Failed to send verification code.";
      const normalized = message.toLowerCase();
      const shouldRequireLogin =
        normalized.includes("already registered") ||
        normalized.includes("already exists") ||
        normalized.includes("sign in") ||
        normalized.includes("log in");

      setPhase("email");
      setError(message);

      if (shouldRequireLogin) {
        setLoginRequiredMessage(message);
      }
    }
  };

  const handleVerify = async () => {
    setError(null);
    if (!/^\d{8}$/.test(otp.trim())) {
      setError("Enter the 8-digit verification code.");
      return;
    }

    setPhase("verifying");
    try {
      const result = await verifyEmailWithCode({
        email: email.trim(),
        code: otp.trim(),
      });

      if (!result?.ok) {
        throw new Error(result?.message || "Verification failed.");
      }

      setPhase("otp");
      onVerified(email.trim());
      onClose();
    } catch (verifyError: unknown) {
      setPhase("otp");
      setError(
        verifyError instanceof Error
          ? verifyError.message
          : "Failed to verify code."
      );
    }
  };

  const handleResendCode = async () => {
    setError(null);
    if (resendCooldown > 0) return;

    setPhase("resending");
    try {
      await resendVerificationCode({ email: email.trim() });
      setPhase("otp");
      startCooldown();
    } catch (resendError: unknown) {
      setPhase("otp");
      setError(
        resendError instanceof Error
          ? resendError.message
          : "Failed to resend verification code."
      );
    }
  };

 return (
  <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 backdrop-blur-[2px] px-4">
    <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
      
      {/* TOP ACCENT */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-300" />

      {/* HEADER */}
      <div className="border-b border-slate-100 bg-gradient-to-br from-blue-50/70 via-white to-white px-6 py-5">
        <div className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
          Secure verification
        </div>

        <h3 className="mt-4 text-[28px] font-extrabold leading-tight tracking-tight text-slate-950">
          Verify your email
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          We’ll use this verified email for tickets, cancellations,
          refunds and booking management.
        </p>
      </div>

      {/* BODY */}
      <div className="space-y-5 px-6 py-6">
        
        {/* EMAIL */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800">
            Email address
          </label>

          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (loginRequiredMessage) {
                  setLoginRequiredMessage(null);
                }
              }}
              onBlur={checkEmailStatus}
              disabled={phase !== "email"}
              placeholder="you@example.com"
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
            />

            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <path d="M4 6h16v12H4z" />
                <path d="m4 7 8 6 8-6" />
              </svg>
            </div>
          </div>
        </div>

        {checkingEmailStatus ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Checking account status...
          </div>
        ) : null}

        {loginRequiredMessage ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <div>{loginRequiredMessage}</div>
            <button
              type="button"
              onClick={() => onLoginRequired?.(email.trim(), loginRequiredMessage)}
              className="mt-3 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Login to continue
            </button>
          </div>
        ) : null}

        {/* OTP */}
        {phase !== "email" && (
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Verification code
            </label>

            <input
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              value={otp}
              onChange={(event) =>
                setOtp(event.target.value.replace(/\D/g, ""))
              }
              placeholder="12345678"
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-center text-lg tracking-[0.35em] text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Didn&apos;t receive the code?
              </div>

              <button
                type="button"
                disabled={resendCooldown > 0}
                onClick={handleResendCode}
                className="text-xs font-semibold text-blue-600 transition hover:text-blue-700 disabled:text-slate-400"
              >
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : "Resend code"}
              </button>
            </div>
          </div>
        )}

        {/* ERROR */}
        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : null}

        {/* TRUST BOX */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
          <div className="flex gap-3">
            <div className="mt-0.5 text-blue-600">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <path d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>

            <div>
              <div className="text-sm font-semibold text-slate-900">
                Secure booking verification
              </div>

              <div className="mt-1 text-xs leading-5 text-slate-600">
                Your email is verified securely before payment and booking confirmation.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Close
        </button>

        {phase === "email" || phase === "sending" ? (
          <button
            type="button"
            onClick={handleSendCode}
            disabled={phase === "sending" || Boolean(loginRequiredMessage)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(37,99,235,0.28)] transition hover:translate-y-[-1px] hover:shadow-[0_12px_28px_rgba(37,99,235,0.34)]"
          >
            {phase === "sending" ? "Sending..." : "Send code"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleVerify}
            disabled={phase === "verifying"}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(37,99,235,0.28)] transition hover:translate-y-[-1px] hover:shadow-[0_12px_28px_rgba(37,99,235,0.34)] disabled:opacity-60"
          >
            {phase === "verifying"
              ? "Verifying..."
              : "Verify & continue"}
          </button>
        )}
      </div>
    </div>
  </div>
);
}
