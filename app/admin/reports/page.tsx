"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgeDollarSign,
  CalendarRange,
  FileDown,
  Printer,
  ReceiptText,
  TicketX,
  Users,
  WalletCards,
} from "lucide-react";
import {
  exportAdminReports,
  getAdminReports,
  type AdminReportGroupBy,
  type AdminReportsPayload,
} from "@/src/api/routes/admin/reports";
import {
  AdminButton,
  AdminPage,
  FilterSelect,
  StatCard,
  SurfaceCard,
  TableShell,
} from "@/src/shared/components/admin/AdminUI";
import { agencies, monthlyReportRows } from "@/src/shared/components/admin/adminData";

const groupByOptions: AdminReportGroupBy[] = ["day", "week", "month"];

export default function AdminReportsPage() {
  const [fromDate, setFromDate] = useState(getDefaultFromDate());
  const [toDate, setToDate] = useState(getToday());
  const [groupBy, setGroupBy] = useState<AdminReportGroupBy>("month");
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [report, setReport] = useState<AdminReportsPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadReports() {
      if (!fromDate || !toDate || fromDate > toDate) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const payload = await getAdminReports({
          from: fromDate,
          to: toDate,
          group_by: groupBy,
        });

        if (!active) return;

        setReport(payload);
      } catch (requestError) {
        if (!active) return;

        setReport(buildFallbackReport(groupBy));
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to load admin reports.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadReports();

    return () => {
      active = false;
    };
  }, [fromDate, groupBy, refreshNonce, toDate]);

  const activeReport = report ?? buildFallbackReport(groupBy);
  const summary = activeReport.summary;
  const series = activeReport.series;
  const topAgencies = summary.top_agencies;

  const statCards = useMemo(
    () => [
      {
        label: "Total Revenue",
        value: formatMoney(summary.revenue.amount, summary.revenue.currency),
        note: `From ${fromDate} to ${toDate}`,
        icon: WalletCards,
        iconTone: "bg-indigo-50 text-indigo-600",
      },
      {
        label: "Booking Volume",
        value: formatNumber(summary.booking_volume),
        note: "Bookings in the selected range",
        icon: BadgeDollarSign,
        iconTone: "bg-blue-50 text-blue-600",
      },
      {
        label: "Cancellation Rate",
        value: formatPercentage(summary.cancellation_rate),
        note: "Cancellation share over total bookings",
        icon: TicketX,
        iconTone: "bg-rose-50 text-rose-600",
      },
      {
        label: "Refund Totals",
        value: formatMoney(summary.refund_totals.amount, summary.refund_totals.currency),
        note: "Refund value in the selected range",
        icon: ReceiptText,
        iconTone: "bg-amber-50 text-amber-600",
      },
      {
        label: "Customer Counts",
        value: formatNumber(summary.customer_counts),
        note: "Distinct travelers reached",
        icon: Users,
        iconTone: "bg-emerald-50 text-emerald-600",
      },
      {
        label: "Monthly Snapshot",
        value: String(series.at(-1)?.bookings ?? 0),
        note: "Latest period booking count",
        icon: CalendarRange,
        iconTone: "bg-sky-50 text-sky-600",
      },
    ],
    [fromDate, series, summary, toDate],
  );

  async function handleExportCsv() {
    try {
      const blob = await exportAdminReports({
        from: fromDate,
        to: toDate,
        group_by: groupBy,
        format: "csv",
      });
      downloadBlob(`admin-reports-${fromDate}-to-${toDate}.csv`, blob);
    } catch {
      const csv = buildCsv(activeReport);
      downloadText(`admin-reports-${fromDate}-to-${toDate}.csv`, csv, "text/csv;charset=utf-8;");
    }
  }

  async function handleExportPdf() {
    try {
      const blob = await exportAdminReports({
        from: fromDate,
        to: toDate,
        group_by: groupBy,
        format: "pdf",
      });
      downloadBlob(`admin-reports-${fromDate}-to-${toDate}.pdf`, blob);
    } catch {
      if (typeof window !== "undefined") {
        window.print();
      }
    }
  }

  return (
    <AdminPage
      title="Reports"
      description="Backend-driven reporting for revenue, bookings, cancellations, refunds, and agency performance."
      actions={
        <>
          <AdminButton variant="secondary" onClick={handleExportCsv}>
            <FileDown className="mr-2 h-4 w-4" />
            Export CSV
          </AdminButton>
          <AdminButton variant="secondary" onClick={handleExportPdf}>
            <Printer className="mr-2 h-4 w-4" />
            Save as PDF
          </AdminButton>
        </>
      }
    >
      <SurfaceCard
        title="Report controls"
        description="Pick a date range and grouping. The page will ask the backend for the aggregated report."
      >
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_180px_auto]">
          <DateField label="From" value={fromDate} onChange={setFromDate} max={toDate} />
          <DateField label="To" value={toDate} onChange={setToDate} min={fromDate} />
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Group by</label>
            <FilterSelect
              value={groupBy}
              onChange={(value) => setGroupBy(value as AdminReportGroupBy)}
              options={groupByOptions}
            />
          </div>
          <div className="flex items-end gap-2">
            <AdminButton variant="primary" onClick={() => setRefreshNonce((value) => value + 1)}>
              Refresh
            </AdminButton>
          </div>
        </div>
      </SurfaceCard>

      {error ? (
        <SurfaceCard>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {error}. The page is showing fallback sample data until the backend endpoint is live.
          </div>
        </SurfaceCard>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            note={card.note}
            icon={card.icon}
            iconTone={card.iconTone}
          />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(340px,0.95fr)]">
        <SurfaceCard
          title="Period performance"
          description="Bookings, cancellations, and revenue for each grouped period."
        >
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Loading report...
            </div>
          ) : null}

          <TableShell columns={["Period", "Bookings", "Cancellations", "Revenue"]}>
            {series.map((row) => (
              <tr key={row.label}>
                <td className="px-4 py-4 text-sm font-bold text-slate-950">{row.label}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{row.bookings}</td>
                <td className="px-4 py-4 text-sm text-slate-600">{row.cancellations}</td>
                <td className="px-4 py-4 text-sm font-bold text-slate-950">
                  {formatMoney(row.revenue.amount, row.revenue.currency)}
                </td>
              </tr>
            ))}
          </TableShell>
        </SurfaceCard>

        <SurfaceCard title="Top agencies" description="Ranked by bookings and revenue in the selected range.">
          {topAgencies.length ? (
            <div className="space-y-3">
              {topAgencies.map((agency, index) => (
                <div
                  key={agency.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                        #{index + 1}
                      </div>
                      <div className="mt-1 text-sm font-extrabold text-slate-950">{agency.name}</div>
                      <div className="mt-1 text-xs font-medium text-slate-500">{agency.key}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-slate-950">
                        {formatMoney(agency.revenue.amount, agency.revenue.currency)}
                      </div>
                      <div className="text-xs font-semibold text-slate-500">
                        {formatNumber(agency.bookings)} bookings
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
              No agency performance data returned yet.
            </div>
          )}
        </SurfaceCard>
      </div>

      <SurfaceCard title="Grouped performance" description="Results returned by the backend for the selected range.">
        <TableShell columns={["Period", "Bookings", "Cancellations", "Revenue"]}>
          {series.map((row) => (
            <tr key={row.label}>
              <td className="px-4 py-4 text-sm font-bold text-slate-950">{row.label}</td>
              <td className="px-4 py-4 text-sm text-slate-600">{row.bookings}</td>
              <td className="px-4 py-4 text-sm text-slate-600">{row.cancellations}</td>
              <td className="px-4 py-4 text-sm font-bold text-slate-950">
                {formatMoney(row.revenue.amount, row.revenue.currency)}
              </td>
            </tr>
          ))}
        </TableShell>
      </SurfaceCard>
    </AdminPage>
  );
}

function DateField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-slate-700">{label}</label>
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
      />
    </div>
  );
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getDefaultFromDate() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().slice(0, 10);
}

