import { NextResponse } from "next/server";
import { UserController } from "@/src/http/controllers/UserController";
import { withApiErrorLog } from "@/forge/runtime/withApi";

export const runtime = "nodejs";

export const POST = withApiErrorLog(async (req: Request) => {
  const form = await req.formData();
  const file = form.get("file") as File | null;

  // You can pass userId from auth, or from form for now
  const userId = Number(form.get("userId") ?? 0);

  if (!file) {
    return NextResponse.json({ ok: false, error: "file is required" }, { status: 400 });
  }
  if (!userId) {
    return NextResponse.json({ ok: false, error: "userId is required" }, { status: 400 });
  }

  // ✅ REAL file bytes
  const buffer = Buffer.from(await file.arrayBuffer());

  const controller = new UserController();
  const result = await controller.uploadAvatarToCloudinary(
    buffer,
    file.name,
    file.type || undefined,
    userId
  );

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
});