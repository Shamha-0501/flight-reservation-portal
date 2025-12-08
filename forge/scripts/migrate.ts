// migrate.ts
import { Logger } from "@/forge/database/log/logger";
import { MigrationRunner } from "@/forge/database/schema/helper/migration_runner";

(async () => {
  const runner = new MigrationRunner();
  const args = process.argv.slice(2); // everything after `node migrate.ts`

  if (args.length > 0 && (args[0] === "init" || args[0] === "make")) {
    const className = args[1];

    if (!className) {
      Logger.error("Migration class name is required.\n");
      Logger.info("Usage: node migrate.ts init CreateSchemaTestPostsTable\n");
      process.exit(1);
    }

    Logger.info(`Initializing migration "${className}"...\n`);
    await runner.initMigration(className);
  } else {
    await runner.run();
  }

  process.exit();
})();
