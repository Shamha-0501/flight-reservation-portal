import type { AdminReportFilters } from "@/src/api/routes/admin/reports";

export function setReportFilter(
  filters: AdminReportFilters,
  key: keyof AdminReportFilters,
  value: string,
  allValue: string,
): AdminReportFilters {
  const next = { ...filters };
  if (value === allValue) delete next[key];
  else next[key] = value as never;
  return next;
}

export function safeDivide(value: number, divisor: number) {
  return divisor ? value / divisor : 0;
}

export function formatPercent(value?: number | null) {
  return `${(value ?? 0).toFixed(1)}%`;
}
