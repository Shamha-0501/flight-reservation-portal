import { withApiErrorLog } from "@/forge/runtime/withApi";
import { NextResponse } from "next/server";

export const GET = withApiErrorLog(async (req: Request) => {
  return new NextResponse(null, { status: 204 });
});
