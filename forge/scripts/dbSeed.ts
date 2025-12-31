import { Command } from "commander";
import { runSeeders } from "@/forge/database/seeder/runSeeders";
import { SEEDERS } from "@/src/database/seeders/DatabaseSeeder";
import { bootstrapDatasets } from "@/src/database/bootstrap/dataset";

bootstrapDatasets();

async function main() {
  const program = new Command();

  program
    .name("db:seed")
    // for npm positional: npm run db:seed RoleSeeder
    .argument("[seeder]", "Seeder name (positional fallback)")
    .option("-s, --seeder <name>", "Run only one seeder")
    .option("-f, --file <path>", "Seed from a CSV file")
    .option("-d, --dir <path>", "Seed from a CSV directory")
    .option("--truncate", "Truncate before seeding", false);

  program.parse(process.argv);

  const opts = program.opts<{
    seeder?: string;
    file?: string;
    dir?: string;
    truncate?: boolean;
  }>();

  const args = program.args as string[];

  // Positional seeder: take FIRST positional if present
  const positionalSeeder = args.length ? String(args[0]) : null;

  // npm env (works when user does: npm run db:seed --truncate)
  const npmTruncate = process.env.npm_config_truncate === "true";

  // Combine sources:
  // - seeder: prefer commander flag > positional
  // - truncate: prefer commander flag > npm env boolean
  // - file/dir: only reliable when passed as real argv (use `--` with npm) or run script directly
  const seeder = opts.seeder ?? positionalSeeder ?? null;
  const truncate = !!opts.truncate || npmTruncate;

  const file = opts.file ?? null;
  const dir = opts.dir ?? null;

  await runSeeders(SEEDERS, {
    only: seeder,
    truncate,
    overrideSource: file
      ? { type: "csv", file }
      : dir
      ? { type: "csvDir", dir }
      : null,
  });

  
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
