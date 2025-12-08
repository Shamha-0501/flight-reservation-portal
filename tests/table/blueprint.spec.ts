// tests/schema.blueprint.spec.ts
import { describe, it, expect } from "vitest";
import { Blueprint } from "../../forge/database/schema/blueprint";

describe("Blueprint", () => {
  it("generates CREATE TABLE SQL with basic columns", () => {
    const bp = new Blueprint("schema_test_users");

    bp.bigIncrements("id");
    bp.string("name", 191);
    bp.string("email", 191).unique();
    bp.integer("age").nullable();
    bp.timestamps();
    bp.softDeletes();

    const statements = bp.toSQL();
    expect(statements.length).toBe(1);

    const sql = statements[0];

    // Very loose assertions to avoid formatting issues
    expect(sql).toContain("CREATE TABLE `schema_test_users`");
    expect(sql).toContain("`id` BIGINT");
    expect(sql).toContain("AUTO_INCREMENT");
    expect(sql).toContain("PRIMARY KEY");

    expect(sql).toContain("`name` VARCHAR(191)");
    expect(sql).toContain("`email` VARCHAR(191)");
    expect(sql).toContain("UNIQUE");
    expect(sql).toContain("`age` INT");

    // timestamps / softDeletes
    expect(sql).toContain("`created_at` DATETIME");
    expect(sql).toContain("`updated_at` DATETIME");
    expect(sql).toContain("`deleted_at` DATETIME");
  });

  it("generates ALTER TABLE SQL when used in alter mode", () => {
    const bp = new Blueprint("schema_test_users", "alter").asAlter();

    bp.integer("age").nullable().default(0);
    bp.boolean("is_active").nullable().default(1);

    const statements = bp.toSQL();

    // expect multiple ALTER TABLE statements OR one combined one,
    // depending on how you implemented toAlterTableSQL.
    expect(statements.length).toBeGreaterThan(0);

    const joined = statements.join("\n");

    expect(joined).toContain("ALTER TABLE `schema_test_users`");
    expect(joined).toContain("`age` INT");
    expect(joined).toContain("DEFAULT 0");
    expect(joined).toContain("`is_active` TINYINT(1)");
    expect(joined).toContain("DEFAULT 1");
  });

  it("supports foreign keys and indexes in CREATE TABLE", () => {
    const bp = new Blueprint("schema_test_posts");

    bp.bigIncrements("id");
    bp.bigInteger("user_id").unsigned();
    bp.string("title", 191);
    bp.text("body").nullable();

    bp.foreign("user_id").references("id").on("schema_test_users").onDelete("CASCADE");

    bp.index("title");
    bp.uniqueIndex(["user_id", "title"]);

    const statements = bp.toSQL();
    const sql = statements[0];

    expect(sql).toContain("CREATE TABLE `schema_test_posts`");
    expect(sql).toContain("`user_id` BIGINT UNSIGNED");

    // FK snippet
    expect(sql).toContain("FOREIGN KEY (`user_id`) REFERENCES `schema_test_users`(`id`)");
    expect(sql).toContain("ON DELETE CASCADE");

    // Indexes
    expect(sql).toContain(
        "UNIQUE KEY `schema_test_posts_user_id_title_unique` (`user_id`, `title`)"
    );
  });
});
