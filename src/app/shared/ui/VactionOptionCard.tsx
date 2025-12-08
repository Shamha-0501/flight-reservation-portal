import React from "react";
import { VactionOption } from "../constants/vacations";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";

export default function VactionOptionCard({
  tags,
  image: Icon,
  color,
  gradient,
  title,
  price,
  description,
  features,
  hasExpert,
  hasSupport,
  hasAccountManager,
}: VactionOption) {
  return (
    <div className="relative group max-w-xs h-[540px] bg-neutral-800 p-8 rounded-3xl hover:-mt-4 transition-all duration-500">
      <div className="flex items-center gap-2">
        {tags.map((tag, idx) => (
          <h5
            key={idx}
            className="px-3 py-2 border border-neutral-600/50 bg-neutral-700/50 text-xs/tight rounded-2xl text-gray-100"
          >
            {tag}
          </h5>
        ))}
      </div>
      {/* <div className="w-15 h-15 border border-neutral-600/50 bg-neutral-700/50 mt-5 flex items-center justify-center rounded-2xl">
        <Icon size={40} className={`${color}`} />
      </div> */}
      <h2 className="text-2xl font-semibold mt-5 text-gray-100 h-10">
        {title}
      </h2>
      <p className="text-sm font-light mt-5 text-gray-400">
        Starting from{" "}
        <span className="text-gray-100 text-3xl font-bold">{price}</span> PP
      </p>
      <p className="text-sm font-light mt-5 text-gray-400 h-14">
        {description}
      </p>
      <ul className="mt-5 list-disc marker:text-emerald-500 marker:text-xl ms-4 h-38">
        {features.map((feat, idx) => (
          <li key={idx} className="mt-3 text-neutral-300 text-sm">
            {feat}
          </li>
        ))}
      </ul>
      <Link
        href={""}
        className="group-hover:bg-emerald-500 group-hover:text-gray-100 transition-all duration-300 flex items-center justify-center gap-2 p-4 bg-gray-100 text-black mt-5 rounded-2xl font-bold"
      >
        Get a quote <ArrowRight />
      </Link>
    </div>
  );
}
