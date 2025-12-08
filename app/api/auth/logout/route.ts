// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AuthController } from "@/src/http/controllers/AuthController";

const controller = new AuthController();

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const sessionCookie = (await cookieStore).get("session_id");
  const sessionId = sessionCookie?.value ?? null;

  // Call controller to destroy session in DB/Redis/etc.
  const result = await controller.logout(req as unknown as Request, sessionId);

  // Clear cookie on client
  if (sessionCookie) {
    (await cookieStore).set("session_id", "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }

  return NextResponse.json(result.data, { status: result.status });
}
