import { Logger } from "../log/logger";
import type { Seeder } from "./types";

type RunSeederOptions = {
  only?: string | null;
  overrideSource?: any;
  truncate?: boolean;
};

export const runSeeders = async function (
  seederClasses: (new () => Seeder)[],
  opts: RunSeederOptions = {}
) {
  if (seederClasses.length === 0) {
    Logger.info("Seeders not registered yet.\n");
    return;
  }

  const terminalWidth = process.stdout.columns || 80;
  let currentLineLength = 0;

  const visibleLength = (text: string) =>
    text.replace(/\x1b\[[0-9;]*m/g, "").length;

  const startLine = (name: string) => {
    const base = `  ${name} `;
    process.stdout.write(base);
    currentLineLength = visibleLength(base);
  };

  const finishLine = (state: string, time?: string, last?: boolean) => {
    // pick colors similar to your migrations
    const stateColor =
      state === "RUNNING"
        ? "green"
        : state === "DONE"
        ? "yellow"
        : state === "SKIPPED"
        ? "cyan"
        : "red";

    const stateTxt = Logger.colored_text(state, stateColor);

    const timeTxt = time ? ` ${Logger.colored_text(`(${time})`, "gray")}` : "";
    const tail = ` ${stateTxt}${timeTxt}`;

    const visibleTail = visibleLength(tail);
    const dots = ".".repeat(
      Math.max(2, terminalWidth - currentLineLength - visibleTail)
    );

    process.stdout.write(`${dots}${tail}${last ? state === "DONE" || state === "SKIPPED" ? "\n\n" : "\n" : ""}`);
  };

  for (const SeederClass of seederClasses) {
    const seeder = new SeederClass();

    // run only one seeder
    if (opts.only && seeder.name !== opts.only) continue;

    // override source (csv / dir / array)
    if (opts.overrideSource && "source" in seeder) {
      (seeder as any).source = opts.overrideSource;
    }

    // truncate before seeding
    if (opts.truncate && "model" in seeder) {
      Logger.warn(`Truncating table for ${seeder.name}`);
      await (seeder as any).model.truncate();
    }

    const start = Date.now();

    startLine(seeder.name);
    finishLine("RUNNING", undefined, true);

    await seeder.run();

    const elapsed = Date.now() - start;
    const time =
      elapsed < 1000 ? `${elapsed}ms` : `${(elapsed / 1000).toFixed(2)}s`;

    startLine(seeder.name);
    finishLine("DONE", time, true);
  }
};
