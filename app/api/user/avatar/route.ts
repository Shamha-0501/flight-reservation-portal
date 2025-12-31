import { NextResponse } from "next/server";
import { UserController } from "@/src/http/controllers/UserController";
import { withApiErrorLog } from "@/forge/runtime/withApi";

export const POST = withApiErrorLog(async (req: Request) => {
  const form = await req.formData();
  const file = form.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "file required" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  const controller = new UserController();
  const result = await controller.uploadAvatar(buffer, file.name);

  return NextResponse.json(result);
});