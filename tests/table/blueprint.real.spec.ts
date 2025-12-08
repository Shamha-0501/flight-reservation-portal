import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
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
    // Ensure a clean state for these tests
    await dropTestTables();
  });

  afterAll(async () => {
    // Optional: clean up after all tests
    await dropTestTables();
  });

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

    // Check table exists + columns are present
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
    // Add new column using alter mode
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
  // Migration: up / down
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
      await Schema.dropIfExists(TEST_POSTS_TABLE);
    }
  }

  it("Migration up()/down() creates and drops a table", async () => {
    const migration = new CreateSchemaTestPostsTable();

    // Run up()
    await migration.up();

    // Check table exists
    const tablesAfterUp = await DB.query<any>(
      `SHOW TABLES LIKE '${TEST_POSTS_TABLE}';`
    );
    expect((tablesAfterUp as any[]).length).toBe(1);

    // Run down()
    await migration.down();

    // Check table is gone
    const tablesAfterDown = await DB.query<any>(
      `SHOW TABLES LIKE '${TEST_POSTS_TABLE}';`
    );
    expect((tablesAfterDown as any[]).length).toBe(0);
  });
});
