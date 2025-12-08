import fs from "fs";
import path from "path";
import { DB } from "@/forge/database/facades/db";
import { Schema } from "@/forge/database/schema/schema";
import { MigrationTable } from "@/forge/database/schema/helper/create_migration_table";
import { Logger } from "@/forge/database/log/logger";
import pluralize from "pluralize";
import { pathToFileURL } from "url";

const template = `import { Migration } from "@/forge/database/schema/migration";
import { Schema } from "@/forge/database/schema/schema";

export class <class> extends Migration {
  async up() {
    await Schema.create("<table_name>", (table) => {
      table.bigIncrements("id");
      table.timestamps();
      table.softDeletes();
    });
  }

  async down() {
    await Schema.dropIfExists("<table_name>");
  }
}
`;

export class MigrationRunner {
  private migrationsPath = path.resolve(
    __dirname,
    "../../../../src/database/migrations"
  );

  private currentLineLength = 0;

  async run() {
    await this.ensureMigrationsTable("migrations");

    const ranMigrations = await this.getRunMigrations();
    const files = this.getMigrationFiles();

    const pending = files.filter((file) => {
      const name = path.basename(file);
      return !ranMigrations.includes(name);
    });

    if (pending.length === 0) {
      Logger.info("Nothing to migrate\n");
      return;
    } else {
      Logger.info("Running pending migrations...\n");
    }

    const terminalWidth = process.stdout.columns || 80;

    for (const file of files) {
      const name = path.basename(file);

      if (ranMigrations.includes(name)) {
        this.logLine(name, "SKIPPED");
        continue;
      }

      const migration = await this.loadMigration(file);

      const start = Date.now();

      this.startLine(name);
      this.finishLine("RUNNING");

      await migration.up();

      const elapsed = Date.now() - start;
      const time =
        elapsed < 1000 ? `${elapsed}ms` : `${(elapsed / 1000).toFixed(2)}s`;

      await this.logMigration(name);

      this.startLine(name);
      this.finishLine("DONE", time, true);
    }
  }

  /**
   * Create / initialize a new migration file.
   * Example: await runner.initMigration('CreateSchemaTestPostsTable')
   */
  async initMigration(className: string) {
    if (!className) {
      Logger.error("Migration name is required\n");
      return;
    }

    if (!fs.existsSync(this.migrationsPath)) {
      fs.mkdirSync(this.migrationsPath, { recursive: true });
      Logger.info("Created migrations folder\n");
    }

    const timestamp = this.makeTimestamp();
    const fileName = `${timestamp}_${this.toSnakeCase(className)}.ts`;
    const filePath = path.join(this.migrationsPath, fileName);

    const tableName = this.toTableName(className);

    const content = template
      .replace(/<class>/g, className)
      .replace(/<table_name>/g, tableName);

    fs.writeFileSync(filePath, content, "utf8");
    Logger.success(`Migration created → ${fileName}\n`);
  }

  private async ensureMigrationsTable(table: string) {
    const exists = await Schema.hasTable(table);

    if (!exists) {
      Logger.info("Creating migration table...\n");
      const mig = new MigrationTable();
      await mig.up();
    }
  }

  private async getRunMigrations(): Promise<string[]> {
    const rows = await DB.query(`SELECT migration FROM migrations`);
    return rows.map((r) => r.migration);
  }

  private getMigrationFiles(): string[] {
    console.log(this.migrationsPath.toString());
    return fs
      .readdirSync(this.migrationsPath)
      .filter((f) => f.endsWith(".ts") || f.endsWith(".js"))
      .map((f) => path.join(this.migrationsPath, f));
  }

  private async loadMigration(file: string): Promise<any> {
    const fileUrl = pathToFileURL(file).href;

    const mod = await import(fileUrl);
    const MigrationClass = Object.values(mod)[0] as any;
    return new MigrationClass();
  }

  private async logMigration(name: string) {
    await DB.query(
      `INSERT INTO migrations (migration, created_at, updated_at) VALUES (?, NOW(), NOW())`,
      [name]
    );
  }

  private startLine(name: string) {
    const base = `  ${name} `;

    process.stdout.write(base);
    this.currentLineLength = this.visibleLength(base);
  }

  private finishLine(state: string, time?: string, last?: boolean) {
    const terminalWidth = process.stdout.columns || 80;

    const doneTag = ` ${Logger.colored_text(
      state,
      state === "RUNNING" ? "green" : "yellow"
    )} ${time ? Logger.colored_text(time, "gray") : ""}${last ? '\n' : ''}`;

    const visibleDone = this.visibleLength(doneTag);

    const dots = ".".repeat(
      Math.max(2, terminalWidth - this.currentLineLength - visibleDone)
    );

    process.stdout.write(`${dots}${doneTag}\n`);
  }

  private visibleLength(text: string) {
    return text.replace(/\x1b\[[0-9;]*m/g, "").length;
  }

  private logLine(message: string, status: string) {
    const terminalWidth = process.stdout.columns || 80;
    const filled = ".".repeat(
      Math.max(2, terminalWidth - message.length - status.length - 6)
    );

    console.log(`  ${message} ${filled} ${status}`);
  }

  private makeTimestamp(): string {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");

    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hour = pad(d.getHours());
    const min = pad(d.getMinutes());
    const sec = pad(d.getSeconds());

    return `${year}${month}${day}_${hour}${min}${sec}`;
  }

  private cleanClassName(name: string): string {
    return name
      .replace(/^Create/i, "") // remove Create prefix
      .replace(/Table$/i, "") // remove Table suffix
      .trim();
  }

  private toSnakeCase(str: string): string {
    return str
      .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
      .replace(/[\s\-]+/g, "_")
      .toLowerCase();
  }

  private toTableName(className: string): string {
    const clean = this.cleanClassName(className); // Remove Create & Table
    const snake = this.toSnakeCase(clean); // Convert to snake_case
    return pluralize(snake); // Make plural
  }
}
