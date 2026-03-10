"use client";

import React from "react";
import clsx from "clsx";

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
  size?: "container" | "full";
  noPadding?: boolean;
};

export default function Container({
  children,
  className,
  size = "full",
  noPadding = false,
}: ContainerProps) {
  const baseClass =
    size === "full" ? "mx-auto w-full max-w-full" : "container";

  return (
    <div className={clsx(baseClass, noPadding ? "px-0" : "", className)}>
      {children}
    </div>
  );
}
