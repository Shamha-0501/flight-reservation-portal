import { describe, it, expect, beforeEach } from "vitest";

import { raw } from "../../forge/pool/mysql";
import { QueryBuilder } from "../../forge/database/builder";
import { Model } from "../../forge/database/model";
import { ModelCollection } from "../../forge/database/collection/model";

// ---------- Shared types ----------

interface UserRow {
  id: number;
  name: string;
  email: string;
  age: number | null;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface UserAttrs extends UserRow {}

// ---------- Concrete Model ----------

class User extends Model<UserAttrs> {
  protected static table = "users";
  protected static fillable = ["id", "name", "email", "age", "deleted_at"];

  constructor(attrs: Partial<UserAttrs> = {}) {
    super(attrs);
  }
}

// ---------- Only place we use raw: reset + seed ----------

async function resetUsersTable() {
  await raw.query("TRUNCATE TABLE `users`");

  // Base 3 users
  await raw.query(
    "INSERT INTO `users` (`name`, `email`, `age`, `deleted_at`) VALUES " +
      "(?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?)",
    [
      "Alice",
      "alice@example.com",
      25,
      null,
      "Bob",
      "bob@example.com",
      30,
      null,
      "Charlie",
      "charlie@example.com",
      35,
      null,
    ]
  );
}

beforeEach(async () => {
  await resetUsersTable();
});

// ===================================================================
//                     QueryBuilder integration
// ===================================================================

describe("QueryBuilder MySQL integration (users table)", () => {
  it("get() returns all users when no where clause", async () => {
    const qb = new QueryBuilder<UserRow>("users").select(
      "id",
      "name",
      "email"
    );

    const rows = await qb.get();
    expect(rows.length).toBe(3);

    const names = rows.map((r) => r.name).sort();
    expect(names).toEqual(["Alice", "Bob", "Charlie"]);
  });

  it("where() + get() filters correctly", async () => {
    const qb = new QueryBuilder<UserRow>("users")
      .select("id", "name", "email", "age")
      .where("`age` > ?", [25]);

    const rows = await qb.get();
    expect(rows.length).toBe(2);

    const names = rows.map((r) => r.name).sort();
    expect(names).toEqual(["Bob", "Charlie"]);
  });

  it("first() returns only one row ordered by id", async () => {
    const qb = new QueryBuilder<UserRow>("users")
      .select("id", "name", "email")
      .orderBy("id", "ASC");

    const row = await qb.first();

    expect(row).not.toBeNull();
    expect(row?.name).toBe("Alice");
  });

  it("insert() + exec() inserts a new user", async () => {
    const qb = new QueryBuilder<UserRow>("users").insert({
      name: "David",
      email: "david@example.com",
      age: 40,
      deleted_at: null,
    });

    const result = await qb.exec();
    expect(result.affectedRows).toBe(1);
    expect(result.insertId).toBeGreaterThan(0);

    const verify = await new QueryBuilder<UserRow>("users")
      .select("name", "email", "age")
      .where("`email` = ?", ["david@example.com"])
      .first();

    expect(verify).not.toBeNull();
    expect(verify?.name).toBe("David");
    expect(verify?.age).toBe(40);
  });

  it("update() + exec() updates existing rows", async () => {
    const qb = new QueryBuilder<UserRow>("users")
      .where("`email` = ?", ["bob@example.com"])
      .update({ age: 31 });

    const result = await qb.exec();
    expect(result.affectedRows).toBe(1);

    const bob = await new QueryBuilder<UserRow>("users")
      .select("name", "age")
      .where("`email` = ?", ["bob@example.com"])
      .first();

    expect(bob).not.toBeNull();
    expect(bob?.age).toBe(31);
  });

  it("delete() + exec() deletes matching rows", async () => {
    const qb = new QueryBuilder<UserRow>("users")
      .where("`email` = ?", ["charlie@example.com"])
      .delete();

    const result = await qb.exec();
    expect(result.affectedRows).toBe(1);

    const charlie = await new QueryBuilder<UserRow>("users")
      .select("id")
      .where("`email` = ?", ["charlie@example.com"])
      .first();

    expect(charlie).toBeNull();
  });

  it("softDelete() marks row and withoutTrashed / onlyTrashed behave correctly", async () => {
    const softDeleteQB = new QueryBuilder<UserRow>("users")
      .where("`email` = ?", ["bob@example.com"])
      .softDelete("deleted_at");

    const result = await softDeleteQB.exec();
    expect(result.affectedRows).toBe(1);

    // Default mode: withTrashed → no implicit filter
    const all = await new QueryBuilder<UserRow>("users")
      .select("name", "deleted_at")
      .get();
    expect(all.length).toBe(3);

    const bobRow = all.find((r) => r.name === "Bob");
    expect(bobRow).toBeDefined();
    expect(bobRow?.deleted_at).not.toBeNull();

    // withoutTrashed → exclude Bob
    const withoutTrashed = await new QueryBuilder<UserRow>("users")
      .select("name")
      .withoutTrashed("deleted_at")
      .get();

    const withoutNames = withoutTrashed.map((r) => r.name).sort();
    expect(withoutNames).toEqual(["Alice", "Charlie"]);

    // onlyTrashed → only Bob
    const onlyTrashed = await new QueryBuilder<UserRow>("users")
      .select("name")
      .onlyTrashed("deleted_at")
      .get();

    expect(onlyTrashed.length).toBe(1);
    expect(onlyTrashed[0].name).toBe("Bob");
  });

  it("paginate() returns correct meta & data slices", async () => {
    // Add a 4th user
    await new QueryBuilder<UserRow>("users")
      .insert({
        name: "David",
        email: "david@example.com",
        age: 28,
        deleted_at: null,
      })
      .exec();

    const qb = new QueryBuilder<UserRow>("users").orderBy("id", "ASC");

    const page1 = await qb.paginate(1, 2);
    expect(page1.total).toBe(4);
    expect(page1.totalPages).toBe(2);
    expect(page1.page).toBe(1);
    expect(page1.data.length).toBe(2);
    expect(page1.data[0].name).toBe("Alice");
    expect(page1.data[1].name).toBe("Bob");

    const page2 = await qb.paginate(2, 2);
    expect(page2.page).toBe(2);
    expect(page2.data.length).toBe(2);
    expect(page2.data[0].name).toBe("Charlie");
    expect(page2.data[1].name).toBe("David");
  });
});

// ===================================================================
//                     Model integration (uses QueryBuilder)
// ===================================================================

describe("Model + MySQL integration (User model)", () => {
  it("User.paginate() returns ModelCollection<User> with correct meta and links", async () => {
    const extra = new User({
      name: "David",
      email: "david@example.com",
      age: 28,
    });
    await extra.save();

    const col = (await (User as any).paginate(
      1,
      2
    )) as ModelCollection<User>;

    expect(col).toBeInstanceOf(ModelCollection);
    expect(col.length).toBe(2);

    const [u1, u2] = col.toArray();
    expect(u1).toBeInstanceOf(User);
    expect(u2).toBeInstanceOf(User);

    expect(u1.next()).toBe(u2);
    expect(u2.previous()).toBe(u1);

    expect(col.meta.total).toBe(4);
    expect(col.meta.totalPages).toBe(2);
    expect(col.meta.page).toBe(1);
    expect(col.meta.perPage).toBe(2);
    expect(col.meta.hasNextPage).toBe(true);
    expect(col.meta.hasPrevPage).toBe(false);
  });

  it("User.find() returns a hydrated model by primary key", async () => {
    const rows = await (User as any)
      .query()
      .where("`name` = ?", ["Alice"])
      .get();

    const aliceRow = (rows as any[])[0];
    const aliceId = aliceRow.id as number;

    const user = (await (User as any).find(aliceId)) as User | null;

    expect(user).not.toBeNull();
    expect(user).toBeInstanceOf(User);
    expect(user?.get("name")).toBe("Alice");
    expect(user?.get("email")).toBe("alice@example.com");
  });

  it("save() inserts a new row when model is new", async () => {
    const user = new User({
      name: "Eve",
      email: "eve@example.com",
      age: 22,
    });

    await user.save();

    const id = user.get("id");
    expect(id).toBeTruthy();

    const rows = await (User as any)
      .query()
      .where("`email` = ?", ["eve@example.com"])
      .get();

    const list = rows as any[];
    expect(list.length).toBe(1);
    expect(list[0].name).toBe("Eve");
    expect(list[0].email).toBe("eve@example.com");
    expect(list[0].age).toBe(22);
  });

  it("save() updates existing row when model already exists", async () => {
    const rows = await (User as any)
      .query()
      .where("`email` = ?", ["bob@example.com"])
      .get();
    const bobRow = (rows as any[])[0];

    const user = new User(bobRow);
    (user as any)._exists = true;

    user.set("age", 31);
    user.set("name", "Bobby");

    await user.save();

    const afterRows = await (User as any)
      .query()
      .where("`email` = ?", ["bob@example.com"])
      .get();
    const after = (afterRows as any[])[0];

    expect(after.name).toBe("Bobby");
    expect(after.age).toBe(31);
  });

  it("delete() removes the row from database", async () => {
    const rows = await (User as any)
      .query()
      .where("`email` = ?", ["charlie@example.com"])
      .get();
    const charlieRow = (rows as any[])[0];

    const user = new User(charlieRow);
    (user as any)._exists = true;

    await user.delete();

    const afterRows = await (User as any)
      .query()
      .where("`email` = ?", ["charlie@example.com"])
      .get();

    expect((afterRows as any[]).length).toBe(0);
  });

  it("softDelete() sets deleted_at and keeps row (hidden by default query)", async () => {
    const rows = await (User as any)
      .query()
      .where("`email` = ?", ["alice@example.com"])
      .get();
    const aliceRow = (rows as any[])[0];

    const user = new User(aliceRow);
    (user as any)._exists = true;

    await user.softDelete();

    const visibleRows = await (User as any)
      .query()
      .where("`email` = ?", ["alice@example.com"])
      .get();
    expect((visibleRows as any[]).length).toBe(0);

    const trashedRows = await (User as any)
      .withTrashed()
      .where("`email` = ?", ["alice@example.com"])
      .get();

    const list = trashedRows as any[];
    expect(list.length).toBe(1);
    expect(list[0].deleted_at).toBeTruthy();
  });

  it("fires lifecycle events for create / update / delete / softDelete", async () => {
    const events: string[] = [];

    (User as any)._listeners = new Map();
    (User as any)._booted = true;

    (User as any).on("creating", () => events.push("creating"));
    (User as any).on("created", () => events.push("created"));
    (User as any).on("updating", () => events.push("updating"));
    (User as any).on("updated", () => events.push("updated"));
    (User as any).on("deleting", () => events.push("deleting"));
    (User as any).on("deleted", () => events.push("deleted"));
    (User as any).on("softDeleting", () => events.push("softDeleting"));
    (User as any).on("softDeleted", () => events.push("softDeleted"));

    // create
    const user = new User({
      name: "Lifecycle",
      email: "life@example.com",
      age: 20,
    });
    await user.save();
    expect(events).toEqual(["creating", "created"]);

    // update
    events.length = 0;
    (user as any)._exists = true;
    user.set("age", 21);
    await user.save();
    expect(events).toEqual(["updating", "updated"]);

    // delete
    events.length = 0;
    await user.delete();
    expect(events).toEqual(["deleting", "deleted"]);

    // soft delete Alice
    events.length = 0;
    const rows = await (User as any)
      .query()
      .where("`email` = ?", ["alice@example.com"])
      .get();
    const aliceRow = (rows as any[])[0];

    const alice = new User(aliceRow);
    (alice as any)._exists = true;

    await alice.softDelete();
    expect(events).toEqual(["softDeleting", "softDeleted"]);
  });
});
