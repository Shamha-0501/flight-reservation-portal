"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Building2, Info, UserRound, Upload } from "lucide-react";
import type { AppDispatch, RootState } from "@/src/shared/redux/store";
import { clearAuthError, registerAgency } from "@/src/shared/redux/store/authSlice";
import {
  AuthAlert,
  AuthCardTitle,
  AuthField,
  AuthInput,
  AuthLinks,
  AuthScaffold,
  AuthSelect,
  AuthSubmit,
  AuthTextarea,
} from "@/src/shared/components/auth/AuthScaffold";

const countryOptions = [
  { value: "Sri Lanka", label: "Sri Lanka" },
  { value: "United Arab Emirates", label: "United Arab Emirates" },
  { value: "India", label: "India" },
  { value: "United Kingdom", label: "United Kingdom" },
] as const;

type FormState = {
  agency_name: string;
  business_email: string;
  business_phone: string;
  country: string;
  city: string;
  address: string;
  description: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  agency_logo: File | null;
};

const initialState: FormState = {
  agency_name: "",
  business_email: "",
  business_phone: "",
  country: "",
  city: "",
  address: "",
  description: "",
  name: "",
  email: "",
  phone: "",
  password: "",
  password_confirmation: "",
  agency_logo: null,
};

export default function AgencyRegisterPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { error, fieldErrors, requestStatus, successMessage } = useSelector(
    (state: RootState) => state.auth,
  );
  const [form, setForm] = useState<FormState>(initialState);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  useEffect(() => {
    if (error || Object.keys(fieldErrors).length > 0 || successMessage) {
      dispatch(clearAuthError());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  useEffect(() => {
    if (successMessage) {
      const timeout = window.setTimeout(() => router.push("/login"), 1200);
      return () => window.clearTimeout(timeout);
    }
  }, [router, successMessage]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = new FormData();
    payload.append("agency_name", form.agency_name);
    payload.append("business_email", form.business_email);
    payload.append("business_phone", form.business_phone);
    payload.append("country", form.country);
    payload.append("city", form.city);
    payload.append("address", form.address);
    payload.append("description", form.description);
    payload.append("name", form.name);
    payload.append("email", form.email);
    payload.append("phone", form.phone);
    payload.append("password", form.password);
    payload.append("password_confirmation", form.password_confirmation);
    if (form.agency_logo) {
      payload.append("agency_logo", form.agency_logo);
    }

    const result = await dispatch(registerAgency(payload));
    if (registerAgency.fulfilled.match(result)) {
      setForm(initialState);
    }
  }

  return (
    <AuthScaffold
      title="Register Your Travel Agency"
      subtitle="Create an agent workspace to manage bookings, customers, and agency operations."
      centered
      centeredOuterMaxWidthClass="max-w-6xl"
      centeredMaxWidthClass="max-w-5xl"
    >
      <div className="space-y-6">
        <AuthCardTitle
          eyebrow="Agency signup"
          title="Create Agency Account"
          description="This flow creates the agency record, the first tenant owner account, and the link between them."
        />

        <div className="rounded-[1.4rem] border border-sky-100 bg-[linear-gradient(135deg,rgba(239,246,255,0.96),rgba(255,255,255,0.98))] p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-sm">
              <Info className="h-5 w-5" />
            </span>
            <div>
              <div className="text-sm font-bold text-slate-950">Approval workflow</div>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                New agencies start with a pending status. An admin, super admin, or system developer
                must approve the workspace before dashboard access is enabled.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <section className="space-y-6 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-sm">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">
                  Section 1
                </div>
                <h3 className="mt-1 text-xl font-extrabold text-slate-950">Agency Information</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Business details for the workspace that will be reviewed by the platform team.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <AuthField
                label="Agency name"
                htmlFor="agency_name"
                error={fieldErrors.agency_name?.[0]}
                required
              >
                <AuthInput
                  id="agency_name"
                  placeholder="Enter agency name"
                  value={form.agency_name}
                  onChange={(event) => updateField("agency_name", event.target.value)}
                />
              </AuthField>

              <AuthField
                label="Business email"
                htmlFor="business_email"
                error={fieldErrors.business_email?.[0]}
                required
              >
                <AuthInput
                  id="business_email"
                  type="email"
                  placeholder="Enter business email"
                  value={form.business_email}
                  onChange={(event) => updateField("business_email", event.target.value)}
                />
              </AuthField>

              <AuthField
                label="Business phone"
                htmlFor="business_phone"
                error={fieldErrors.business_phone?.[0]}
                required
              >
                <AuthInput
                  id="business_phone"
                  placeholder="Enter business phone"
                  value={form.business_phone}
                  onChange={(event) => updateField("business_phone", event.target.value)}
                />
              </AuthField>

              <AuthField label="Country" htmlFor="country" error={fieldErrors.country?.[0]} required>
                <AuthSelect
                  value={form.country}
                  options={[...countryOptions]}
                  placeholder="Select country"
                  onChange={(value) => updateField("country", value)}
                />
              </AuthField>

              <AuthField label="City" htmlFor="city" error={fieldErrors.city?.[0]} required>
                <AuthInput
                  id="city"
                  placeholder="Enter city"
                  value={form.city}
                  onChange={(event) => updateField("city", event.target.value)}
                />
              </AuthField>

              <AuthField
                label="Agency logo"
                htmlFor="agency_logo"
                error={fieldErrors.agency_logo?.[0]}
                optional
              >
                <div className="flex min-h-12 flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 transition focus-within:border-sky-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-sky-50">
                  <label
                    htmlFor="agency_logo"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
                  >
                    <Upload className="h-4 w-4" />
                    Upload logo
                  </label>
                  <input
                    id="agency_logo"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) =>
                      updateField("agency_logo", event.target.files?.[0] ?? null)
                    }
                  />
                  <span className="min-w-0 flex-1 truncate text-slate-500">
                    {form.agency_logo ? form.agency_logo.name : "PNG, JPG up to 2MB"}
                  </span>
                </div>
              </AuthField>
            </div>

            <AuthField
              label="Agency address"
              htmlFor="address"
              error={fieldErrors.address?.[0]}
              optional
            >
              <AuthInput
                id="address"
                placeholder="Enter full address"
                value={form.address}
                onChange={(event) => updateField("address", event.target.value)}
              />
            </AuthField>

            <AuthField
              label="Short agency description"
              htmlFor="description"
              error={fieldErrors.description?.[0]}
              optional
            >
              <AuthTextarea
                id="description"
                placeholder="Briefly describe your agency..."
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
              />
            </AuthField>
          </section>

          <section className="space-y-6 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-sm">
                <UserRound className="h-5 w-5" />
              </span>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">
                  Section 2
                </div>
                <h3 className="mt-1 text-xl font-extrabold text-slate-950">Account Information</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  The first tenant owner account for this agency workspace.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <AuthField label="Full name" htmlFor="name" error={fieldErrors.name?.[0]} required>
                <AuthInput
                  id="name"
                  placeholder="Enter full name"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                />
              </AuthField>

              <AuthField label="Login email" htmlFor="email" error={fieldErrors.email?.[0]} required>
                <AuthInput
                  id="email"
                  type="email"
                  placeholder="Enter login email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                />
              </AuthField>

              <AuthField label="Phone number" htmlFor="phone" error={fieldErrors.phone?.[0]} required>
                <AuthInput
                  id="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                />
              </AuthField>

              <AuthField label="Password" htmlFor="password" error={fieldErrors.password?.[0]} required>
                <AuthInput
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                />
              </AuthField>

              <AuthField
                label="Confirm password"
                htmlFor="password_confirmation"
                error={fieldErrors.password_confirmation?.[0]}
                required
              >
                <AuthInput
                  id="password_confirmation"
                  type="password"
                  placeholder="Confirm password"
                  value={form.password_confirmation}
                  onChange={(event) =>
                    updateField("password_confirmation", event.target.value)
                  }
                />
              </AuthField>
            </div>
          </section>

          {error ? <AuthAlert tone="error" message={error} /> : null}
          {successMessage ? <AuthAlert tone="success" message={successMessage} /> : null}

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 shadow-sm sm:p-5">
            <AuthSubmit
              label="Create Agency Account"
              loadingLabel="Creating agency account..."
              loading={requestStatus === "loading"}
            />
          </div>
        </form>

        <AuthLinks
          links={[
            { href: "/agency", label: "Want to learn more about Agent Workspace?" },
            { href: "/login", label: "Already registered? Login" },
          ]}
        />
      </div>
    </AuthScaffold>
  );
}
