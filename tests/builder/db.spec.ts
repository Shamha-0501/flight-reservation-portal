import { describe, it, expect } from "vitest";
import { DB } from "../../forge/database/facades/db";
import { RawSQL } from "../../forge/pool/mysql";

describe("DB.table query builder -> toSQL", () => {
  it("builds a simple SELECT with explicit columns", () => {
    const qb = DB.table("users").select("id", "name");

    const { sql, values } = qb.toSQL();

    expect(sql).toBe("SELECT `id`, `name` FROM `users`");
    expect(values).toEqual([]);
  });

  it("builds SELECT with WHERE and bindings", () => {
    const qb = DB.table("users")
      .select("id", "email")
      .where("`age` > ?", [18])
      .where("`status` = ?", ["active"]);

    const { sql, values } = qb.toSQL();

    expect(sql).toBe(
      "SELECT `id`, `email` FROM `users` WHERE `age` > ? AND `status` = ?"
    );
    expect(values).toEqual([18, "active"]);
  });

  it("builds SELECT with grouped WHERE (callback)", () => {
    const qb = DB.table("users")
      .select("id", "name")
      .where("`age` > ?", [18])
      .where((q) => {
        q.where("`status` = ?", ["active"]);
        q.orWhere("`status` = ?", ["pending"]);
      });

    const { sql, values } = qb.toSQL();

    expect(sql).toBe(
      "SELECT `id`, `name` FROM `users` WHERE `age` > ? AND ( `status` = ? OR `status` = ? )"
    );
    expect(values).toEqual([18, "active", "pending"]);
  });

  it("builds SELECT with raw column fragment", () => {
    const qb = DB.table("logins").select(
      "id",
      DB.raw("NOW() AS `current_time`")
    );

    const { sql, values } = qb.toSQL();

    expect(sql).toBe(
      "SELECT `id`, NOW() AS `current_time` FROM `logins`"
    );
    expect(values).toEqual([]);
  });

  it("builds SELECT with orderBy, limit and offset", () => {
    const qb = DB.table("users")
      .select("id")
      .orderBy("id", "DESC")
      .limit(10)
      .offset(20);

    const { sql, values } = qb.toSQL();

    // note: orderBy doesn't quote column names in your implementation
    expect(sql).toBe(
      "SELECT `id` FROM `users` ORDER BY id DESC LIMIT 10 OFFSET 20"
    );
    // ^ if you later change buildWhere() to avoid the stray "WHERE ",
    //    update the expectation accordingly.
    expect(values).toEqual([]);
  });

  it("builds INSERT with single row", () => {
    const qb = DB.table("users").insert({
      name: "John",
      age: 30,
    });

    const { sql, values } = qb.toSQL();

    // Property order is deterministic in modern JS (insertion order),
    // but keep the assertion flexible if you ever change it.
    expect(sql).toBe(
      "INSERT INTO `users` (`name`, `age`) VALUES (?, ?)"
    );
    expect(values).toEqual(["John", 30]);
  });

  it("builds INSERT with multiple rows", () => {
    const qb = DB.table("users").insert([
      { name: "A", age: 20 },
      { name: "B", age: 25 },
    ]);

    const { sql, values } = qb.toSQL();

    expect(sql).toBe(
      "INSERT INTO `users` (`name`, `age`) VALUES (?, ?), (?, ?)"
    );
    expect(values).toEqual(["A", 20, "B", 25]);
  });

  it("builds UPDATE with WHERE", () => {
    const qb = DB.table("users")
      .where("`id` = ?", [1])
      .update({ name: "Jane" });

    const { sql, values } = qb.toSQL();

    expect(sql).toBe(
      "UPDATE `users` SET `name` = ? WHERE `id` = ?"
    );
    expect(values).toEqual(["Jane", 1]);
  });

  it("builds DELETE with WHERE", () => {
    const qb = DB.table("users")
      .where("`id` = ?", [1])
      .delete();

    const { sql, values } = qb.toSQL();

    expect(sql).toBe(
      "DELETE FROM `users` WHERE `id` = ?"
    );
    expect(values).toEqual([1]);
  });

  // ---------- Soft delete tests ----------

  it("builds UPDATE for softDelete (sets deleted_at)", () => {
    const qb = DB.table("users")
      .where("`id` = ?", [1])
      .softDelete(); // default column deleted_at

    const { sql, values } = qb.toSQL();

    expect(sql).toBe(
      "UPDATE `users` SET `deleted_at` = ? WHERE `id` = ?"
    );
    expect(values.length).toBe(2);
    expect(values[0]).toBeInstanceOf(Date);
    expect(values[1]).toBe(1);
  });

  it("builds UPDATE for restore (sets deleted_at = NULL)", () => {
    const qb = DB.table("users")
      .where("`id` = ?", [1])
      .restore();

    const { sql, values } = qb.toSQL();

    expect(sql).toBe(
      "UPDATE `users` SET `deleted_at` = ? WHERE `id` = ?"
      // in your implementation, NULL is passed as `null`, so this will be bound as a parameter
    );
    expect(values).toEqual([null, 1]);
  });

  it("builds SELECT with withoutTrashed (deleted_at IS NULL)", () => {
    const qb = DB.table("users")
      .select("id")
      .withoutTrashed();

    const { sql, values } = qb.toSQL();

    expect(sql).toBe(
      "SELECT `id` FROM `users` WHERE `deleted_at` IS NULL"
    );
    expect(values).toEqual([]);
  });

  it("builds SELECT with onlyTrashed (deleted_at IS NOT NULL)", () => {
    const qb = DB.table("users")
      .select("id")
      .onlyTrashed();

    const { sql, values } = qb.toSQL();

    expect(sql).toBe(
      "SELECT `id` FROM `users` WHERE `deleted_at` IS NOT NULL"
    );
    expect(values).toEqual([]);
  });

  it("combines grouped WHERE with withoutTrashed", () => {
    const qb = DB.table("users")
      .select("id")
      .where((q) => {
        q.where("`role` = ?", ["admin"]);
        q.orWhere("`role` = ?", ["editor"]);
      })
      .withoutTrashed();

    const { sql, values } = qb.toSQL();

    expect(sql).toBe(
      "SELECT `id` FROM `users` WHERE ( `role` = ? OR `role` = ? ) AND `deleted_at` IS NULL"
    );
    expect(values).toEqual(["admin", "editor"]);
  });

  // ---------- "when" helper + raw WHERE ----------

  it("applies conditional WHERE with when()", () => {
    const isActive = true;

    const qb = DB.table("users")
      .select("id", "name")
      .when(isActive, (builder) => {
        builder.where("`status` = ?", ["active"]);
      });

    const { sql, values } = qb.toSQL();

    expect(sql).toBe(
      "SELECT `id`, `name` FROM `users` WHERE `status` = ?"
    );
    expect(values).toEqual(["active"]);
  });

  it("supports RawSQL in WHERE", () => {
    const qb = DB.table("users").where(
      DB.raw("JSON_CONTAINS(`tags`, ?)", ['"admin"'])
    );

    const { sql, values } = qb.toSQL();

    expect(sql).toBe(
      "SELECT * FROM `users` WHERE JSON_CONTAINS(`tags`, ?)"
    );
    // NOTE: because you default _columns to ["*"], this currently becomes `SELECT \`*\``
    // If you fix that in QueryBuilder, update this expectation too.
    expect(values).toEqual(['"admin"']);
  });

  it("allows constructing RawSQL directly (not via DB.raw)", () => {
    const rawFragment = new RawSQL("NOW()");
    const qb = DB.table(rawFragment); // FROM NOW() (weird, but just to assert it works)

    const { sql, values } = qb.toSQL();

    expect(sql).toBe("SELECT * FROM NOW()");
    expect(values).toEqual([]);
  });
});
