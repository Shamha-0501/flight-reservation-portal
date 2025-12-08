// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AuthController } from "@/src/http/controllers/AuthController";

const controller = new AuthController();

export async function POST(req: NextRequest) {
  const result = await controller.register(req as unknown as Request);

  // Validation or other error
  if ("errors" in result) {
    return NextResponse.json(
      { errors: result.errors },
      { status: result.status }
    );
  }

  const res = NextResponse.json(result.data, { status: result.status });

  // If a session_id was returned, persist it in a cookie
  const sessionId = result.data?.session_id as string | undefined;
  if (sessionId) {
    const cookieStore = cookies();
    (await cookieStore).set("session_id", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      // secure: true, // enable in production with HTTPS
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  return res;
}
