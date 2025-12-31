import { RuntimeLogger } from "@/forge/runtime/logger";

export function withApiErrorLog<
  T extends (req: Request, ctx?: any) => Promise<Response>
>(handler: T): T {
  return (async (req: Request, ctx?: any) => {
    try {
      return await handler(req, ctx);
    } catch (e: any) {
      await RuntimeLogger.error("API handler error", e, {
        method: req.method,
        url: req.url,
      });

      // return a consistent response (or rethrow if you prefer)
      return new Response(
        JSON.stringify({ ok: false, error: "Server error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }) as T;
}
