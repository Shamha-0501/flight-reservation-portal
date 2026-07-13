"use client";

export default function Quote() {
  return (
    <form className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2">
      <div className="sm:col-span-2">
        <div className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
          Free quote
        </div>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
          Request a tailored travel quote
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Share your travel dates and destination and the team can follow up with pricing and
          itinerary options.
        </p>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">Full name</span>
        <input
          type="text"
          placeholder="Your name"
          className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">Email</span>
        <input
          type="email"
          placeholder="name@example.com"
          className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">Destination</span>
        <input
          type="text"
          placeholder="Where are you going?"
          className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">Travel dates</span>
        <input
          type="text"
          placeholder="When do you plan to travel?"
          className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
        />
      </label>

      <label className="grid gap-2 sm:col-span-2">
        <span className="text-sm font-medium text-slate-700">Details</span>
        <textarea
          rows={4}
          placeholder="Tell us more about your trip"
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
        />
      </label>

      <div className="sm:col-span-2">
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Get quote
        </button>
      </div>
    </form>
  );
}
