type Props = {
  loading: boolean;
  error: string | null;
  resultCount: number;
  hasSearch: boolean;
};

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
    <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Flight results
          </div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {title}
          </div>
          <div className="mt-1 text-sm text-slate-500">{subtitle}</div>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
            Sort: Best match
          </div>
        </div>
      </div>
    </div>
  );
}