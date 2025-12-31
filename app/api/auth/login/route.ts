import "@/forge/http/bootstrap";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AuthController } from "@/src/http/controllers/AuthController";
import { withApiErrorLog } from "@/forge/runtime/withApi";

const controller = new AuthController();

export const POST = withApiErrorLog(async (req: Request) => {
  const result = await controller.login(req);

  if ("errors" in result) {
    return NextResponse.json(
      { errors: result.errors },
      { status: result.status }
    );
  }

  const res = NextResponse.json(result.data, { status: result.status });

  const sessionId = result.data?.session_id as string | undefined;
  if (sessionId) {
    const cookieStore = cookies();
    (await cookieStore).set("session_id", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      // secure: true,
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return res;
});
