import type { LucideIcon } from "lucide-react";

type Props = {
  title: string;
  description: string;
  Icon: LucideIcon;
};

export default function FeatureCard({ title, description, Icon }: Props) {
  return (
    <div
      className="
        w-full max-w-[320px] mx-auto
    h-full rounded-2xl bg-white dark:bg-gray-900 text-center
    px-8 py-10
    shadow-[0_10px_25px_rgba(0,0,0,0.10)]
    ring-1 ring-primary-200 dark:ring-gray-700
    transition
    hover:-translate-y-0.5 hover:shadow-[0_16px_35px_rgba(0,0,0,0.14)]
      "
    >
      {/* Icon box */}
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-700">
        <Icon className="h-7 w-7 text-white" />
      </div>

      <h3 className="mt-6 text-xl font-extrabold text-gray-900 dark:text-white">
        {title}
      </h3>

      <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-300">
        {description}
      </p>
    </div>
  );
}
