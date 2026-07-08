import { redirect } from "next/navigation";

export default function AdminIndexPage() {
  redirect("/admin/dashboard");
}

//auth guard - prevent normal users get tenant dashboards 