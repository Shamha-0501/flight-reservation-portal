import { Blueprint } from "@/forge/database/schema/blueprint";
import { DB } from "@/forge/database/facades/db";
import { config } from "dotenv";

config({ quiet: true });

export class SchemaBuilder {
  async create(
    table: string,
    callback: (table: Blueprint) => void | Promise<void>
  ): Promise<void> {
    const blueprint = new Blueprint(table, "create");
    await callback(blueprint);
    const statements = blueprint.toSQL();

    for (const sql of statements) {
      await DB.query(sql);
    }
  }

  async table(
    table: string,
    callback: (table: Blueprint) => void | Promise<void>
  ): Promise<void> {
    const blueprint = new Blueprint(table, "alter").asAlter();
    await callback(blueprint);
    const statements = blueprint.toSQL();

    for (const sql of statements) {
      await DB.query(sql);
    }
  }

  async hasTable(table: string): Promise<Boolean> {
    const rows = await DB.query(
      `SELECT COUNT(*) as count from information_schema.tables
       WHERE table_schema = '${process.env.MYSQL_DATABASE}' AND table_name = ?`,
       [table]
    );
    return rows[0].count > 0;
  }

  async drop(table: string): Promise<void> {
    await DB.query(`DROP TABLE \`${table}\`;`);
  }

  async dropIfExists(table: string): Promise<void> {
    await DB.query(`DROP TABLE IF EXISTS \`${table}\`;`);
  }
}

// export a singleton, like Laravel's Schema facade
export const Schema = new SchemaBuilder();
