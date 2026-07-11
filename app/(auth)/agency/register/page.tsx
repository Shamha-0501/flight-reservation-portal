"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
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

const services = [
  "Flight booking",
  "Cancellation support",
  "WhatsApp alerts",
  "Airport assistance",
  "Business travel",
  "Student travel",
] as const;

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
  services: string[];
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
  services: [],
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

  function toggleService(service: string) {
    setForm((current) => ({
      ...current,
      services: current.services.includes(service)
        ? current.services.filter((item) => item !== service)
        : [...current.services, service],
    }));
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
    form.services.forEach((service) => payload.append("services[]", service));
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
      centeredMaxWidthClass="max-w-4xl"
    >
      <div className="space-y-6">
        <AuthCardTitle
          eyebrow="Agency signup"
          title="Create Agency Account"
          description="This flow creates the agency record, the first tenant owner account, and the link between them."
        />

        <div className="rounded-[1.25rem] border border-sky-100 bg-[linear-gradient(135deg,rgba(240,249,255,0.9),rgba(255,255,255,0.95))] p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-950">Approval workflow</div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            New agencies start with a pending status. An admin, super admin, or system developer
            must approve the workspace before dashboard access is enabled.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <section className="space-y-5 rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">
                Section 1
              </div>
              <h3 className="mt-2 text-xl font-extrabold text-slate-950">Agency Information</h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Business details for the workspace that will be reviewed by the platform team.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <AuthField
                label="Agency name"
                htmlFor="agency_name"
                error={fieldErrors.agency_name?.[0]}
              >
                <AuthInput
                  id="agency_name"
                  value={form.agency_name}
                  onChange={(event) => updateField("agency_name", event.target.value)}
                />
              </AuthField>

              <AuthField
                label="Business email"
                htmlFor="business_email"
                error={fieldErrors.business_email?.[0]}
              >
                <AuthInput
                  id="business_email"
                  type="email"
                  value={form.business_email}
                  onChange={(event) => updateField("business_email", event.target.value)}
                />
              </AuthField>

              <AuthField
                label="Business phone"
                htmlFor="business_phone"
                error={fieldErrors.business_phone?.[0]}
              >
                <AuthInput
                  id="business_phone"
                  value={form.business_phone}
                  onChange={(event) => updateField("business_phone", event.target.value)}
                />
              </AuthField>

              <AuthField label="Country" htmlFor="country" error={fieldErrors.country?.[0]}>
                <AuthSelect
                  value={form.country}
                  options={[...countryOptions]}
                  placeholder="Select country"
                  onChange={(value) => updateField("country", value)}
                />
              </AuthField>

              <AuthField label="City" htmlFor="city" error={fieldErrors.city?.[0]}>
                <AuthInput
                  id="city"
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
                <AuthInput
                  id="agency_logo"
                  type="file"
                  accept="image/*"
                  className="pt-3"
                  onChange={(event) =>
                    updateField("agency_logo", event.target.files?.[0] ?? null)
                  }
                />
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
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
              />
            </AuthField>

            <div className="grid gap-3">
              <div className="text-sm font-semibold text-slate-700">Services offered</div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {services.map((service) => (
                  <label
                    key={service}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:border-sky-200 hover:bg-sky-50/60"
                  >
                    <input
                      type="checkbox"
                      checked={form.services.includes(service)}
                      onChange={() => toggleService(service)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span>{service}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-5 rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">
                Section 2
              </div>
              <h3 className="mt-2 text-xl font-extrabold text-slate-950">Account Information</h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                The first tenant owner account for this agency workspace.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <AuthField label="Full name" htmlFor="name" error={fieldErrors.name?.[0]}>
                <AuthInput
                  id="name"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                />
              </AuthField>

              <AuthField label="Login email" htmlFor="email" error={fieldErrors.email?.[0]}>
                <AuthInput
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                />
              </AuthField>

              <AuthField label="Phone number" htmlFor="phone" error={fieldErrors.phone?.[0]}>
                <AuthInput
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                />
              </AuthField>

              <AuthField label="Password" htmlFor="password" error={fieldErrors.password?.[0]}>
                <AuthInput
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
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

          <AuthSubmit
            label="Create Agency Account"
            loadingLabel="Creating agency account..."
            loading={requestStatus === "loading"}
          />
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
