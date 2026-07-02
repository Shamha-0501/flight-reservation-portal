"use client";

import { useMemo, useState } from "react";
import {
  AdminPage,
  Drawer,
  FilterSelect,
  KebabMenu,
  SearchInput,
  StatusBadge,
  SurfaceCard,
  TableShell,
} from "@/src/shared/components/admin/AdminUI";
import { cancellationRequests } from "@/src/shared/components/admin/adminData";

export default function AdminCancellationsPage() {
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [dateFilter, setDateFilter] = useState("All Dates");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredRows = useMemo(() => {
    return cancellationRequests.filter((request) => {
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        request.bookingRef.toLowerCase().includes(query) ||
        request.customer.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "All Statuses" || request.currentStatus === statusFilter;
      const matchesDate =
        dateFilter === "All Dates" ||
        (dateFilter === "This Week" && request.cancellationDate >= "2026-06-25") ||
        (dateFilter === "Older" && request.cancellationDate < "2026-06-25");

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [dateFilter, search, statusFilter]);

  const selected = cancellationRequests.find((item) => item.id === selectedId) ?? null;

  return (
    <AdminPage
      title="Cancellation requests"
      description="Manage cancellations, refund outcomes, and customer follow-up before backend workflows are connected."
    >
      <SurfaceCard title="Refund desk" description="Review requests and queue manual decisions.">
        <div className="grid gap-3 lg:grid-cols-[180px_180px_minmax(0,1fr)]">
          <FilterSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={["All Statuses", "Requested", "Refunded", "No Refund", "Rejected"]}
          />
          <FilterSelect
            value={dateFilter}
            onChange={setDateFilter}
            options={["All Dates", "This Week", "Older"]}
          />
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search booking reference"
          />
        </div>

        <div className="mt-5">
          <TableShell
            columns={[
              "Booking Ref",
              "Customer",
              "Refund Amount",
              "Refund Status",
              "Cancellation Date",
              "Current Status",
              "Actions",
            ]}
          >
            {filteredRows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-4 text-sm font-bold text-slate-950">{row.bookingRef}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{row.customer}</td>
                <td className="px-4 py-4 text-sm font-bold text-slate-950">{row.refundAmount}</td>
                <td className="px-4 py-4">
                  <StatusBadge value={row.refundStatus} />
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">{row.cancellationDate}</td>
                <td className="px-4 py-4">
                  <StatusBadge value={row.currentStatus} />
                </td>
                <td className="px-4 py-4">
                  <KebabMenu
                    items={[
                      { label: "View", onClick: () => setSelectedId(row.id) },
                      { label: "Mark Refunded" },
                      { label: "Mark No Refund" },
                      { label: "Reject", tone: "danger" },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </TableShell>
        </div>
      </SurfaceCard>

      <Drawer
        open={Boolean(selected)}
        title={selected ? `${selected.bookingRef} cancellation` : "Cancellation details"}
        description="Full static cancellation request details."
        onClose={() => setSelectedId(null)}
      >
        {selected ? (
          <div className="space-y-5">
            <InfoGrid
              rows={[
                ["Customer", selected.customer],
                ["Refund Amount", selected.refundAmount],
                ["Refund Status", selected.refundStatus],
                ["Current Status", selected.currentStatus],
                ["Cancellation Date", selected.cancellationDate],
              ]}
            />
            <SurfaceCard title="Cancellation Reason">
              <p className="text-sm leading-6 text-slate-600">{selected.reason}</p>
            </SurfaceCard>
            <SurfaceCard title="Operations Notes">
              <p className="text-sm leading-6 text-slate-600">{selected.notes}</p>
            </SurfaceCard>
          </div>
        ) : null}
      </Drawer>
    </AdminPage>
  );
}

function InfoGrid({ rows }: { rows: [string, string][] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            {label}
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-900">{value}</div>
        </div>
      ))}
    </div>
  );
}
