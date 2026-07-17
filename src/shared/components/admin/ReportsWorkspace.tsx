"use client";

import { useEffect, useState } from "react";
import {
  BadgeDollarSign,
  CalendarDays,
  Download,
  FileText,
  RefreshCw,
  RotateCcw,
  TicketX,
  Users,
  WalletCards,
} from "lucide-react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  exportAdminReports,
  getAdminReports,
  type AdminReportGroupBy,
  type AdminReportFilters,
  type AdminReportsPayload,
} from "@/src/api/routes/admin/reports";
import {
  AdminButton,
  AdminPage,
  FilterSelect,
  LoadingSkeleton,
  SurfaceCard,
  TableShell,
} from "./AdminUI";

type ReportScope = "platform" | "tenant";

const groupByOptions: AdminReportGroupBy[] = ["week", "month", "year"];
const platformTabs = ["Agency Performance", "Overall Bookings", "Operations", "Airlines & Routes", "System Activity"];
const tenantTabs = ["Booking & Financial Summary", "Airlines & Routes", "Operational Requests", "Customers", "Add-on Usage"];

export function ReportsWorkspace({ scope, tenantName }: { scope: ReportScope; tenantName?: string }) {
  const [fromDate, setFromDate] = useState(getDefaultFromDate());
  const [toDate, setToDate] = useState(getToday());
  const [groupBy, setGroupBy] = useState<AdminReportGroupBy>("month");
  const [filters, setFilters] = useState<AdminReportFilters>({});
  const [activeTab, setActiveTab] = useState(0);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [report, setReport] = useState<AdminReportsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tabs = scope === "platform" ? platformTabs : tenantTabs;

  useEffect(() => {
    let active = true;

    async function load() {
      if (!fromDate || !toDate || fromDate > toDate) {
        setError("Choose a valid date range.");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const payload = await getAdminReports({ from: fromDate, to: toDate, group_by: groupBy, scope, ...filters });
        if (payload.scope.kind !== scope) {
          throw new Error("The report service returned data for a different access scope.");
        }
        if (active) setReport(payload);
      } catch (requestError) {
        if (active) {
          setReport(null);
          setError(requestError instanceof Error ? requestError.message : "Failed to load reports.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [filters, fromDate, groupBy, refreshNonce, scope, toDate]);

  const summary = report?.summary;
  const series = report?.series ?? [];
  const workspaceName = report?.scope.name ?? (scope === "platform" ? "Flight Portal" : (tenantName ?? "Tenant workspace"));
  const unavailableTab = isUnavailableTab(scope, activeTab);
  const airlinesAndRoutesTab = (scope === "platform" && activeTab === 3) || (scope === "tenant" && activeTab === 1);
  const systemActivityTab = scope === "platform" && activeTab === 4;
  const operationsTab = (scope === "platform" && activeTab === 2) || (scope === "tenant" && activeTab === 2);
  const customersTab = scope === "tenant" && activeTab === 3;
  const addonUsageTab = scope === "tenant" && activeTab === 4;

  async function exportReport(format: "csv" | "pdf") {
    try {
      const blob = await exportAdminReports({ from: fromDate, to: toDate, group_by: groupBy, format, scope, ...filters });
      downloadBlob(`${scope}-reports-${fromDate}-to-${toDate}.${format}`, blob);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to export this report.");
    }
  }

  function resetFilters() {
    setFromDate(getDefaultFromDate());
    setToDate(getToday());
    setGroupBy("month");
    setFilters({});
    setActiveTab(0);
  }

  return (
    <AdminPage
      eyebrow={scope === "platform" ? "Platform analytics" : "Tenant workspace · Reports"}
      title="Reports"
      description={scope === "platform" ? "A clear view of bookings, revenue, customers, and agency performance." : `Tenant-scoped reporting for ${workspaceName}.`}
      actions={<><AdminButton variant="secondary" onClick={() => exportReport("csv")} disabled={!report}><Download className="mr-2 h-4 w-4" />Export CSV</AdminButton><AdminButton variant="secondary" onClick={() => exportReport("pdf")} disabled={!report}><FileText className="mr-2 h-4 w-4" />Save as PDF</AdminButton></>}
    >
      <SurfaceCard className="border-slate-200 !p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-950">Report filters</h2>
            <p className="mt-0.5 text-xs text-slate-500">Choose a period and grouping to update every report section.</p>
          </div>
          <span className="mt-2 inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500 sm:mt-0">
            {capitalize(groupBy)} view
          </span>
        </div>
        <div className="grid gap-3 lg:grid-cols-[minmax(360px,1fr)_190px_auto]">
          <DateRangeField fromDate={fromDate} toDate={toDate} setFromDate={setFromDate} setToDate={setToDate} />
          <div className="space-y-1.5"><label className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Group by</label><FilterSelect value={capitalize(groupBy)} onChange={(value) => setGroupBy(value.toLowerCase() as AdminReportGroupBy)} options={groupByOptions.map(capitalize)} /></div>
          <div className="flex items-end justify-end gap-2"><AdminButton onClick={() => setRefreshNonce((value) => value + 1)}><RefreshCw className="mr-2 h-4 w-4" />Refresh</AdminButton><AdminButton variant="secondary" onClick={resetFilters}><RotateCcw className="h-4 w-4" /><span className="sr-only">Reset filters</span></AdminButton></div>
        </div>
        <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 xl:grid-cols-4">
          <ReportFilter label="Booking status" value={filters.booking_status ?? "All booking statuses"} options={["All booking statuses", ...(report?.filter_options.booking_statuses ?? [])]} onChange={(value) => setFilters((current) => setReportFilter(current, "booking_status", value, "All booking statuses"))} />
          <ReportFilter label="Cancellation status" value={filters.cancellation_status ?? "All cancellation statuses"} options={["All cancellation statuses", ...(report?.filter_options.cancellation_statuses ?? [])]} onChange={(value) => setFilters((current) => setReportFilter(current, "cancellation_status", value, "All cancellation statuses"))} />
          <ReportFilter label="Refund status" value={filters.refund_status ?? "All refund statuses"} options={["All refund statuses", ...(report?.filter_options.refund_statuses ?? [])]} onChange={(value) => setFilters((current) => setReportFilter(current, "refund_status", value, "All refund statuses"))} />
          <ReportFilter label="Airline" value={filters.airline ?? "All airlines"} options={["All airlines", ...(report?.filter_options.airlines ?? [])]} onChange={(value) => setFilters((current) => setReportFilter(current, "airline", value, "All airlines"))} />
          <ReportFilter label="Route" value={filters.route ?? "All routes"} options={["All routes", ...(report?.filter_options.routes ?? [])]} onChange={(value) => setFilters((current) => setReportFilter(current, "route", value, "All routes"))} />
        </div>
      </SurfaceCard>

      {error ? <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-800">{error}</div> : null}
      {loading && !report ? <LoadingSkeleton /> : null}

      {summary ? <KpiStrip summary={summary} growth={report?.comparison.growth} /> : null}

      <SurfaceCard className="overflow-hidden !p-0 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
        <div className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 pt-2">
          {tabs.map((tab, index) => <button key={tab} type="button" onClick={() => setActiveTab(index)} className={`relative whitespace-nowrap px-4 py-3 text-xs font-bold transition after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full ${activeTab === index ? "text-blue-700 after:bg-blue-600" : "text-slate-500 after:bg-transparent hover:bg-slate-50 hover:text-slate-900"}`}>{tab}</button>)}
        </div>
        {unavailableTab ? <UnavailablePanel title={tabs[activeTab]} /> : airlinesAndRoutesTab ? <AirlinesAndRoutesPanel report={report} /> : systemActivityTab ? <SystemActivityPanel activity={report?.system_activity ?? null} /> : operationsTab ? <OperationsPanel operations={report?.operations ?? null} /> : customersTab ? <CustomersPanel customers={report?.customers ?? null} /> : addonUsageTab ? <AddonUsagePanel addonUsage={report?.addon_usage ?? null} /> : summary ? <div className="grid xl:grid-cols-[minmax(0,1.62fr)_minmax(300px,0.78fr)]"><div className="p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-bold tracking-tight text-slate-950">{capitalize(groupBy)} bookings & booking value</h2><p className="mt-1 text-xs text-slate-500">Order volume and total order value for the selected period.</p></div><span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700">{series.length} periods</span></div><PerformanceChart series={series} currency={summary.revenue.currency} /><div className="mt-2 grid border-t border-slate-200 sm:grid-cols-2 xl:grid-cols-4"><ChartMetric label="Average booking value" value={formatMoney(safeDivide(Number(summary.revenue.amount), summary.booking_volume), summary.revenue.currency)} /><ChartMetric label="Refund value share" value={formatPercent(safeDivide(Number(summary.refund_totals.amount) * 100, Number(summary.revenue.amount)))} /><ChartMetric label="Cancellation requests" value={formatNumber(series.reduce((total, item) => total + item.cancellations, 0))} /><ChartMetric label="Customers per booking" value={safeDivide(summary.customer_counts, summary.booking_volume).toFixed(2)} /></div></div><BookingBreakdown summary={summary} series={series} /></div> : <div className="p-6"><LoadingSkeleton /></div>}
      </SurfaceCard>

      <div className={`grid gap-5 ${scope === "platform" ? "xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,0.8fr)]" : ""}`}>
        <SurfaceCard title="Grouped performance" description="The exact source data used in the chart and exports."><TableShell columns={["Period", "Bookings", "Cancellations", "Booking value"]}>{series.map((row) => <tr key={row.label}><td className="px-4 py-3.5 text-sm font-bold text-slate-950">{row.label}</td><td className="px-4 py-3.5 text-sm text-slate-600">{formatNumber(row.bookings)}</td><td className="px-4 py-3.5 text-sm text-slate-600">{formatNumber(row.cancellations)}</td><td className="px-4 py-3.5 text-sm font-bold text-slate-950">{formatMoney(row.revenue.amount, row.revenue.currency)}</td></tr>)}</TableShell></SurfaceCard>
        {scope === "platform" ? <AgencyRanking report={report} /> : null}
      </div>
    </AdminPage>
  );
}

function KpiStrip({ summary, growth }: { summary: AdminReportsPayload["summary"]; growth?: AdminReportsPayload["comparison"]["growth"] }) {
  const items = [
    { label: "Total bookings", value: formatNumber(summary.booking_volume), change: growth?.booking_volume, icon: BadgeDollarSign, tone: "bg-blue-50 text-blue-600" },
    { label: "Booking value", value: formatMoney(summary.revenue.amount, summary.revenue.currency), change: growth?.revenue, icon: WalletCards, tone: "bg-cyan-50 text-cyan-600" },
    { label: "Refund totals", value: formatMoney(summary.refund_totals.amount, summary.refund_totals.currency), change: growth?.refund_totals, icon: CalendarDays, tone: "bg-amber-50 text-amber-600" },
    { label: "Cancellation rate", value: formatPercent(summary.cancellation_rate), icon: TicketX, tone: "bg-rose-50 text-rose-600" },
    { label: "Total customers", value: formatNumber(summary.customer_counts), change: growth?.customer_counts, icon: Users, tone: "bg-violet-50 text-violet-600" },
  ];
  return <section className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.04)] sm:grid-cols-2 xl:grid-cols-5">{items.map((item) => { const Icon = item.icon; const changeText = item.change === null || item.change === undefined ? "No prior-period baseline" : `${item.change >= 0 ? "+" : ""}${item.change.toFixed(1)}% vs previous period`; return <article key={item.label} className="group relative border-b border-slate-200 p-5 transition hover:bg-slate-50/60 last:border-b-0 sm:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:last:border-r-0"><div className="flex items-center gap-3"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.tone}`}><Icon className="h-4 w-4" /></div><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">{item.label}</p></div><p className="mt-4 truncate text-[1.35rem] font-bold tracking-tight text-slate-950">{item.value}</p><div className="mt-2 flex items-center gap-1.5"><span className={`h-1.5 w-1.5 rounded-full ${item.change === null || item.change === undefined ? "bg-slate-300" : item.change >= 0 ? "bg-emerald-500" : "bg-rose-500"}`} /><p className={`text-[11px] font-medium ${item.change === null || item.change === undefined ? "text-slate-400" : item.change >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{changeText}</p></div></article>; })}</section>;
}

function PerformanceChart({ series, currency }: { series: AdminReportsPayload["series"]; currency: string }) {
  // The two series share periods but use separate scales: booking count on the left and booking value on the right.
  const data = series.map((item) => ({ period: item.label, bookings: item.bookings, bookingValue: Number(item.revenue.amount) }));
  return <div className="mt-5"><div className="mb-3 flex flex-wrap gap-4 text-[11px] font-bold text-slate-500"><Legend color="bg-blue-600" label="Bookings" /><Legend color="bg-cyan-400" label={`Booking value (${currency})`} /></div><div className="h-[300px] min-w-0"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={data} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}><defs><linearGradient id="reports-booking-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} /><stop offset="100%" stopColor="#2563eb" stopOpacity={0.01} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 5" /><XAxis dataKey="period" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 10, fontWeight: 600 }} tickFormatter={shortLabel} interval="preserveStartEnd" minTickGap={22} /><YAxis yAxisId="bookings" tickLine={false} axisLine={false} width={42} tick={{ fill: "#64748b", fontSize: 10 }} allowDecimals={false} /><YAxis yAxisId="value" orientation="right" tickLine={false} axisLine={false} width={56} tick={{ fill: "#64748b", fontSize: 10 }} tickFormatter={(value) => formatCompactMoney(Number(value), currency)} /><Tooltip cursor={{ stroke: "#cbd5e1", strokeDasharray: "3 3" }} content={<PerformanceTooltip currency={currency} />} /><Area yAxisId="bookings" type="monotone" dataKey="bookings" stroke="#2563eb" strokeWidth={2.5} fill="url(#reports-booking-area)" activeDot={false} animationDuration={500} /><Line yAxisId="value" type="monotone" dataKey="bookingValue" stroke="#22c5d5" strokeWidth={2.5} dot={false} activeDot={{ r: 3.5, fill: "#22c5d5", stroke: "#ffffff", strokeWidth: 2 }} animationDuration={500} /></ComposedChart></ResponsiveContainer></div></div>;
}

function BookingBreakdown({ summary, series }: { summary: AdminReportsPayload["summary"]; series: AdminReportsPayload["series"] }) {
  // Cancellation requests are the only booking-status breakdown returned by the current report API.
  const cancellations = Math.min(summary.booking_volume, series.reduce((total, item) => total + item.cancellations, 0));
  const withoutCancellation = Math.max(summary.booking_volume - cancellations, 0);
  const data = [{ name: "No cancellation request", value: withoutCancellation, percent: safeDivide(withoutCancellation * 100, summary.booking_volume), fill: "#2563eb" }, { name: "Cancellation requested", value: cancellations, percent: safeDivide(cancellations * 100, summary.booking_volume), fill: "#fb7185" }];
  return <aside className="border-t border-slate-200 bg-slate-50/60 p-5 sm:p-6 xl:border-l xl:border-t-0"><h2 className="text-base font-bold tracking-tight text-slate-950">Booking requests</h2><p className="mt-1 text-xs text-slate-500">Status available from the current report service.</p><div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-center"><div className="relative h-[220px] w-full max-w-[220px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Tooltip content={<BreakdownTooltip />} /><Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="58%" outerRadius="82%" paddingAngle={3} cornerRadius={5} animationDuration={500}>{data.map((item) => <Cell key={item.name} fill={item.fill} />)}</Pie></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"><strong className="text-2xl font-bold tracking-tight text-slate-950">{formatNumber(summary.booking_volume)}</strong><span className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">Orders</span></div></div><div className="w-full space-y-3">{data.map((item) => <BreakdownRow key={item.name} color={item.fill === "#2563eb" ? "bg-blue-600" : "bg-rose-400"} label={item.name} value={item.value} percent={item.percent} />)}</div></div></aside>;
}

function AgencyRanking({ report }: { report: AdminReportsPayload | null }) {
  // Platform-only ranking: the backend already scopes and limits agencies to the top five by booking count.
  const agencies = report?.summary.top_agencies ?? [];
  const data = agencies.map((agency) => ({ name: agency.name, bookings: agency.bookings, revenue: Number(agency.revenue.amount), currency: agency.revenue.currency }));
  const chartHeight = Math.max(220, data.length * 48);
  return <SurfaceCard title="Agency performance" description="Top authorized agencies by booking count.">{data.length ? <div className="min-w-0" style={{ height: chartHeight }}><ResponsiveContainer width="100%" height="100%"><BarChart data={data} layout="vertical" margin={{ top: 4, right: 8, left: 12, bottom: 0 }}><CartesianGrid horizontal={false} stroke="#e2e8f0" strokeDasharray="3 5" /><XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 10 }} allowDecimals={false} /><YAxis type="category" dataKey="name" width={92} tickLine={false} axisLine={false} tick={{ fill: "#475569", fontSize: 11, fontWeight: 600 }} tickFormatter={(value) => String(value).length > 15 ? `${String(value).slice(0, 14)}…` : value} /><Tooltip cursor={{ fill: "#eff6ff" }} content={<AgencyTooltip />} /><Bar dataKey="bookings" fill="#2563eb" radius={[0, 6, 6, 0]} animationDuration={500} /></BarChart></ResponsiveContainer></div> : <p className="py-8 text-center text-sm text-slate-500">No agency performance data is available for this range.</p>}</SurfaceCard>;
}

function AirlinesAndRoutesPanel({ report }: { report: AdminReportsPayload | null }) {
  const data = report?.airlines_and_routes;
  if (!data) return <div className="p-6"><LoadingSkeleton /></div>;
  return <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2"><DimensionPanel title="Top airlines" description="Primary carrier stored with booked offers." rows={data.top_airlines} emptyMessage="No stored airline data was found for this period." /><DimensionPanel title="Top routes" description="Outbound origin and destination from stored booked offers." rows={data.top_routes} emptyMessage="No stored route data was found for this period." /></div>;
}

function DimensionPanel({ title, description, rows, emptyMessage }: { title: string; description: string; rows: AdminReportsPayload["airlines_and_routes"]["top_airlines"]; emptyMessage: string }) {
  const maximum = Math.max(...rows.map((item) => item.bookings), 1);
  return <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5"><h2 className="text-base font-bold text-slate-950">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>{rows.length ? <div className="mt-5 space-y-4">{rows.map((item, index) => <div key={item.key}><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><span className="text-xs font-bold text-blue-600">{index + 1}</span><p className="truncate text-sm font-bold text-slate-900">{item.name}</p></div><p className="shrink-0 text-xs font-bold text-slate-900">{formatNumber(item.bookings)} bookings</p></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-blue-600" style={{ width: `${(item.bookings / maximum) * 100}%` }} /></div><p className="mt-1.5 text-right text-[11px] font-medium text-slate-500">{formatMoney(item.revenue.amount, item.revenue.currency)}</p></div>)}</div> : <p className="py-10 text-center text-sm text-slate-500">{emptyMessage}</p>}</section>;
}

function SystemActivityPanel({ activity }: { activity: AdminReportsPayload["system_activity"] }) {
  if (!activity) return <div className="p-6"><LoadingSkeleton /></div>;
  // Activity events are grouped by their persisted action key for the selected report period.
  const chartData = activity.top_actions.map((item) => ({ action: item.action, events: item.count }));
  return <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"><section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5"><p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">System events</p><p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{formatNumber(activity.total_events)}</p><p className="mt-1 text-xs text-slate-500">Recorded in the selected date range.</p>{chartData.length ? <div className="mt-5 h-[220px] min-w-0"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}><CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 5" /><XAxis dataKey="action" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 10 }} tickFormatter={shortLabel} interval="preserveStartEnd" /><YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 10 }} /><Tooltip content={<ActionTooltip />} /><Bar dataKey="events" fill="#2563eb" radius={[6, 6, 0, 0]} animationDuration={500} /></BarChart></ResponsiveContainer></div> : <p className="py-10 text-center text-sm text-slate-500">No activity events were recorded for this period.</p>}</section><section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-base font-bold text-slate-950">Recent activity</h2><p className="mt-1 text-xs text-slate-500">Latest recorded platform events.</p>{activity.recent_events.length ? <div className="mt-4 divide-y divide-slate-100">{activity.recent_events.map((event) => <div key={event.id} className="py-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{event.title}</p><p className="mt-1 truncate text-xs text-slate-500">{event.actor_name ?? "System"}{event.tenant_name ? ` · ${event.tenant_name}` : ""}</p></div><time className="shrink-0 text-[11px] font-medium text-slate-400">{formatDateTime(event.created_at)}</time></div></div>)}</div> : <p className="py-10 text-center text-sm text-slate-500">No activity events were recorded for this period.</p>}</section></div>;
}

function OperationsPanel({ operations }: { operations: AdminReportsPayload["operations"] | null }) {
  if (!operations) return <div className="p-6"><LoadingSkeleton /></div>;
  const items = [["Pending cancellations", operations.pending_cancellations, "bg-rose-50 text-rose-700"], ["Pending refunds", operations.pending_refunds, "bg-amber-50 text-amber-700"], ["Rescheduled orders", operations.rescheduled_orders, "bg-violet-50 text-violet-700"], ["Refunded orders", operations.refunded_orders, "bg-emerald-50 text-emerald-700"]] as const;
  return <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">{items.map(([label, value, tone]) => <section key={label} className={`rounded-2xl border border-slate-200 p-5 ${tone}`}><p className="text-xs font-bold">{label}</p><p className="mt-3 text-3xl font-bold tracking-tight">{formatNumber(value)}</p><p className="mt-2 text-[11px] font-medium opacity-70">Selected date range</p></section>)}</div>;
}

function CustomersPanel({ customers }: { customers: AdminReportsPayload["customers"] | null }) {
  if (!customers) return <div className="p-6"><LoadingSkeleton /></div>;
  return <div className="p-5 sm:p-6"><h2 className="text-base font-bold text-slate-950">Top customers by booking count</h2><p className="mt-1 text-xs text-slate-500">Customers with recorded user accounts in the selected period.</p>{customers.top_customers.length ? <div className="mt-5 overflow-hidden rounded-xl border border-slate-200"><TableShell columns={["Customer", "Bookings", "Booking value"]}>{customers.top_customers.map((customer) => <tr key={customer.id}><td className="px-4 py-3"><p className="text-sm font-bold text-slate-900">{customer.name ?? "Unnamed customer"}</p><p className="text-xs text-slate-500">{customer.email ?? "No email"}</p></td><td className="px-4 py-3 text-sm font-semibold text-slate-700">{formatNumber(customer.bookings)}</td><td className="px-4 py-3 text-sm font-bold text-slate-900">{formatMoney(customer.booking_value.amount, customer.booking_value.currency)}</td></tr>)}</TableShell></div> : <p className="py-10 text-center text-sm text-slate-500">No customer-linked bookings were found for this period.</p>}</div>;
}

function AddonUsagePanel({ addonUsage }: { addonUsage: AdminReportsPayload["addon_usage"] | null }) {
  if (!addonUsage) return <div className="p-6"><LoadingSkeleton /></div>;
  const maximum = Math.max(...addonUsage.items.map((item) => item.usage), 1);
  return <div className="p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="text-base font-bold text-slate-950">Add-on usage</h2><p className="mt-1 text-xs text-slate-500">Booked platform add-ons in the selected period.</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{formatNumber(addonUsage.total_usage)} uses</span></div>{addonUsage.items.length ? <div className="mt-5 space-y-4">{addonUsage.items.map((item) => <div key={item.code}><div className="flex items-center justify-between gap-3"><p className="text-sm font-bold text-slate-900">{item.name}</p><p className="text-xs font-bold text-slate-900">{formatNumber(item.usage)} uses</p></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${(item.usage / maximum) * 100}%` }} /></div><p className="mt-1.5 text-right text-[11px] text-slate-500">{formatMoney(item.value.amount, item.value.currency)}</p></div>)}</div> : <p className="py-10 text-center text-sm text-slate-500">No booked platform add-ons were found for this period.</p>}</div>;
}

type ChartTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: Array<{ payload?: Record<string, unknown> }>;
};

function PerformanceTooltip({ active, label, payload, currency }: ChartTooltipProps & { currency: string }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as { bookings?: number; bookingValue?: number } | undefined;
  if (!point) return null;
  return <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs shadow-xl"><p className="font-bold text-slate-900">{label}</p><div className="mt-2 space-y-1.5"><p className="flex justify-between gap-6 text-slate-600"><span>Bookings</span><strong className="text-slate-900">{formatNumber(point.bookings)}</strong></p><p className="flex justify-between gap-6 text-slate-600"><span>Booking value</span><strong className="text-slate-900">{formatMoney(point.bookingValue, currency)}</strong></p></div></div>;
}

function BreakdownTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as { name?: string; value?: number; percent?: number } | undefined;
  if (!point) return null;
  return <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs shadow-xl"><p className="font-bold text-slate-900">{point.name}</p><p className="mt-2 text-slate-600"><strong className="text-slate-900">{formatNumber(point.value)}</strong> orders ({formatPercent(point.percent)})</p></div>;
}

function AgencyTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as { name?: string; bookings?: number; revenue?: number; currency?: string } | undefined;
  if (!point) return null;
  return <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs shadow-xl"><p className="font-bold text-slate-900">{point.name}</p><div className="mt-2 space-y-1.5 text-slate-600"><p>Bookings: <strong className="text-slate-900">{formatNumber(point.bookings)}</strong></p><p>Revenue: <strong className="text-slate-900">{formatMoney(point.revenue, point.currency)}</strong></p></div></div>;
}

function ActionTooltip({ active, label, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as { events?: number } | undefined;
  return <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs shadow-xl"><p className="font-bold text-slate-900">{label}</p><p className="mt-2 text-slate-600"><strong className="text-slate-900">{formatNumber(point?.events)}</strong> events</p></div>;
}
function DateRangeField({ fromDate, toDate, setFromDate, setToDate }: { fromDate: string; toDate: string; setFromDate: (value: string) => void; setToDate: (value: string) => void }) { return <div className="space-y-1.5"><label className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Date range</label><div className="flex h-11 items-center rounded-xl border border-slate-200 bg-white px-3"><input aria-label="Report start date" type="date" value={fromDate} max={toDate} onChange={(event) => setFromDate(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none" /><span className="mx-2 text-slate-300">-</span><input aria-label="Report end date" type="date" value={toDate} min={fromDate} onChange={(event) => setToDate(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none" /></div></div>; }
function ReportFilter({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) { return <div className="space-y-1.5"><label className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">{label}</label><FilterSelect value={value} options={options} onChange={onChange} /></div>; }
function setReportFilter(filters: AdminReportFilters, key: keyof AdminReportFilters, value: string, allValue: string): AdminReportFilters { const next = { ...filters }; if (value === allValue) delete next[key]; else next[key] = value as never; return next; }
function ChartMetric({ label, value }: { label: string; value: string }) { return <div className="border-b border-slate-200 px-3 py-4 last:border-b-0 sm:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:last:border-r-0"><p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500">{label}</p><p className="mt-1.5 truncate text-sm font-bold text-slate-950">{value}</p><p className="mt-1 text-[10px] font-medium text-emerald-600">Selected period</p></div>; }
function Legend({ color, label }: { color: string; label: string }) { return <span className="inline-flex items-center gap-1.5"><i className={`h-2 w-2 rounded-full ${color}`} />{label}</span>; }
function BreakdownRow({ color, label, value, percent }: { color: string; label: string; value: number; percent: number }) { return <div className="flex items-center justify-between gap-3 text-xs"><span className="flex items-center gap-2 font-semibold text-slate-600"><i className={`h-2.5 w-2.5 rounded-full ${color}`} />{label}</span><span className="font-bold text-slate-900">{formatNumber(value)} <span className="font-medium text-slate-400">({formatPercent(percent)})</span></span></div>; }
function UnavailablePanel({ title }: { title: string }) { return <div className="p-8 sm:p-10"><div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center"><p className="text-sm font-bold text-slate-900">{title} is not available yet</p><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">The report API does not currently aggregate the records needed for this area. This screen deliberately shows no sample values.</p></div></div>; }
function isUnavailableTab(_scope: ReportScope, _activeTab: number) { return false; }
function getToday() { return new Date().toISOString().slice(0, 10); }
function getDefaultFromDate() { const date = new Date(); date.setDate(date.getDate() - 30); return date.toISOString().slice(0, 10); }
function capitalize(value: string) { return value.charAt(0).toUpperCase() + value.slice(1); }
function shortLabel(value: string) { return value.length > 10 ? value.slice(0, 9) : value; }
function safeDivide(value: number, divisor: number) { return divisor ? value / divisor : 0; }
function formatNumber(value?: number | null) { return new Intl.NumberFormat("en-US").format(value ?? 0); }
function formatPercent(value?: number | null) { return `${(value ?? 0).toFixed(1)}%`; }
function formatMoney(amount?: string | number | null, currency?: string | null) { const numericAmount = Number(amount ?? 0); const code = currency || "LKR"; return new Intl.NumberFormat("en-LK", { style: "currency", currency: code, maximumFractionDigits: 2 }).format(Number.isFinite(numericAmount) ? numericAmount : 0); }
function formatCompactMoney(amount: number, currency: string) { return new Intl.NumberFormat("en-LK", { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 }).format(Number.isFinite(amount) ? amount : 0); }
function formatDateTime(value: string | null) { return value ? new Intl.DateTimeFormat("en-LK", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value)) : "-"; }
function downloadBlob(filename: string, blob: Blob) { const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url); }
