"use client";

export default function SearchFlightsBar() {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200/70 dark:border-gray-800/70 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
          Search Flights
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {/* From */}
        <div className="md:col-span-1">
          <label className="text-xs text-gray-500 dark:text-gray-400">From</label>
          <input
            placeholder="City or Airport"
            className="mt-1 w-full h-10 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* To */}
        <div className="md:col-span-1">
          <label className="text-xs text-gray-500 dark:text-gray-400">To</label>
          <input
            placeholder="City or Airport"
            className="mt-1 w-full h-10 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Date */}
        <div className="md:col-span-1">
          <label className="text-xs text-gray-500 dark:text-gray-400">Departure</label>
          <input
            type="date"
            className="mt-1 w-full h-10 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Passengers */}
        <div className="md:col-span-1">
          <label className="text-xs text-gray-500 dark:text-gray-400">Passengers</label>
          <input
            type="number"
            min={1}
            defaultValue={1}
            className="mt-1 w-full h-10 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Search button */}
        <div className="md:col-span-1 flex items-end">
          <button
            type="button"
            className="w-full h-10 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
}
