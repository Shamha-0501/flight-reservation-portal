// tests/model.test.ts
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";

import { DB } from "../../forge/database/facades/db"; // adjust path
import { LifecycleEvent, Model } from "../../forge/database/model"; // adjust path
import { ModelCollection } from "../../forge/database/collection/model";

// -----------------------------------------------------
// Test model + attrs
// -----------------------------------------------------
interface UserAttrs {
  id: number;
  name: string;
  email: string;
  deleted_at: Date | null;
}

class User extends Model<UserAttrs> {
  protected static table = "users";
  protected static fillable = ["id", "name", "email", "deleted_at"];

  constructor(attrs: Partial<UserAttrs> = {}) {
    super(attrs);
  }
}


describe("Model & ModelCollection", () => {
  const originalTable = DB.table;

  beforeEach(() => {
    // Reset any mocks between tests
    (DB as any).table = originalTable;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    // Restore original DB.table so we don't leak mocks
    (DB as any).table = originalTable;
  });

  // ---------------------------------------------------
  // ModelCollection basics
  // ---------------------------------------------------
  it("ModelCollection links items as a doubly-linked list", () => {
    const u1 = new User({ id: 1, name: "A", email: "a@example.com" });
    const u2 = new User({ id: 2, name: "B", email: "b@example.com" });
    const u3 = new User({ id: 3, name: "C", email: "c@example.com" });

    const meta = {
      page: 1,
      perPage: 3,
      total: 3,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    };

    const col = new ModelCollection([u1, u2, u3], meta);

    expect(col.length).toBe(3);
    expect(col.first()).toBe(u1);
    expect(col.last()).toBe(u3);

    // Linked list navigation
    expect((u1 as any)._next).toBe(u2);
    expect((u2 as any)._prev).toBe(u1);
    expect((u2 as any)._next).toBe(u3);
    expect((u3 as any)._prev).toBe(u2);

    // Collection & index references
    expect((u1 as any)._collection).toBe(col);
    expect((u2 as any)._collection).toBe(col);
    expect((u3 as any)._collection).toBe(col);

    expect((u1 as any)._index).toBe(0);
    expect((u2 as any)._index).toBe(1);
    expect((u3 as any)._index).toBe(2);

    // Current pointer
    expect(col.current).toBe(u1);
    col.currentIndex = 2;
    expect(col.current).toBe(u3);
  });

  // ---------------------------------------------------
  // Fillable / attribute handling
  // ---------------------------------------------------
  it("respects fillable fields when filling attributes", () => {
    const user = new User({
      id: 1,
      name: "Alice",
      email: "alice@example.com",
      // @ts-expect-error - not in attrs
      secret: "should not be stored",
    });

    expect(user.get("id")).toBe(1);
    expect(user.get("name")).toBe("Alice");
    expect(user.get("email")).toBe("alice@example.com");
    expect((user as any).get("secret")).toBeUndefined();
  });

  it("set() ignores non-fillable attributes", () => {
    const user = new User();
    user.set("name", "Bob");

    expect(user.get("name")).toBe("Bob");

    user.set("deleted_at", new Date());
    // deleted_at IS fillable in this test model, so it should be there
    expect(user.get("deleted_at")).toBeInstanceOf(Date);
  });

  // ---------------------------------------------------
  // save() -> insert
  // ---------------------------------------------------
  it("save() inserts when model does not exist", async () => {
    const insertMock = vi.fn().mockReturnThis();
    const execMock = vi.fn().mockResolvedValue({ insertId: 42 });

    const tableMock = vi.fn(() => ({
      insert: insertMock,
      exec: execMock,
    }));

    (DB as any).table = tableMock;

    const user = new User({
      name: "New User",
      email: "new@example.com",
    });

    await user.save();

    expect(tableMock).toHaveBeenCalledWith("users");

    // insert should not include id if not set
    expect(insertMock).toHaveBeenCalledWith({
      name: "New User",
      email: "new@example.com",
      deleted_at: undefined,
    });

    expect(execMock).toHaveBeenCalled();
    expect(user.get("id")).toBe(42);
  });

  // ---------------------------------------------------
  // save() -> update
  // ---------------------------------------------------
  it("save() updates when model already exists", async () => {
    const whereMock = vi.fn().mockReturnThis();
    const updateMock = vi.fn().mockReturnThis();
    const execMock = vi.fn().mockResolvedValue({ affectedRows: 1 });

    const tableMock = vi.fn(() => ({
      where: whereMock,
      update: updateMock,
      exec: execMock,
    }));

    (DB as any).table = tableMock;

    const user = new User({
      id: 10,
      name: "Original",
      email: "orig@example.com",
    });

    // Mark it as existing so save() goes into update branch
    (user as any)._exists = true;

    // Change attribute
    user.set("name", "Updated Name");

    await user.save();

    expect(tableMock).toHaveBeenCalledWith("users");
    expect(whereMock).toHaveBeenCalledWith("`id` = ?", [10]);

    // should send all fillable that are present in _attributes
    expect(updateMock).toHaveBeenCalledWith({
      id: 10,
      name: "Updated Name",
      email: "orig@example.com",
      deleted_at: undefined,
    });

    expect(execMock).toHaveBeenCalled();
  });

  // ---------------------------------------------------
  // delete()
  // ---------------------------------------------------
  it("delete() performs hard delete via DB.table", async () => {
    const whereMock = vi.fn().mockReturnThis();
    const deleteMock = vi.fn().mockReturnThis();
    const execMock = vi.fn().mockResolvedValue({ affectedRows: 1 });

    const tableMock = vi.fn(() => ({
      where: whereMock,
      delete: deleteMock,
      exec: execMock,
    }));

    (DB as any).table = tableMock;

    const user = new User({ id: 5, name: "To Delete" });
    (user as any)._exists = true;

    await user.delete();

    expect(tableMock).toHaveBeenCalledWith("users");
    expect(whereMock).toHaveBeenCalledWith("`id` = ?", [5]);
    expect(deleteMock).toHaveBeenCalled();
    expect(execMock).toHaveBeenCalled();
    expect((user as any)._exists).toBe(false);
  });

  // ---------------------------------------------------
  // softDelete()
  // ---------------------------------------------------
  it("softDelete() sets deleted_at and calls QueryBuilder.softDelete", async () => {
    const whereMock = vi.fn().mockReturnThis();
    const softDeleteMock = vi.fn().mockReturnThis();
    const execMock = vi.fn().mockResolvedValue({ affectedRows: 1 });

    const tableMock = vi.fn(() => ({
      where: whereMock,
      softDelete: softDeleteMock,
      exec: execMock,
    }));

    (DB as any).table = tableMock;

    const user = new User({ id: 7, name: "Soft Delete" });
    (user as any)._exists = true;

    await user.softDelete();

    expect(tableMock).toHaveBeenCalledWith("users");
    expect(whereMock).toHaveBeenCalledWith("`id` = ?", [7]);

    // first arg is column name, second is Date
    const [col, value] = softDeleteMock.mock.calls[0];

    expect(col).toBe("deleted_at");
    expect(value).toBeInstanceOf(Date);

    // attribute should be updated too
    expect(user.get("deleted_at")).toBeInstanceOf(Date);

    expect(execMock).toHaveBeenCalled();
  });

  // ---------------------------------------------------
  // paginate()
  // ---------------------------------------------------
  it("paginate() returns ModelCollection with hydrated models and meta", async () => {
    const withoutTrashedMock = vi.fn().mockReturnThis();
    const paginateMock = vi.fn().mockResolvedValue({
      data: [
        { id: 1, name: "U1", email: "u1@example.com", deleted_at: null },
        { id: 2, name: "U2", email: "u2@example.com", deleted_at: null },
      ],
      page: 2,
      perPage: 2,
      total: 10,
      totalPages: 5,
      hasNextPage: true,
      hasPrevPage: true,
    });

    const tableMock = vi.fn(() => ({
      withoutTrashed: withoutTrashedMock,
      paginate: paginateMock,
    }));

    (DB as any).table = tableMock;

    const col = await User.paginate(2, 2);

    expect(tableMock).toHaveBeenCalledWith("users");
    expect(withoutTrashedMock).toHaveBeenCalledWith("deleted_at");
    expect(paginateMock).toHaveBeenCalledWith(2, 2);

    expect(col).toBeInstanceOf(ModelCollection);
    expect(col.length).toBe(2);

    const [u1, u2] = col.toArray();

    expect(u1).toBeInstanceOf(User);
    expect(u1.get("id")).toBe(1);
    expect(u2.get("id")).toBe(2);

    // Linked list wiring
    expect((u1 as any)._next).toBe(u2);
    expect((u2 as any)._prev).toBe(u1);

    // Meta
    expect(col.meta.page).toBe(2);
    expect(col.meta.perPage).toBe(2);
    expect(col.meta.total).toBe(10);
    expect(col.meta.totalPages).toBe(5);
    expect(col.meta.hasNextPage).toBe(true);
    expect(col.meta.hasPrevPage).toBe(true);
  });

  // ---------------------------------------------------
  // Lifecycle events
  // ---------------------------------------------------
  it("fires lifecycle events for create / update / delete / softDelete", async () => {
    const events: string[] = [];

    User.on("creating" as LifecycleEvent, () => { events.push("creating"); });
    User.on("created" as LifecycleEvent, () => { events.push("created"); });
    User.on("updating" as LifecycleEvent, () => { events.push("updating"); });
    User.on("updated" as LifecycleEvent, () => { events.push("updated"); });
    User.on("deleting" as LifecycleEvent, () => { events.push("deleting"); });
    User.on("deleted" as LifecycleEvent, () => { events.push("deleted"); });
    User.on("softDeleting" as LifecycleEvent, () => { events.push("softDeleting"); });
    User.on("softDeleted" as LifecycleEvent, () => { events.push("softDeleted"); });

    // --- mock for create ---
    const insertMock = vi.fn().mockReturnThis();
    const execInsert = vi.fn().mockResolvedValue({ insertId: 100 });

    const tableCreate = vi.fn(() => ({
      insert: insertMock,
      exec: execInsert,
    }));

    (DB as any).table = tableCreate;

    const user = new User({ name: "Lifecycle", email: "life@example.com" });
    await user.save();

    // create events
    expect(events.slice(0, 2)).toEqual(["creating", "created"]);

    // --- mock for update ---
    events.length = 0; // clear
    const whereMock = vi.fn().mockReturnThis();
    const updateMock = vi.fn().mockReturnThis();
    const execUpdate = vi.fn().mockResolvedValue({ affectedRows: 1 });

    const tableUpdate = vi.fn(() => ({
      where: whereMock,
      update: updateMock,
      exec: execUpdate,
    }));

    (DB as any).table = tableUpdate;
    (user as any)._exists = true;

    await user.save();

    expect(events).toEqual(["updating", "updated"]);

    // --- mock for delete ---
    events.length = 0;
    const whereDel = vi.fn().mockReturnThis();
    const deleteMock = vi.fn().mockReturnThis();
    const execDel = vi.fn().mockResolvedValue({ affectedRows: 1 });

    const tableDelete = vi.fn(() => ({
      where: whereDel,
      delete: deleteMock,
      exec: execDel,
    }));

    (DB as any).table = tableDelete;
    (user as any)._exists = true;

    await user.delete();

    expect(events).toEqual(["deleting", "deleted"]);

    // --- mock for softDelete ---
    events.length = 0;
    const whereSoft = vi.fn().mockReturnThis();
    const softDeleteMock = vi.fn().mockReturnThis();
    const execSoft = vi.fn().mockResolvedValue({ affectedRows: 1 });

    const tableSoft = vi.fn(() => ({
      where: whereSoft,
      softDelete: softDeleteMock,
      exec: execSoft,
    }));

    (DB as any).table = tableSoft;
    (user as any)._exists = true;

    await user.softDelete();

    expect(events).toEqual(["softDeleting", "softDeleted"]);
  });
});
