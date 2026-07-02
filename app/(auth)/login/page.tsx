"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/src/shared/redux/store";
import { clearAuthError, login } from "@/src/shared/redux/store/authSlice";
import { getPostLoginAccess } from "@/src/shared/auth/authModel";
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

    const access = getPostLoginAccess(result.payload);
    if (access.kind === "blocked") {
      setMessage({ tone: access.tone, text: access.message });
      return;
    }

    const next = searchParams.get("next");
    if (next && next.startsWith("/")) {
      router.push(next);
      return;
    }

    router.push(access.destination);
  }

  return (
    <AuthScaffold
      title="Welcome Back"
      subtitle="Login to continue to your flight booking account or agent workspace."
      centered
    >
      <div className="space-y-6">
        <AuthCardTitle
          eyebrow="Common login"
          title="Login"
          description="Use one secure sign-in flow for customers, agency teams, platform admins, and system developers."
        />

        <form onSubmit={onSubmit} className="space-y-4">
          <AuthField label="Email address" htmlFor="email" error={fieldErrors.email?.[0]}>
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

          <AuthField label="Password" htmlFor="password" error={fieldErrors.password?.[0]}>
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

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
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
    </AuthScaffold>
  );
}
