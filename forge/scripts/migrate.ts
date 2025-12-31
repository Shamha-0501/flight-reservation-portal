// forge/scripts/migrate.ts
import { Command } from "commander";
import { Logger } from "@/forge/database/log/logger";
import { MigrationRunner } from "@/forge/database/schema/helper/migration_runner";

async function main() {
  const runner = new MigrationRunner();

  const program = new Command();

  program
    .name("migration")
    // positional command fallback: npm run migration -- init CreateUsersTable
    .argument("[cmd]", "Command: init | make (positional fallback)")
    .argument("[name]", "Migration class name (positional fallback)")
    .option("--init <name>", "Create a new migration file (init)")
    .option("--make <name>", "Create a new migration file (make)")
    .option("-F, --fresh", "Rollback all ran migrations and re-run", false)
    // Optional (only if your runner has resetDatabaseAndMigrate)
    .option("--reset", "Drop ALL tables and re-run migrations (guarded)", false);

  program.parse(process.argv);

  const opts = program.opts<{
    init?: string;
    make?: string;
    fresh?: boolean;
    reset?: boolean;
  }>();

  const args = program.args as string[];

  // Positional fallback
  const positionalCmd = args.length ? String(args[0]) : null;
  const positionalName = args.length > 1 ? String(args[1]) : null;

  // npm config fallback:
  // lets users do: npm run migration --fresh   (npm may set npm_config_fresh=true)
  const npmFresh = process.env.npm_config_fresh === "true";
  const npmReset = process.env.npm_config_reset === "true";

  const fresh = !!opts.fresh || npmFresh;
  const reset = !!opts.reset || npmReset;

  // Determine init/make name (prefer flags, then positional)
  const initName =
    opts.init ?? opts.make ?? (positionalCmd === "init" || positionalCmd === "make"
      ? positionalName
      : null);

  const isInitCmd =
    !!opts.init ||
    !!opts.make ||
    positionalCmd === "init" ||
    positionalCmd === "make";

  // --------------------------
  // Init / Make
  // --------------------------
  if (isInitCmd) {
    if (!initName) {
      Logger.error("Migration class name is required.\n");
      Logger.info("Usage:\n");
      Logger.info("  npm run migration -- init CreateUsersTable\n");
      Logger.info("  npm run migration -- --init CreateUsersTable\n");
      Logger.info("  npm run migration -- --make CreateUsersTable\n");
      process.exit(1);
    }

    Logger.info(`Initializing migration "${initName}"...\n`);
    await runner.initMigration(initName);
    process.exit(0);
  }

  // --------------------------
  // Fresh / Reset / Run
  // --------------------------
  if (reset) {
    Logger.warn("RESET mode: dropping ALL tables and re-running migrations...\n");
    // Requires you implemented runner.resetDatabaseAndMigrate()
    // and guarded it with FORGE_ALLOW_RESET=true + *_dev/_test suffix check
    // @ts-ignore
    await runner.resetDatabaseAndMigrate();
    process.exit(0);
  }

  if (fresh) {
    Logger.warn("FRESH mode: rollback all + re-run migrations...\n");
    // Requires you implemented runner.fresh()
    // @ts-ignore
    await runner.fresh();
    process.exit(0);
  }

  await runner.run();
  process.exit(0);
}

main().catch((err: any) => {
  Logger.error(`Migration failed: ${err?.code ?? "UNKNOWN"} ${err?.message ?? err}\n`);
  process.exit(1);
});
