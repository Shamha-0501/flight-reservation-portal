import { RuntimeLogger } from "./logger";

let booted = false;

export function bootstrapRuntimeLogging() {
  if (booted) return;
  booted = true;

  process.prependListener("unhandledRejection", (reason: any) => {
    RuntimeLogger.errorSync("unhandledRejection", { reason });
  });

  process.prependListener("uncaughtException", (err: any) => {
    RuntimeLogger.errorSync("uncaughtException", {
      name: err?.name,
      message: err?.message,
      stack: err?.stack,
    });
  });
}
