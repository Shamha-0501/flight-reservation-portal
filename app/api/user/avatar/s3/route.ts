import { NextResponse } from "next/server";
import { UserController } from "@/src/http/controllers/UserController";
import { withApiErrorLog } from "@/forge/runtime/withApi";

export const runtime = "nodejs"; // IMPORTANT: need Node runtime for Buffer

export const POST = withApiErrorLog(async (req: Request) => {
  try {
    // 1) Parse multipart form-data
    const form = await req.formData();
    const file = form.get("avatar");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "avatar file is required (field name: avatar)" },
        { status: 422 }
      );
    }

    // 2) Convert File -> Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3) Call your controller upload
    const controller = new UserController();

    const result = await controller.uploadAvatarToS3(
      buffer,
      file.name,
      file.type || undefined,
      { isPublic: true } // set false if you want signed-url style
    );

    if (!result.ok) {
      return NextResponse.json(result, { status: 422 });
    }

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
});