"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

export type PreviewDropdownOption = {
  value: string;
  label: string;
};

type PreviewDropdownProps = {
  value: string;
  options: PreviewDropdownOption[];
  placeholder: string;
  onChange: (value: string) => void;
  className?: string;
  menuClassName?: string;
};

export default function PreviewDropdown({
  value,
  options,
  placeholder,
  onChange,
  className,
  menuClassName,
}: PreviewDropdownProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const rafIdRef = useRef<number | null>(null);

  const [open, setOpen] = useState(false);
  const [previewValue, setPreviewValue] = useState(value);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value]
  );
  const previewOption = useMemo(
    () => options.find((option) => option.value === previewValue) ?? null,
    [options, previewValue]
  );

  const headerLabel = open
    ? previewOption?.label ?? selectedOption?.label ?? placeholder
    : selectedOption?.label ?? placeholder;

  useEffect(() => {
    if (!open) return;

    function onDocumentClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setPreviewValue(value);
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setPreviewValue(value);
      }
    }

    document.addEventListener("mousedown", onDocumentClick);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open, value]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  const syncPreviewFromScroll = () => {
    if (!listRef.current || options.length === 0) return;
    const listRect = listRef.current.getBoundingClientRect();
    const listCenterY = listRect.top + listRect.height / 2;

    let nearestValue = options[0].value;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const option of options) {
      const node = optionRefs.current[option.value];
      if (!node) continue;
      const rect = node.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const distance = Math.abs(centerY - listCenterY);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestValue = option.value;
      }
    }

    setPreviewValue(nearestValue);
  };

  const onListScroll = () => {
    if (rafIdRef.current != null) {
      cancelAnimationFrame(rafIdRef.current);
    }
    rafIdRef.current = requestAnimationFrame(syncPreviewFromScroll);
  };

  const openDropdown = () => {
    setPreviewValue(value);
    setOpen(true);
    const selectedNode = optionRefs.current[value];
    if (selectedNode) {
      selectedNode.scrollIntoView({ block: "nearest" });
    }
  };

  const closeDropdown = () => {
    setOpen(false);
    setPreviewValue(value);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          if (open) {
            closeDropdown();
            return;
          }
          openDropdown();
        }}
        className={clsx(
          "h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-left text-sm text-slate-900 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100",
          className
        )}
      >
        <span className={clsx(!selectedOption && !open && "text-slate-400")}>
          {headerLabel}
        </span>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            className={clsx("transition-transform", open && "rotate-180")}
          >
            <path
              d="M6 9L12 15L18 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open && (
        <div
          ref={listRef}
          onScroll={onListScroll}
          className={clsx(
            "absolute left-0 right-0 top-full z-40 mt-2 max-h-52 overflow-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-xl",
            menuClassName
          )}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                ref={(node) => {
                  optionRefs.current[option.value] = node;
                }}
                type="button"
                onMouseEnter={() => setPreviewValue(option.value)}
                onFocus={() => setPreviewValue(option.value)}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={clsx(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition",
                  isSelected
                    ? "bg-blue-50 font-semibold text-blue-700"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <span>{option.label}</span>
                {isSelected ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="text-blue-600"
                  >
                    <path
                      d="M5 10.5L8.5 14L15 7.5"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
