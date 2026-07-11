"use client";

import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/src/shared/redux/store";
import { authMe } from "@/src/shared/redux/store/authSlice";

export default function AuthBootstrapper() {
  const dispatch = useDispatch<AppDispatch>();
  const booted = useRef(false);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    dispatch(authMe());
  }, [dispatch]);

  return null;
}
