// tests/model.real.spec.ts
import {
  describe,
  it,
  expect,
  beforeEach,
} from "vitest";

import { raw } from "../../forge/pool/mysql";
import { Model } from "../../forge/database/model";
import { ModelCollection } from "../../forge/database/collection/model";

// Keep this in sync with your schema
interface UserAttrs {
  id: number;
  name: string;
  email: string;
  age: number | null;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// Concrete model for tests
class User extends Model<UserAttrs> {
  protected static table = "users";
  protected static fillable = ["id", "name", "email", "age", "deleted_at"];

  constructor(attrs: Partial<UserAttrs> = {}) {
    super(attrs);
  }
}

// ----- only place we use raw.query: table reset + seed -----
async function resetUsersTable() {
  await raw.query("TRUNCATE TABLE `users`");

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

describe("Model + MySQL integration (User model)", () => {
  beforeEach(async () => {
    await resetUsersTable();
  });

  // ---------------------------------------------------
  // paginate()
  // ---------------------------------------------------
  it("User.paginate() returns ModelCollection<User> with correct meta and links", async () => {
    // add a 4th user for pagination using the Model
    const extra = new User({
      name: "David",
      email: "david@example.com",
      age: 28,
    });
    await extra.save();

    const col = (await (User as any).paginate(1, 2)) as ModelCollection<User>;

    expect(col).toBeInstanceOf(ModelCollection);
    expect(col.length).toBe(2);

    const [u1, u2] = col.toArray();
    expect(u1).toBeInstanceOf(User);
    expect(u2).toBeInstanceOf(User);

    // Linked list
    expect(u1.next()).toBe(u2);
    expect(u2.previous()).toBe(u1);

    // Meta
    expect(col.meta.total).toBe(4);
    expect(col.meta.totalPages).toBe(2);
    expect(col.meta.page).toBe(1);
    expect(col.meta.perPage).toBe(2);
    expect(col.meta.hasNextPage).toBe(true);
    expect(col.meta.hasPrevPage).toBe(false);
  });

  // ---------------------------------------------------
  // find()
  // ---------------------------------------------------
  it("User.find() returns a hydrated model by primary key", async () => {
    // Get Alice via QueryBuilder (not raw)
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

  // ---------------------------------------------------
  // save() -> insert
  // ---------------------------------------------------
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

  // ---------------------------------------------------
  // save() -> update
  // ---------------------------------------------------
  it("save() updates existing row when model already exists", async () => {
    const rows = await (User as any)
      .query()
      .where("`email` = ?", ["bob@example.com"])
      .get();
    const bobRow = (rows as any[])[0];

    const user = new User(bobRow);
    (user as any)._exists = true; // simulate loaded model

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

  // ---------------------------------------------------
  // delete()
  // ---------------------------------------------------
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

  // ---------------------------------------------------
  // softDelete()
  // ---------------------------------------------------
  it("softDelete() sets deleted_at and keeps row (hidden by default query)", async () => {
    const rows = await (User as any)
      .query()
      .where("`email` = ?", ["alice@example.com"])
      .get();
    const aliceRow = (rows as any[])[0];

    const user = new User(aliceRow);
    (user as any)._exists = true;

    await user.softDelete();

    // Default User.query() should hide soft-deleted rows
    const visibleRows = await (User as any)
      .query()
      .where("`email` = ?", ["alice@example.com"])
      .get();
    expect((visibleRows as any[]).length).toBe(0);

    // withTrashed() should show it and have deleted_at set
    const trashedRows = await (User as any)
      .withTrashed()
      .where("`email` = ?", ["alice@example.com"])
      .get();

    const list = trashedRows as any[];
    expect(list.length).toBe(1);
    expect(list[0].deleted_at).toBeTruthy();
  });

  // ---------------------------------------------------
  // lifecycle events
  // ---------------------------------------------------
  it("fires lifecycle events for create / update / delete / softDelete", async () => {
    const events: string[] = [];

    // reset listeners & mark booted
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

    // --- create ---
    const user = new User({
      name: "Lifecycle",
      email: "life@example.com",
      age: 20,
    });
    await user.save();

    expect(events).toEqual(["creating", "created"]);

    // --- update ---
    events.length = 0;
    (user as any)._exists = true;
    user.set("age", 21);
    await user.save();
    expect(events).toEqual(["updating", "updated"]);

    // --- delete ---
    events.length = 0;
    await user.delete();
    expect(events).toEqual(["deleting", "deleted"]);

    // --- soft delete another user ---
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
