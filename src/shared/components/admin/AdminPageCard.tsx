import type { LucideIcon } from "lucide-react";

type AdminPageCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function AdminPageCard({
  title,
  description,
  icon: Icon,
}: AdminPageCardProps) {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-sky-500 p-6 text-white sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15">
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-100">
                Admin
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                {title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                {description}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">
          {title}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          {description}
        </p>
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Icon className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-950">
            Admin tools coming soon
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            This workspace is ready for backend dashboard APIs and operational
            workflows.
          </p>
        </div>
      </section>
    </div>
  );
}
