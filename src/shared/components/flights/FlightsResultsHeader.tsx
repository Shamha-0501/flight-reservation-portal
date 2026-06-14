type Props = {
  loading: boolean;
  error: string | null;
  resultCount: number;
  hasSearch: boolean;
};

function SortIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
    >
      <path d="M8 6h12" />
      <path d="M4 12h16" />
      <path d="M10 18h10" />
    </svg>
  );
}

export default function FlightsResultsHeader({
  loading,
  error,
  resultCount,
  hasSearch,
}: Props) {
  let title = "Flight results";
  let subtitle = "Refine your search to find the best option.";

  if (!hasSearch) {
    title = "Search for flights";
    subtitle = "Enter origin, destination, and departure date to begin.";
  } else if (loading) {
    title = "Searching flights...";
    subtitle = "We are finding the best available options for your trip.";
  } else if (error) {
    title = "Unable to load flights";
    subtitle = error;
  } else {
    title = `${resultCount} available flights`;
    subtitle = "Browse results and refine them with filters.";
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-slate-50 to-blue-50/40 px-6 py-5 shadow-[0_8px_30px_rgba(37,99,235,0.08)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/70 to-transparent" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-500">
            Flight results
          </div>

          <div className="mt-1 text-[34px] font-extrabold leading-tight tracking-tight text-slate-900">
            {title}
          </div>

          <div className="mt-1 text-sm text-slate-500">{subtitle}</div>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
        >
          <SortIcon />
          Sort: Best match
        </button>
      </div>
    </div>
  );
}