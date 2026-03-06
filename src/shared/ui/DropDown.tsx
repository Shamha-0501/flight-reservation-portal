"use client";

import { useEffect, useRef, useState } from "react";

type DropdownItem = {
  label: string;
  type: "critical" | "success" | "normal";
  onClick: () => void;
};

type DropDownProps = {
  placeholder: React.ReactNode; // e.g. <UserIcon />
  items: DropdownItem[]; // [{ label, onClick }]
};

export default function DropDown({ placeholder, items }: DropDownProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleItemClick = (item: DropdownItem) => {
    setOpen(false);
    item.onClick();
  };

  return (
    <div ref={wrapperRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-center h-8 w-8 rounded-full 
                   bg-gray-100 dark:bg-gray-800 border border-gray-300 
                   dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700
                   transition-colors"
      >
        {placeholder}
      </button>

      {/* Menu */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-44 rounded-xl bg-white 
                     dark:bg-gray-900 border border-gray-200 dark:border-gray-700
                     shadow-lg z-50 text-sm"
        >
          {items.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleItemClick(item)}
              className={`w-full text-left px-3 py-2 
                ${
                  item.type === "critical"
                    ? "text-red-700"
                    : item.type === "success"
                    ? "text-green-700"
                    : "text-gray-700"
                } dark:text-gray-200 
                ${
                  item.type === "critical"
                    ? "hover:bg-red-100"
                    : item.type === "success"
                    ? "hover:bg-green-100"
                    : "hover:bg-gray-100"
                }          
                ${
                  item.type === "critical"
                    ? "dark:hover:bg-red-900"
                    : item.type === "success"
                    ? "dark:hover:bg-green-900"
                    : "dark:hover:bg-gray-800"
                }
                ${
                  idx === 0
                    ? "rounded-t-xl"
                    : idx === items.length - 1
                    ? "rounded-b-xl"
                    : ""
                }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
