"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/src/shared/redux/store";
import { clearAuthError, login } from "@/src/shared/redux/store/authSlice";
import {
  AuthAlert,
  AuthCardTitle,
  AuthField,
  AuthInput,
  AuthLinks,
  AuthScaffold,
  AuthSubmit,
} from "@/src/shared/components/auth/AuthScaffold";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const { error, fieldErrors, requestStatus } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(
    null,
  );

  useEffect(() => {
    if (error) {
      setMessage({ tone: "error", text: error });
    }
  }, [error]);

  useEffect(() => {
    if (message || Object.keys(fieldErrors).length > 0) {
      dispatch(clearAuthError());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, password, remember]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const result = await dispatch(login({ email, password, remember }));
    if (!login.fulfilled.match(result)) return;

    const next = searchParams.get("next");
    if (next && next.startsWith("/")) {
      router.push(next);
      return;
    }

    router.push("/home");
  }

  return (
    <AuthScaffold
      title="Welcome Back"
      subtitle="Login to continue to your flight booking account or agent workspace."
      centered
      centeredOuterMaxWidthClass="max-w-7xl"
      contentClassName="w-full"
    >
      <div className="grid w-full overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-sky-100/70 lg:min-h-[760px] lg:grid-cols-2">
        <div className="flex items-start px-6 py-8 sm:px-10 lg:px-12 lg:py-12">
          <div className="w-full space-y-6">
            <AuthCardTitle
              eyebrow="Common login"
              title="Login"
              description="Use one secure sign-in flow for customers, agency teams, platform admins, and system developers."
            />

            <form onSubmit={onSubmit} className="space-y-4">
              <AuthField
                label="Email address"
                htmlFor="email"
                error={fieldErrors.email?.[0]}
              >
                <AuthInput
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </AuthField>

              <AuthField
                label="Password"
                htmlFor="password"
                error={fieldErrors.password?.[0]}
              >
                <AuthInput
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </AuthField>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                Remember me
              </label>

              {message ? <AuthAlert tone={message.tone} message={message.text} /> : null}

              <AuthSubmit
                label="Login"
                loadingLabel="Logging in..."
                loading={requestStatus === "loading"}
              />
            </form>

            <AuthLinks
              links={[
                { href: "/register", label: "Create customer account" },
                { href: "/agency/register", label: "Register as an Agent" },
                { href: "/forgot-password", label: "Forgot password?" },
              ]}
            />
          </div>
        </div>

        <div className="relative hidden min-h-[760px] overflow-hidden bg-[linear-gradient(180deg,#dceeff_0%,#edf6ff_48%,#dcecff_100%)] lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.85),transparent_28%),radial-gradient(circle_at_70%_78%,rgba(255,255,255,0.5),transparent_24%)]" />

          <div className="relative flex h-full items-center justify-center px-8 py-8 xl:px-10 xl:py-10">
            <img
              src="/assets/images/hero/sign-up.png"
              alt="Flight booking illustration"
              className="h-full w-full object-contain object-center"
            />
          </div>
        </div>
      </div>
    </AuthScaffold>
  );
}
