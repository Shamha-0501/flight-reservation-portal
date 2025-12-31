import type { ReactNode } from "react";

type FeatureCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
};

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/70 dark:border-gray-800/70 shadow-sm p-6">
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
          {icon}
        </div>

        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
