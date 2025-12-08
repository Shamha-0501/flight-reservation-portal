// tests/query-builder.spec.ts
import { describe, it, expect } from "vitest";
import { QueryBuilder } from "../../forge/database/builder"; // adjust path as needed
import { RawSQL } from "../../forge/pool/mysql";

describe("QueryBuilder.toSQL – SELECT", () => {
  it("builds a basic SELECT * query (no soft delete filter by default)", () => {
    const qb = new QueryBuilder("users");

    const { sql, values } = qb.toSQL();

    expect(sql).toBe("SELECT * FROM `users`");
    expect(values).toEqual([]);
  });

  it("builds SELECT with explicit columns, WHERE, ORDER BY, LIMIT & OFFSET", () => {
    const qb = new QueryBuilder("users")
      .select("id", "email")
      .where("`status` = ?", ["active"])
      .orderBy("id", "DESC")
      .limit(10)
      .offset(20);

    const { sql, values } = qb.toSQL();

    expect(sql).toBe(
      "SELECT `id`, `email` FROM `users` WHERE `status` = ? ORDER BY id DESC LIMIT 10 OFFSET 20"
    );
    expect(values).toEqual(["active"]);
  });

  it("builds SELECT with RawSQL column and RawSQL table", () => {
    const qb = new QueryBuilder(
      new RawSQL("(SELECT * FROM `users`) AS u")
    ).select(new RawSQL("u.id"));

    const { sql, values } = qb.toSQL();

    expect(sql).toBe(
      "SELECT u.id FROM (SELECT * FROM `users`) AS u"
    );
    expect(values).toEqual([]);
  });

  it("builds SELECT with a simple WHERE condition and bindings", () => {
    const qb = new QueryBuilder("users").where("age > ?", [18]);

    const { sql, values } = qb.toSQL();

    expect(sql).toBe(
      "SELECT * FROM `users` WHERE age > ?"
    );
    expect(values).toEqual([18]);
  });

  it("builds SELECT with nested WHERE group (callback) and additional condition", () => {
    const qb = new QueryBuilder("users")
      .where((q) => {
        q.where("age > ?", [18]);
        q.orWhere("age IS NULL");
      })
      .where("status = ?", ["active"]);

    const { sql, values } = qb.toSQL();

    expect(sql).toBe(
      "SELECT * FROM `users` WHERE ( age > ? OR age IS NULL ) AND status = ?"
    );
    expect(values).toEqual([18, "active"]);
  });

  it("builds SELECT with RawSQL WHERE condition and bindings", () => {
    const qb = new QueryBuilder("events").where(
      new RawSQL("created_at > ?", ["2023-01-01"])
    );

    const { sql, values } = qb.toSQL();

    expect(sql).toBe(
      "SELECT * FROM `events` WHERE created_at > ?"
    );
    expect(values).toEqual(["2023-01-01"]);
  });

  it("applies when() only when value is truthy", () => {
    const qb = new QueryBuilder("users")
      .when(true, (builder) =>
        builder.where("status = ?", ["active"])
      )
      .when(false, (builder) =>
        builder.where("role = ?", ["admin"])
      );

    const { sql, values } = qb.toSQL();

    expect(sql).toBe(
      "SELECT * FROM `users` WHERE status = ?"
    );
    expect(values).toEqual(["active"]);
  });
});

describe("QueryBuilder.toSQL – INSERT", () => {
  it("builds INSERT with single row", () => {
    const qb = new QueryBuilder("users").insert({
      id: 1,
      email: "test@example.com",
    });

    const { sql, values } = qb.toSQL();

    expect(sql).toBe(
      "INSERT INTO `users` (`id`, `email`) VALUES (?, ?)"
    );
    expect(values).toEqual([1, "test@example.com"]);
  });

  it("builds INSERT with multiple rows", () => {
    const qb = new QueryBuilder("users").insert([
      { id: 1, email: "a@example.com" },
      { id: 2, email: "b@example.com" },
    ]);

    const { sql, values } = qb.toSQL();

    expect(sql).toBe(
      "INSERT INTO `users` (`id`, `email`) VALUES (?, ?), (?, ?)"
    );
    expect(values).toEqual([1, "a@example.com", 2, "b@example.com"]);
  });
});

describe("QueryBuilder.toSQL – UPDATE", () => {
  it("builds UPDATE with WHERE and LIMIT", () => {
    const qb = new QueryBuilder("users")
      .update({ status: "active" })
      .where("id = ?", [1])
      .limit(1);

    const { sql, values } = qb.toSQL();

    expect(sql).toBe(
      "UPDATE `users` SET `status` = ? WHERE id = ? LIMIT 1"
    );
    expect(values).toEqual(["active", 1]);
  });

  it("builds soft delete UPDATE using softDelete()", () => {
    const qb = new QueryBuilder("users")
      .where("id = ?", [5])
      .softDelete("deleted_at", "2024-01-01");

    const { sql, values } = qb.toSQL();

    expect(sql).toBe(
      "UPDATE `users` SET `deleted_at` = ? WHERE id = ?"
    );
    expect(values).toEqual(["2024-01-01", 5]);
  });

  it("builds restore UPDATE using restore()", () => {
    const qb = new QueryBuilder("users")
      .where("id = ?", [5])
      .restore("deleted_at");

    const { sql, values } = qb.toSQL();

    expect(sql).toBe(
      "UPDATE `users` SET `deleted_at` = ? WHERE id = ?"
    );
    expect(values).toEqual([null, 5]);
  });
});

describe("QueryBuilder.toSQL – DELETE", () => {
  it("builds DELETE with WHERE and LIMIT", () => {
    const qb = new QueryBuilder("users")
      .delete()
      .where("id = ?", [1])
      .limit(1);

    const { sql, values } = qb.toSQL();

    expect(sql).toBe(
      "DELETE FROM `users` WHERE id = ? LIMIT 1"
    );
    expect(values).toEqual([1]);
  });
});

describe("QueryBuilder soft delete trashed modes", () => {
  it("withTrashed(): no deleted_at filter", () => {
    const qb = new QueryBuilder("users").withTrashed();
    const { sql, values } = qb.toSQL();

    expect(sql).toBe("SELECT * FROM `users`");
    expect(values).toEqual([]);
  });

  it("withoutTrashed(): adds deleted_at IS NULL", () => {
    const qb = new QueryBuilder("users").withoutTrashed();
    const { sql, values } = qb.toSQL();

    expect(sql).toBe(
      "SELECT * FROM `users` WHERE `deleted_at` IS NULL"
    );
    expect(values).toEqual([]);
  });

  it("onlyTrashed(): adds deleted_at IS NOT NULL", () => {
    const qb = new QueryBuilder("users").onlyTrashed();
    const { sql, values } = qb.toSQL();

    expect(sql).toBe(
      "SELECT * FROM `users` WHERE `deleted_at` IS NOT NULL"
    );
    expect(values).toEqual([]);
  });

  it("withoutTrashed() combines with existing WHERE", () => {
    const qb = new QueryBuilder("users")
      .withoutTrashed()
      .where("status = ?", ["active"]);

    const { sql, values } = qb.toSQL();

    expect(sql).toBe(
      "SELECT * FROM `users` WHERE status = ? AND `deleted_at` IS NULL"
    );
    expect(values).toEqual(["active"]);
  });
});
