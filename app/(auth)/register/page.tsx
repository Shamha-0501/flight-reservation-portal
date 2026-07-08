"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/src/shared/redux/store";
import {
  clearAuthError,
  registerCustomer,
} from "@/src/shared/redux/store/authSlice";
import {
  AuthAlert,
  AuthCardTitle,
  AuthField,
  AuthInput,
  AuthLinks,
  AuthScaffold,
  AuthSubmit,
} from "@/src/shared/components/auth/AuthScaffold";

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  terms: boolean;
};

const initialState: FormState = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  password: "",
  password_confirmation: "",
  terms: false,
};

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const { error, fieldErrors, requestStatus, successMessage } = useSelector(
    (state: RootState) => state.auth,
  );

  const [form, setForm] = useState<FormState>(initialState);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (successMessage) {
      const timeout = window.setTimeout(() => router.push("/login"), 1200);
      return () => window.clearTimeout(timeout);
    }
  }, [router, successMessage]);

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  useEffect(() => {
    if (
      localError ||
      error ||
      Object.keys(fieldErrors).length > 0 ||
      successMessage
    ) {
      dispatch(clearAuthError());
      setLocalError(null);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);

    if (!form.terms) {
      setLocalError("You must accept the terms and conditions to continue.");
      return;
    }

    const fullName = `${form.first_name} ${form.last_name}`.trim();

    const result = await dispatch(
      registerCustomer({
        ...form,
        name: fullName,
        role: "customer",
      }),
    );

    if (registerCustomer.fulfilled.match(result)) {
      setForm(initialState);
    }
  }

  return (
    <AuthScaffold
      title="Create Your Customer Account"
      subtitle="Sign up to search flights, manage bookings, and track your travel plans."
      centered
      centeredOuterMaxWidthClass="max-w-7xl"
      contentClassName="w-full"
    >
      <div className="grid w-full overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-sky-100/70 lg:min-h-[760px] lg:grid-cols-2">
        {/* LEFT SIDE - FORM */}
        <div className="flex items-start px-6 py-8 sm:px-10 lg:px-12 lg:py-12">
          <div className="w-full space-y-6">
            <AuthCardTitle
              eyebrow="Customer signup"
              title="Create Account"
              description="This registration creates only a customer account. It does not create an agency or tenant workspace."
            />

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <AuthField
                  label="First name"
                  htmlFor="first_name"
                  error={fieldErrors.first_name?.[0]}
                >
                  <AuthInput
                    id="first_name"
                    value={form.first_name}
                    onChange={(event) =>
                      updateField("first_name", event.target.value)
                    }
                  />
                </AuthField>

                <AuthField
                  label="Last name"
                  htmlFor="last_name"
                  error={fieldErrors.last_name?.[0]}
                >
                  <AuthInput
                    id="last_name"
                    value={form.last_name}
                    onChange={(event) =>
                      updateField("last_name", event.target.value)
                    }
                  />
                </AuthField>
              </div>

              <AuthField
                label="Email address"
                htmlFor="email"
                error={fieldErrors.email?.[0]}
              >
                <AuthInput
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                />
              </AuthField>

              <AuthField
                label="Phone number"
                htmlFor="phone"
                error={fieldErrors.phone?.[0]}
              >
                <AuthInput
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
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
                      updateField("password", event.target.value)
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
                      updateField("password_confirmation", event.target.value)
                    }
                  />
                </AuthField>
              </div>

              <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.terms}
                  onChange={(event) =>
                    updateField("terms", event.target.checked)
                  }
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span>I agree to the portal terms and conditions.</span>
              </label>

              {localError ? (
                <AuthAlert tone="error" message={localError} />
              ) : null}

              {error ? <AuthAlert tone="error" message={error} /> : null}

              {successMessage ? (
                <AuthAlert tone="success" message={successMessage} />
              ) : null}

              <AuthSubmit
                label="Create Account"
                loadingLabel="Creating account..."
                loading={requestStatus === "loading"}
              />
            </form>

            <AuthLinks
              links={[
                {
                  href: "/agency/register",
                  label: "Are you a travel agent? Register as an Agent",
                },
                {
                  href: "/login",
                  label: "Already have an account? Login",
                },
              ]}
            />
          </div>
        </div>

        {/* RIGHT SIDE - IMAGE */}
        <div className="relative hidden min-h-[760px] overflow-hidden bg-[linear-gradient(180deg,#dceeff_0%,#edf6ff_48%,#dcecff_100%)] lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.85),transparent_28%),radial-gradient(circle_at_70%_78%,rgba(255,255,255,0.5),transparent_24%)]" />

          <div className="relative flex h-full items-center justify-center px-8 py-8 xl:px-10 xl:py-10">
            <div className="flex h-full w-full items-center justify-center">
              <img
                src="/assets/images/hero/sign-up.png"
                alt="Flight booking illustration"
                className="h-full w-full object-contain object-center"
              />
            </div>
          </div>
        </div>
      </div>
    </AuthScaffold>
  );
}
