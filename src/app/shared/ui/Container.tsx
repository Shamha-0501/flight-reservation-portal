"use client";

import React from "react";
import clsx from "clsx";

type ContainerProps = {
    children: React.ReactNode;
    className?: string;
    size?: "sm" | "md" | "lg" | "xl" | "full";
    noPadding?: boolean;
};

export default function Container({
    children,
    className,
    size = "xl",
    noPadding = false,
}: ContainerProps) {
    const sizeClasses = {
    sm: "max-w-4xl",
    md: "max-w-5xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
    full: "max-w-full",
  };

  return (
    <div
      className={clsx(
        "mx-auto w-full max-w-[2560px]",
        sizeClasses[size],
        noPadding ? "" : "sm:px-6 lg:px-2",
        className
      )}
    >
      {children}
    </div>
  );
}