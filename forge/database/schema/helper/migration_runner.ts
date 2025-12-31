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
      this.finishLine("DONE", time);
    }
  }

  /**
   * SAFE: Rollback all ran migrations (down), clear migrations table, then re-run.
   * This does NOT touch tables outside your migrations (assuming down() is correct).
   */
  async fresh() {
    await this.ensureMigrationsTable("migrations");

    const ran = await this.getRunMigrations(); // filenames (timestamp_name.ts)
    if (ran.length === 0) {
      Logger.info("No migrations to rollback. Running migrations...\n");
      return this.run();
    }

    // Build absolute file paths for ran migrations and rollback in reverse order
    const ranFiles = ran
      .map((name) => path.join(this.migrationsPath, name))
      .filter((p) => fs.existsSync(p))
      .reverse();

    Logger.warn("Rolling back migrations...\n");

    for (const file of ranFiles) {
      const name = path.basename(file);
      const mig = await this.loadMigration(file);

      this.startLine(name);
      this.finishLine("ROLLBACK");

      await mig.down();
      await this.logRollback(name);

      this.startLine(name);
      this.finishLine("ROLLED BACK");
    }

    Logger.success("Rollback complete. Re-running migrations...\n");
    await this.run();
  }

  /**
   * DANGEROUS (guarded): Drops ALL tables in the current database and re-runs migrations.
   * Allowed ONLY when:
   * - FORGE_ALLOW_RESET=true
   * - DB name ends with _dev / _test / _shadow
   */
  async resetDatabaseAndMigrate() {
    Logger.warn("RESET: Dropping ALL tables and re-running migrations...\n");

    const dbName = await this.getCurrentDatabase();
    this.ensureResetAllowed(dbName);

    await this.dropAllTables(dbName);
    await this.run();
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
    const rows = await DB.query(
      `
        SELECT migration
        FROM migrations
        WHERE runs > rollbacks
        ORDER BY migration ASC
      `
    );
    return rows.map((r: any) => r.migration);
  }

  private getMigrationFiles(): string[] {
    return fs
      .readdirSync(this.migrationsPath)
      .filter((f) => f.endsWith(".ts") || f.endsWith(".js"))
      .sort() // important so they run in timestamp order
      .map((f) => path.join(this.migrationsPath, f));
  }

  private async loadMigration(file: string): Promise<any> {
    // If you re-run in same node process, module cache can bite.
    // If you face that, I’ll show you a cache-busting import.
    const fileUrl = pathToFileURL(file).href;
    const mod = await import(fileUrl);

    const MigrationClass = Object.values(mod)[0] as any;
    return new MigrationClass();
  }

  private async logMigration(name: string) {
    await DB.query(
      `
    INSERT INTO migrations (migration, runs, rollbacks, created_at, updated_at)
    VALUES (?, 1, 0, NOW(), NOW())
    ON DUPLICATE KEY UPDATE
      runs = runs + 1,
      updated_at = NOW()
    `,
      [name]
    );
  }

  private async logRollback(name: string) {
    await DB.query(
      `
    INSERT INTO migrations (migration, runs, rollbacks, created_at, updated_at)
    VALUES (?, 0, 1, NOW(), NOW())
    ON DUPLICATE KEY UPDATE
      rollbacks = rollbacks + 1,
      updated_at = NOW()
    `,
      [name]
    );
  }

  // -------------------------
  // Reset helpers (guarded)
  // -------------------------

  private async getCurrentDatabase(): Promise<string> {
    const rows = await DB.query(`SELECT DATABASE() AS db`);
    const dbName = rows?.[0]?.db;
    if (!dbName)
      throw new Error("Could not detect current database (SELECT DATABASE())");
    return dbName;
  }

  private ensureResetAllowed(dbName: string) {
    if (process.env.FORGE_ALLOW_RESET !== "true") {
      throw new Error("Reset blocked. Set FORGE_ALLOW_RESET=true to allow it.");
    }

    const ok = /(_dev|_test|_shadow)$/i.test(dbName);
    if (!ok) {
      throw new Error(
        `Refusing destructive reset on database "${dbName}". Use a *_dev/_test/_shadow database.`
      );
    }
  }

  private async dropAllTables(dbName: string) {
    const tables = await DB.query(
      `SELECT table_name AS name
       FROM information_schema.tables
       WHERE table_schema = ? AND table_type = 'BASE TABLE'`,
      [dbName]
    );

    if (!tables || tables.length === 0) {
      Logger.info("No tables found to drop.\n");
      return;
    }

    Logger.warn(`Dropping ${tables.length} tables from "${dbName}"...\n`);

    await DB.query(`SET FOREIGN_KEY_CHECKS=0;`);

    for (const t of tables) {
      const tableName = t.name;
      await DB.query(`DROP TABLE IF EXISTS \`${tableName}\`;`);
      this.logLine(`drop ${tableName}`, "DONE");
    }

    await DB.query(`SET FOREIGN_KEY_CHECKS=1;`);

    Logger.success("All tables dropped.\n");
  }

  // -------------------------
  // Fancy console lines
  // -------------------------

  private startLine(name: string) {
    const base = `  ${name} `;
    process.stdout.write(base);
    this.currentLineLength = this.visibleLength(base);
  }

  // fixed: no extra newline logic
  private finishLine(state: string, time?: string) {
    const doneTag = ` ${Logger.colored_text(
      state,
      state === "RUNNING" ? "green" : "yellow"
    )} ${time ? Logger.colored_text(time, "gray") : ""}`;

    const visibleDone = this.visibleLength(doneTag);
    const terminalWidth = process.stdout.columns || 80;

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

  // -------------------------
  // Name helpers
  // -------------------------

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
      .replace(/^Create/i, "")
      .replace(/Table$/i, "")
      .trim();
  }

  private toSnakeCase(str: string): string {
    return str
      .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
      .replace(/[\s\-]+/g, "_")
      .toLowerCase();
  }

  private toTableName(className: string): string {
    const clean = this.cleanClassName(className);
    const snake = this.toSnakeCase(clean);
    return pluralize(snake);
  }
}
