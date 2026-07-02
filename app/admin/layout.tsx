import type { ReactNode } from "react";
import { AdminShell } from "@/src/shared/components/admin/AdminShell";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
