import { NextResponse } from "next/server";
import { AuthorizationError } from "@/forge/core/auth/types";

export function handleError(err: unknown) {
  // Auth error -> 403
  if (err instanceof AuthorizationError) {
    return NextResponse.json(
      {
        ok: false,
        code: err.code,
        message: err.message,
      },
      { status: err.status ?? 403 }
    );
  }

  // Unknown error -> 500
  console.error(err);
  return NextResponse.json(
    { ok: false, message: "Server error" },
    { status: 500 }
  );
}
