// tests/schema.real.spec.ts
import {
  describe,
  it,
  expect,
  beforeAll,
  // afterAll,   // ⬅️ not needed if you don't want cleanup
} from "vitest";

import { DB } from "../../forge/database/facades/db";
import { Schema } from "../../forge/database/schema/schema";
import { Migration } from "../../forge/database/schema/migration";

const TEST_USERS_TABLE = "schema_test_users";
const TEST_POSTS_TABLE = "schema_test_posts";

async function dropTestTables() {
  await DB.query(`DROP TABLE IF EXISTS \`${TEST_POSTS_TABLE}\`;`);
  await DB.query(`DROP TABLE IF EXISTS \`${TEST_USERS_TABLE}\`;`);
}

describe("Schema & Migration MySQL integration", () => {
  beforeAll(async () => {
    // (Optional) clean state BEFORE tests start
    // If you REALLY don't want any drop at all, comment this out too.
    await dropTestTables();
  });

  // ❌ NO afterAll cleanup – do NOT delete tables after tests
  // afterAll(async () => {
  //   await dropTestTables();
  // });

  // -------------------------------------------------
  // Schema.create
  // -------------------------------------------------
  it("Schema.create() creates the table with expected columns", async () => {
    await Schema.create(TEST_USERS_TABLE, (table) => {
      table.bigIncrements("id");
      table.string("name", 191);
      table.string("email", 191).unique();
      table.integer("age").nullable();
      table.timestamps();
      table.softDeletes();
    });

    const columns = await DB.query<any>(
      `SHOW COLUMNS FROM \`${TEST_USERS_TABLE}\`;`
    );

    const columnNames = columns.map((c: any) => c.Field);

    expect(columnNames).toEqual(
      expect.arrayContaining([
        "id",
        "name",
        "email",
        "age",
        "created_at",
        "updated_at",
        "deleted_at",
      ])
    );
  });

  // -------------------------------------------------
  // Schema.table (alter)
  // -------------------------------------------------
  it("Schema.table() alters the table to add new columns", async () => {
    await Schema.table(TEST_USERS_TABLE, (table) => {
      table.boolean("is_active").nullable().default(1);
    });

    const columns = await DB.query<any>(
      `SHOW COLUMNS FROM \`${TEST_USERS_TABLE}\`;`
    );

    const columnNames = columns.map((c: any) => c.Field);
    expect(columnNames).toContain("is_active");
  });

  // -------------------------------------------------
  // Migration: up only (NO drop)
  // -------------------------------------------------
  class CreateSchemaTestPostsTable extends Migration {
    async up() {
      await Schema.create(TEST_POSTS_TABLE, (table) => {
        table.bigIncrements("id");
        table.bigInteger("user_id").unsigned();
        table.string("title", 191);
        table.text("body").nullable();
        table.timestamps();
        table.softDeletes();

        table
          .foreign("user_id")
          .references("id")
          .on(TEST_USERS_TABLE)
          .onDelete("CASCADE");
      });
    }

    async down() {
      // Keep for real migrations, but DO NOT call it in tests
      await Schema.dropIfExists(TEST_POSTS_TABLE);
    }
  }

  it("Migration up() creates the posts table and keeps it", async () => {
    const migration = new CreateSchemaTestPostsTable();

    await migration.up();

    // Check table exists
    const tablesAfterUp = await DB.query<any>(
      `SHOW TABLES LIKE '${TEST_POSTS_TABLE}';`
    );
    expect((tablesAfterUp as any[]).length).toBe(1);

    // await migration.down();
  });
});
