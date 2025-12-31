import { UserController } from "@/src/http/controllers/UserController";
import { NextResponse } from "next/server";
import { bootAuth } from "@/src/http/bootstrap/auth";
import { handleError } from "@/forge/core/auth/handleError";
import { withApiErrorLog } from "@/forge/runtime/withApi";

bootAuth();

const controller = new UserController();

export const GET = withApiErrorLog(
  async (
    req: Request,
    ctx: { params: Promise<{ id: string }> } // params is Promise in Next 15
  ) => {
    try {
      const { id } = await ctx.params; // unwrap it
      const userId = Number(id);

      // const result = await controller.getProfile(req, userId);

      // if (!Number.isFinite(userId) || userId <= 0) {
      //   return NextResponse.json(
      //     { message: "Invalid id", got: id },
      //     { status: 400 }
      //   );
      // }

      const result = await controller.debugPermissions(req);

      return NextResponse.json({ user: result }, { status: 200 });
    } catch (err) {
      return handleError(err);
    }
  }
);
