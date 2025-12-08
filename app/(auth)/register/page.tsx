"use client";

import Link from "next/link";
import Container from "@/src/app/shared/ui/Container";
import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  clearError,
  signupUser,
} from "@/src/app/shared/redux/slices/authSlice";
import { useRouter } from "next/navigation";

type RootState = any; // replace with your real RootState type if you have one

export default function RegisterPage() {
  const [payload, setPayload] = useState({
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dispatch = useDispatch();
  const router = useRouter();

  const {
    isLoading,
    error: authError,
    success,
    isAuthenticated,
  } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (success || isAuthenticated) {
      router.push("/"); // or "/login" or wherever you want
    }
  }, [success, isAuthenticated, router]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setPayload((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear errors for the field being updated
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Clear auth errors when user starts typing
    if (authError) {
      dispatch(clearError() as any);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!payload.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(payload.email)) {
      newErrors.email = "Email is invalid";
    }

    // Password validation
    if (!payload.password.trim()) {
      newErrors.password = "Password is required";
    } else if (payload.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(payload.password)) {
      newErrors.password =
        "Password must contain uppercase, lowercase, and number";
    }

    // Confirm password
    if (!payload.password_confirmation.trim()) {
      newErrors.password_confirmation = "Confirm your password";
    } else if (payload.password_confirmation !== payload.password) {
      newErrors.password_confirmation = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    setErrors({});
    dispatch(clearError() as any);

    const signupData = {
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      // send confirm password too if backend expects it:
      password_confirmation: payload.password_confirmation,
    };

    await dispatch(signupUser(signupData) as any);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Set auth errors to local state for display
  useEffect(() => {
    if (authError) {
      setErrors((prev) => ({ ...prev, submit: authError }));
    }
  }, [authError]);

  return (
    <Container className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-800">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-6 sm:p-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-50">
            Create an account
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Join us and discover unforgettable experiences.
          </p>
        </div>

        {/* Show auth error if any */}
        {authError && (
          <p className="mb-3 text-sm text-red-600 dark:text-red-400">
            {String(authError)}
          </p>
        )}

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Email */}
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

          {/* Password */}
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

          {/* Confirm password */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password_confirmation"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Confirm Password
            </label>
            <input
              id="password_confirmation"
              name="password_confirmation"
              type="password"
              value={payload.password_confirmation}
              onChange={handleInputChange}
              required
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="••••••••"
            />
            {errors.password_confirmation && (
              <span className="text-xs text-red-600 dark:text-red-400">
                {errors.password_confirmation}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full rounded-lg bg-blue-600 text-white text-sm font-medium py-2.5 hover:bg-blue-700 dark:hover:bg-blue-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing up..." : "Sign up"}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </Container>
  );
}
