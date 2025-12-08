"use client";

import Link from "next/link";
import Container from "@/src/app/shared/ui/Container";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { clearError, loginUser } from "@/src/app/shared/redux/slices/authSlice";

export default function LoginPage() {
  const [payload, setPayload] = useState({
    email: "",
    password: "",
    remember: false, // matches backend
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const dispatch = useDispatch();
  const router = useRouter();

  const { isLoading, error: authError } = useSelector(
    (state: any) => state.auth
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setPayload((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear field error
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Clear global auth error
    if (authError) {
      dispatch(clearError() as any);
    }
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!payload.email.trim()) nextErrors.email = "Email is required";
    if (!payload.password.trim()) nextErrors.password = "Password is required";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    const result = await dispatch(loginUser(payload) as any);

    // if login succeeded, go somewhere (home, dashboard, etc.)
    if (loginUser.fulfilled.match(result)) {
      router.push("/");
    }
  };

  return (
    <Container className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-800">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-6 sm:p-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-50">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Login to continue exploring amazing tours.
          </p>
        </div>

        {/* Auth error */}
        {authError && (
          <p className="mb-3 text-sm text-red-600 dark:text-red-400">
            {String(authError)}
          </p>
        )}

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={payload.email}
              onChange={handleInputChange}
              required
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="you@example.com"
            />
            {errors.email && (
              <span className="text-xs text-red-600 dark:text-red-400">
                {errors.email}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={payload.password}
              onChange={handleInputChange}
              required
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="••••••••"
            />
            {errors.password && (
              <span className="text-xs text-red-600 dark:text-red-400">
                {errors.password}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                name="remember"
                checked={payload.remember}
                onChange={handleInputChange}
                className="h-3.5 w-3.5 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
              />
              Remember me
            </label>
            <button
              type="button"
              className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full rounded-lg bg-blue-600 text-white text-sm font-medium py-2.5 hover:bg-blue-700 dark:hover:bg-blue-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </Container>
  );
}
