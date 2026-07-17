"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ReportsWorkspace } from "@/src/shared/components/admin/ReportsWorkspace";
import { useAuth } from "@/src/shared/auth/AuthProvider";

export default function TenantReportsPage() {
  const router = useRouter();
  const { isPlatformAdmin, selectedTenant } = useAuth();

  useEffect(() => {
    if (isPlatformAdmin) router.replace("/admin/reports");
  }, [isPlatformAdmin, router]);

  if (isPlatformAdmin) return null;
  return <ReportsWorkspace scope="tenant" tenantName={selectedTenant?.name} />;
}
