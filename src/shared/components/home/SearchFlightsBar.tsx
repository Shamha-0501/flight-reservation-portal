"use client";

export default function SearchFlightsBar() {
  return (
    <div
      className="
        rounded-2xl
        border border-white/30
        bg-white/20
        backdrop-blur-md
        shadow-2xl
        p-4 sm:p-5
      "
    >
      {/* Optional title */}
      <div className="mb-3">
        <h2 className="text-sm sm:text-base font-semibold text-white">
          Search Flights
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {/* From */}
        <div>
          <label className="text-xs text-white/80">From</label>
          <input
            placeholder="City or Airport"
            className="
              mt-1 w-full h-11
              rounded-xl
              bg-white
              border border-gray-200
              px-3 text-sm text-gray-900
              outline-none
              focus:ring-2 focus:ring-blue-500
            "
          />
        </div>

        {/* To */}
        <div>
          <label className="text-xs text-white/80">To</label>
          <input
            placeholder="City or Airport"
            className="
              mt-1 w-full h-11
              rounded-xl
              bg-white
              border border-gray-200
              px-3 text-sm text-gray-900
              outline-none
              focus:ring-2 focus:ring-blue-500
            "
          />
        </div>

        {/* Date */}
        <div>
          <label className="text-xs text-white/80">Departure</label>
          <input
            type="date"
            className="
              mt-1 w-full h-11
              rounded-xl
              bg-white
              border border-gray-200
              px-3 text-sm text-gray-900
              outline-none
              focus:ring-2 focus:ring-blue-500
            "
          />
        </div>

        {/* Passengers */}
        <div>
          <label className="text-xs text-white/80">Passengers</label>
          <input
            type="number"
            min={1}
            defaultValue={1}
            className="
              mt-1 w-full h-11
              rounded-xl
              bg-white
              border border-gray-200
              px-3 text-sm text-gray-900
              outline-none
              focus:ring-2 focus:ring-blue-500
            "
          />
        </div>

        {/* Search button */}
        <div className="flex items-end">
          <button
            type="button"
            className="
              w-full h-11
              rounded-xl
              bg-blue-600
              text-white text-sm font-semibold
              hover:bg-blue-700 transition
            "
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
}
