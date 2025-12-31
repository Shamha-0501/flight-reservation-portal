"use client";

import { getProfile } from "@/src/app/shared/api/services/userService";
import Container from "@/src/app/shared/ui/Container";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";

export default function ProfilePage() {
  const user = useSelector((state: any) => state.auth.user);

  useEffect(() => {
    if (!user?.id) return; // ✅ wait until user is available
    getProfile({ id: user.id });
  }, [user?.id]);

  console.log("selector user:", user);

  return (
    <Container className="min-h-screen bg-white dark:bg-gray-800">
      <div>profilePage</div>
    </Container>
  );
}
