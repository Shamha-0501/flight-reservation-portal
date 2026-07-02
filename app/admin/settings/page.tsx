"use client";

import { useState } from "react";
import { AdminButton, AdminPage, FilterSelect, SurfaceCard } from "@/src/shared/components/admin/AdminUI";

export default function AdminSettingsPage() {
  const [timezone, setTimezone] = useState("Asia/Colombo");
  const [currency, setCurrency] = useState("USD");
  const [theme, setTheme] = useState("Portal Blue");

  return (
    <AdminPage
      title="Settings"
      description="Tenant information and operational preferences for the admin portal."
      actions={
        <>
          <AdminButton variant="secondary" disabled>
            Save Changes
          </AdminButton>
          <AdminButton variant="ghost">Reset</AdminButton>
        </>
      }
    >
      <SurfaceCard title="Tenant information">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Company Name" value="SkyWay Travels" />
          <TextField label="Email" value="ops@skywaytravels.com" />
          <TextField label="Phone" value="+94 11 230 4400" />
          <TextField label="Address" value="142 Galle Road, Colombo 03" />
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Timezone</label>
            <FilterSelect
              value={timezone}
              onChange={setTimezone}
              options={["Asia/Colombo", "Asia/Dubai", "Asia/Singapore"]}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Currency</label>
            <FilterSelect value={currency} onChange={setCurrency} options={["USD", "LKR", "AED"]} />
          </div>
        </div>
      </SurfaceCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <SurfaceCard title="Theme">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Portal theme</label>
            <FilterSelect
              value={theme}
              onChange={setTheme}
              options={["Portal Blue", "Ocean Sky", "Slate Air"]}
            />
          </div>
        </SurfaceCard>

        <SurfaceCard title="Notification preferences">
          <div className="space-y-3">
            {[
              "Refund status updates",
              "Reschedule approvals",
              "Daily booking digest",
              "Agency onboarding alerts",
            ].map((label) => (
              <label
                key={label}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <span className="text-sm font-semibold text-slate-700">{label}</span>
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-blue-600" />
              </label>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </AdminPage>
  );
}

function TextField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-slate-700">{label}</label>
      <input
        defaultValue={value}
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
      />
    </div>
  );
}