function buildFallbackReport(groupBy: AdminReportGroupBy): AdminReportsPayload {
  const fallbackSeries = monthlyReportRows.map((row) => ({
    label: row.month,
    bookings: row.bookings,
    cancellations: row.cancellations,
    revenue: {
      amount: row.revenue.replace(/[^0-9.]/g, ""),
      currency: "USD",
    },
  }));

  return {
    range: {
      from: getDefaultFromDate(),
      to: getToday(),
      group_by: groupBy,
    },
    summary: {
      revenue: { amount: "184320", currency: "USD" },
      booking_volume: 1284,
      cancellation_rate: 6.1,
      refund_totals: { amount: "12480", currency: "USD" },
      customer_counts: 796,
      top_agencies: agencies.slice(0, 4).map((agency, index) => ({
        id: index + 1,
        key: agency.id,
        name: agency.name,
        bookings: agency.totalBookings,
        revenue: {
          amount: String(agency.revenueValue),
          currency: "USD",
        },
      })),
    },
    series: fallbackSeries,
  };
}

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

function formatPercentage(value?: number | null) {
  return `${(value ?? 0).toFixed(1)}%`;
}

function formatMoney(amount?: string | number | null, currency?: string | null) {
  const numericAmount = Number(amount ?? 0);
  const code = currency || "USD";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numericAmount) ? numericAmount : 0);
}

function buildCsv(report: AdminReportsPayload) {
  const headers = ["Period", "Bookings", "Cancellations", "Revenue"];
  const rows = report.series.map((row) => [
    row.label,
    String(row.bookings),
    String(row.cancellations),
    formatMoney(row.revenue.amount, row.revenue.currency),
  ]);

  const lines = [headers, ...rows].map((row) =>
    row
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(","),
  );

  return lines.join("\n");
}

function downloadText(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(filename, blob);
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
