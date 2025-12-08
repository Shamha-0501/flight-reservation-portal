"use client";
import { useEffect, useState } from "react";
import { VACATION_OPTIONS, VactionOption } from "../../constants/vacations";
import VactionOptionCard from "../../ui/VactionOptionCard";

export default function ChooseYourPerfectJourney() {
  const [vacationOptions, setVactionOptions] = useState<VactionOption[]>([]);

  useEffect(() => {
    setVactionOptions(VACATION_OPTIONS.slice(0, 3));
  }, []);

  return (
    <div className="bg-neutral-900 justify-items-center items-center w-full">
      <div className="w-[90%] max-w-5xl py-20 flex-col justify-items-center">
        <h1 className="text-gray-100 text-4xl font-bold text-center w-full">
          Choose Your Perfect Journey
        </h1>
        <p className="text-gray-500 text-lg mt-5 w-4/5 text-center">
          We've curated three distinct travel styles to match your personal
          preferences.
          <br />
          Whether you seek solitude, company, or pure relaxation, we have the
          perfect plan.
        </p>
        <div className="flex items-center gap-6 mt-10">
          {vacationOptions.map((vacation, idx) => (
            <VactionOptionCard
              key={idx}
              tags={vacation.tags}
              image={vacation.image}
              color={vacation.color}
              gradient={vacation.gradient}
              title={vacation.title}
              price={vacation.price}
              description={vacation.description}
              features={vacation.features}
              hasExpert={vacation.hasExpert}
              hasSupport={vacation.hasSupport}
              hasAccountManager={vacation.hasAccountManager}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
