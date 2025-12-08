import type { MiddlewareFunction } from "../http";
import { NextResponse } from "next/server";

export const AuthRequiredMiddleware: MiddlewareFunction = async (
  req,
  ctx,
  next
) => {
  const pathname = req.nextUrl.pathname;

  // 🔹 Only enforce auth on this exact endpoint
  // adjust path if your API prefix is different
  if (pathname !== "/api/auth/me") {
    // for all other routes, just continue without blocking
    return next();
  }

  // 🔹 For /api/auth/me, require a user
  if (!ctx.user) {
    return new NextResponse(
      JSON.stringify({ message: "Unauthenticated." }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return next();
};
