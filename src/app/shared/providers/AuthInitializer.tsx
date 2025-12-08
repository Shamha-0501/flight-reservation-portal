"use client";

import { ReactNode } from "react";
import { useAuth } from "../api/hooks/useAuth";

type Props = {
  children: ReactNode;
};

export default function AuthInitializer({ children }: Props) {
  // This will run on every client load & refresh
  useAuth(false); // or true if you want debug logs

  return <>{children}</>;
}
