import fs from "node:fs";
import path from "node:path";

type LogLevel = "ERROR" | "WARN" | "INFO" | "DEBUG";

export class RuntimeLogger {
  private static filePath() {
    return path.join(process.cwd(), "src", "storage", "logs", "forge.log");
  }

  private static now() {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  private static safe(obj: any) {
    try {
      return JSON.stringify(obj ?? {});
    } catch {
      return "{}";
    }
  }

  static errorSync(message: string, context?: any) {
    const fp = this.filePath();
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    const line = `[${this.now()}] local.ERROR: ${message} ${this.safe(
      context
    )}\n`;
    fs.appendFileSync(fp, line, "utf8");
  }

  static async error(message: string, err?: unknown, context?: any) {
    // keep your async version for normal code paths
    const errorPayload =
      err instanceof Error
        ? { name: err.name, message: err.message, stack: err.stack }
        : err;

    this.errorSync(message, { ...(context ?? {}), error: errorPayload });
  }
}
