import { NextRequest, NextResponse } from "next/server";
import { AuthController } from "@/src/http/controllers/AuthController";
import { SessionManager } from "@/forge/core/auth/sessionManager";

const controller = new AuthController();

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") ?? "";

  let sessionId: string | null = null;
  let user = null;

  if (cookieHeader) {
    const cookiesArr = cookieHeader
      .split(";")
      .map((c) => c.trim());

    const sessionCookie = cookiesArr.find((c) =>
      c.startsWith("session_id=")
    );

    if (sessionCookie) {
      sessionId = sessionCookie.split("=").slice(1).join("=");
    }
  }

  if (sessionId) {
    user = await SessionManager.getUserFromSession(sessionId);
  }

  const result = await controller.me(req as unknown as Request, user);
  return NextResponse.json(result.data, { status: result.status });
}
