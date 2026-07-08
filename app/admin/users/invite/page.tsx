"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/src/shared/auth/AuthProvider";
import { acceptTenantInvitation } from "@/src/api/routes/tenant/members";
import { authMe, logout } from "@/src/shared/redux/store/authSlice";
import { useAppDispatch } from "@/src/shared/redux/store/hooks";
import {
  AuthAlert,
  AuthCardTitle,
  AuthField,
  AuthInput,
  AuthScaffold,
  AuthSubmit,
} from "@/src/shared/components/auth/AuthScaffold";

type FormState = {
  name: string;
  password: string;
  password_confirmation: string;
};

const initialState: FormState = {
  name: "",
  password: "",
  password_confirmation: "",
};

type ApiErrors = Record<string, string[]>;

export default function TenantInvitationAcceptPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAuth();

  const token = searchParams.get("token")?.trim() ?? "";
  const invitedEmail = searchParams.get("email")?.trim() ?? "";
  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ApiErrors>({});
  const [message, setMessage] = useState<{
    tone: "error" | "success" | "info";
    text: string;
  } | null>(null);

  const signedInWithDifferentEmail = useMemo(() => {
    if (!isAuthenticated || !user?.email || !invitedEmail) return false;
    return user.email.toLowerCase() !== invitedEmail.toLowerCase();
  }, [invitedEmail, isAuthenticated, user?.email]);

  useEffect(() => {
    setFieldErrors({});
    setMessage(null);
  }, [form.name, form.password, form.password_confirmation]);

  async function handleLogoutAndContinue() {
    await dispatch(logout());
    router.refresh();
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setMessage({ tone: "error", text: "This invitation link is missing its token." });
      return;
    }

    if (!invitedEmail) {
      setMessage({ tone: "error", text: "This invitation link is missing the invited email." });
      return;
    }

    if (!isAuthenticated) {
      if (!form.name.trim()) {
        setFieldErrors({ name: ["Name is required."] });
        return;
      }

      if (!form.password) {
        setFieldErrors({ password: ["Password is required."] });
        return;
      }

      if (form.password !== form.password_confirmation) {
        setFieldErrors({
          password_confirmation: ["Password confirmation does not match."],
        });
        return;
      }
    }

    try {
      setSubmitting(true);
      setFieldErrors({});
      setMessage(null);

      await acceptTenantInvitation({
        token,
        email: invitedEmail,
        ...(isAuthenticated
          ? {}
          : {
              name: form.name.trim(),
              password: form.password,
              password_confirmation: form.password_confirmation,
            }),
      });

      await dispatch(authMe());
      setMessage({
        tone: "success",
        text: "Invitation accepted. Redirecting to your workspace...",
      });

      window.setTimeout(() => {
        router.replace("/admin/dashboard");
      }, 900);
    } catch (error) {
      const response = (error as {
        response?: {
          data?: {
            message?: string;
            errors?: ApiErrors;
          };
        };
      })?.response?.data;

      setFieldErrors(response?.errors ?? {});
      setMessage({
        tone: "error",
        text: response?.message || "Failed to accept this invitation.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScaffold
      title="Workspace Invitation"
      subtitle="Accept the tenant workspace invitation and activate your team access."
      centered
      centeredOuterMaxWidthClass="max-w-7xl"
      contentClassName="w-full"
    >
      <div className="grid w-full overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-sky-100/70 lg:min-h-[760px] lg:grid-cols-2">
        <div className="flex items-start px-6 py-8 sm:px-10 lg:px-12 lg:py-12">
          <div className="w-full space-y-6">
            <AuthCardTitle
              eyebrow="Tenant invitation"
              title="Join Workspace"
              description={
                invitedEmail
                  ? `You were invited to join the workspace with ${invitedEmail}.`
                  : "Use the invitation link from your email to join the tenant workspace."
              }
            />

            {!token || !invitedEmail ? (
              <div className="space-y-4">
                <AuthAlert
                  tone="error"
                  message="This invitation link is incomplete. Ask the tenant owner or tenant admin to resend it."
                />
                <Link href="/login" className="text-sm font-semibold text-sky-700 hover:text-sky-900">
                  Back to login
                </Link>
              </div>
            ) : signedInWithDifferentEmail ? (
              <div className="space-y-4">
                <AuthAlert
                  tone="error"
                  message={`You are signed in as ${user?.email}, but this invitation was sent to ${invitedEmail}.`}
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void handleLogoutAndContinue()}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-sky-600 px-4 text-sm font-bold text-white transition hover:bg-sky-700"
                  >
                    Logout and continue
                  </button>
                  <Link
                    href="/admin/dashboard"
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Back to dashboard
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <AuthField label="Invited email" htmlFor="invited_email">
                  <AuthInput id="invited_email" value={invitedEmail} disabled />
                </AuthField>

                {isAuthenticated ? (
                  <div className="space-y-4">
                    <AuthAlert
                      tone="info"
                      message={`You are signed in as ${user?.email}. Accept the invitation to attach this workspace to your account.`}
                    />
                  </div>
                ) : (
                  <>
                    <AuthField
                      label="Full name"
                      htmlFor="name"
                      error={fieldErrors.name?.[0]}
                    >
                      <AuthInput
                        id="name"
                        autoComplete="name"
                        value={form.name}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, name: event.target.value }))
                        }
                      />
                    </AuthField>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <AuthField
                        label="Password"
                        htmlFor="password"
                        error={fieldErrors.password?.[0]}
                      >
                        <AuthInput
                          id="password"
                          type="password"
                          autoComplete="new-password"
                          value={form.password}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, password: event.target.value }))
                          }
                        />
                      </AuthField>

                      <AuthField
                        label="Confirm password"
                        htmlFor="password_confirmation"
                        error={fieldErrors.password_confirmation?.[0]}
                      >
                        <AuthInput
                          id="password_confirmation"
                          type="password"
                          autoComplete="new-password"
                          value={form.password_confirmation}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              password_confirmation: event.target.value,
                            }))
                          }
                        />
                      </AuthField>
                    </div>
                  </>
                )}

                {message ? <AuthAlert tone={message.tone} message={message.text} /> : null}

                <AuthSubmit
                  label={isAuthenticated ? "Accept Invitation" : "Create Account and Join"}
                  loadingLabel="Accepting invitation..."
                  loading={submitting}
                />

                <div className="pt-1 text-sm">
                  <Link href="/login" className="font-semibold text-sky-700 hover:text-sky-900">
                    Back to login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="relative hidden min-h-[760px] overflow-hidden bg-[linear-gradient(180deg,#dceeff_0%,#edf6ff_48%,#dcecff_100%)] lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.85),transparent_28%),radial-gradient(circle_at_70%_78%,rgba(255,255,255,0.5),transparent_24%)]" />

          <div className="relative flex h-full items-center justify-center px-8 py-8 xl:px-10 xl:py-10">
            <Image
              src="/assets/images/hero/sign-up.png"
              alt="Workspace invitation illustration"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-contain object-center"
            />
          </div>
        </div>
      </div>
    </AuthScaffold>
  );
}
