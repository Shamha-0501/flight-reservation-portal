"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const SIZE_MAP = {
  md: {
    btn: "h-10 w-10 rounded-md",
    num: "text-sm font-medium",
    gap: "gap-2",
    pad: "px-2 py-2",
    icon: 18,
  },
  sm: {
    btn: "h-8 w-8 rounded",
    num: "text-xs font-medium",
    gap: "gap-1",
    pad: "px-1.5 py-1.5",
    icon: 14,
  },
} as const;

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  fullWidth?: boolean;
  size?: keyof typeof SIZE_MAP;
};

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
  fullWidth = true,
  size = "md",
}: PaginationProps) {
  const s = SIZE_MAP[size];
  const [showPages, setShowPages] = useState(10);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setShowPages(3);
      else if (window.innerWidth < 1024) setShowPages(7);
      else setShowPages(10);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const visiblePages = useMemo(() => {
    const pages: number[] = [];
    const halfShow = Math.floor(showPages / 2);

    let startPage = Math.max(currentPage - halfShow, 1);
    const endPage = Math.min(startPage + showPages - 1, totalPages);

    if (endPage - startPage + 1 < showPages) {
      startPage = Math.max(endPage - showPages + 1, 1);
    }

    for (let i = startPage; i <= endPage; i += 1) pages.push(i);
    return pages;
  }, [currentPage, showPages, totalPages]);

  if (totalPages <= 1) return null;

  const showLeftEllipsis = visiblePages[0] > 1;
  const showRightEllipsis = visiblePages[visiblePages.length - 1] < totalPages;
  const commonBtn = `${s.btn} flex items-center justify-center ${s.num} transition-colors`;

  return (
    <div
      className={[
        "flex items-center",
        s.gap,
        fullWidth ? "justify-between w-full" : "justify-end w-auto",
        className,
      ].join(" ")}
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${s.btn} flex items-center justify-center rounded-md border transition-colors ${
          currentPage === 1
            ? "cursor-not-allowed border-slate-200 bg-slate-100"
            : "border-blue-500 hover:bg-blue-50"
        }`}
      >
        <ChevronLeft size={s.icon} className="text-blue-500" />
      </button>

      <div className={`flex ${s.gap}`}>
        {showLeftEllipsis && (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              className={`${commonBtn} bg-blue-50/60 text-blue-600 hover:bg-blue-50`}
            >
              1
            </button>
            {visiblePages[0] > 2 && (
              <span className={`${s.pad} text-blue-500 ${s.num}`}>...</span>
            )}
          </>
        )}

        {visiblePages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={
              page === currentPage
                ? `${commonBtn} bg-blue-600 text-white`
                : `${commonBtn} bg-blue-50/60 text-blue-600 hover:bg-blue-50`
            }
          >
            {page}
          </button>
        ))}

        {showRightEllipsis && (
          <>
            {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
              <span className={`${s.pad} text-blue-500 ${s.num}`}>...</span>
            )}
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              className={`${commonBtn} bg-blue-50/60 text-blue-600 hover:bg-blue-50`}
            >
              {totalPages}
            </button>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${s.btn} flex items-center justify-center rounded-md border transition-colors ${
          currentPage === totalPages
            ? "cursor-not-allowed border-slate-200 bg-slate-100"
            : "border-blue-500 hover:bg-blue-50"
        }`}
      >
        <ChevronRight size={s.icon} className="text-blue-500" />
      </button>
    </div>
  );
}
