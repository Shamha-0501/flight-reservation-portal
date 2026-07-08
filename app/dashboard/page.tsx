"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/shared/auth/AuthProvider";
import { AuthAlert } from "@/src/shared/components/auth/AuthScaffold";

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { loading, isAuthenticated, access } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.replace("/login?next=/dashboard");
      return;
    }

    if (access.kind === "blocked") return;

    router.replace(access.destination);
  }, [access, isAuthenticated, loading, router]);

  if (access.kind === "blocked") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">
            Workspace access unavailable
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Your login was successful, but this agency workspace is not available yet.
          </p>
          <div className="mt-5">
            <AuthAlert tone={access.tone} message={access.message} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-600 shadow-sm">
        Opening dashboard...
      </div>
    </main>
  );
}
