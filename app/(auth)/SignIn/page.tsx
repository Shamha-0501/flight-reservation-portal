"use client";

import { AppDispatch, RootState } from "@/src/shared/redux/store";
import { clearAuthError, login } from "@/src/shared/redux/store/authSlice";
import Container from "@/src/shared/ui/Container";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function SignIn() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const authStatus = useSelector((s: RootState) => s.auth.authStatus);
  const authError = useSelector((s: RootState) => s.auth.error);

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const isLoading = authStatus === "authenticated";

  useEffect(() => {
    // keep UI in sync with redux error (optional)
    setError(authError ?? null);
  }, [authError]);

  useEffect(() => {
    // clear redux error when user edits input (optional)
    if (error) dispatch(clearAuthError());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, password]);

  function validate() {
    if (!email.trim()) return "Please enter your email.";
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Please enter a valid email.";
    if (!password) return "Please enter your password.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const v = validate();
    if (v) return setError(v);

    const res = await dispatch(login({ email, password }));
    if (login.fulfilled.match(res)) {
      // nothing
      router.push("/");
    } else {
      // error already in redux, but you can set local too:
      setError((res.payload as string) || "Login failed.");
    }
  }

  const onSignUp = () => {
    router.push("/SignUp");
  };

  return (
    <Container className="min-h-screen flex items-center justify-center">
      <div className="w-1/3 rounded-2xl border border-border bg-background p-6 shadow-sm">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="test@example.com"
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="h-11 w-full rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-60"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
          <button
            type="button"
            onClick={onSignUp}
            className="h-11 w-full rounded-xl bg-bg text-primary text-sm font-semibold border border-primary"
          >
            Sign Up
          </button>
        </form>
      </div>
    </Container>
  );
}
