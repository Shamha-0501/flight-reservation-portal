import Link from "next/link";

type PolicyPageProps = {
  title: string;
  summary: string;
  sections: Array<{
    heading: string;
    body: string[];
  }>;
  lastUpdated?: string;
};

export default function PolicyPage({
  title,
  summary,
  sections,
  lastUpdated = "July 11, 2026",
}: PolicyPageProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.1),transparent_24%),linear-gradient(180deg,#f8fbff_0%,#ffffff_48%,#f8fafc_100%)]">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-100 px-6 py-8 sm:px-8">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-600">
              Flight Portal
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
              {summary}
            </p>

            <div className="mt-4 inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Last updated {lastUpdated}
            </div>
          </div>

          <div className="grid gap-6 px-6 py-8 sm:px-8">
            {sections.map((section) => (
              <section key={section.heading} className="space-y-3">
                <h2 className="text-lg font-black tracking-tight text-slate-950">
                  {section.heading}
                </h2>
                <div className="space-y-3 text-sm leading-6 text-slate-600">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Need help right now?{" "}
              <Link href="/contact" className="font-semibold text-blue-700 hover:underline">
                Contact support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
