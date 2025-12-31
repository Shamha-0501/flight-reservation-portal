import { PaginatedResult, QueryBuilder } from "@/forge/database/builder";
import { RelationOne, RelationMany } from "./relation/relation";
import { ModelCollection } from "@/forge/database/collection/model";
import { DB } from "@/forge/database/facades/db";

export type PaginationMeta = Omit<PaginatedResult<any>, "data">;

export type LifecycleEvent =
  | "creating"
  | "created"
  | "updating"
  | "updated"
  | "deleting"
  | "deleted"
  | "softDeleting"
  | "softDeleted";

export type LifecycleHandler<M extends Model<any>> = (
  model: M
) => Promise<void> | void;

type ModelCtor<TAttrs extends Record<string, any>, M extends Model<TAttrs>> = {
  new (attrs?: Partial<TAttrs>): M;

  getPrimaryKey(): string;
  query(): QueryBuilder<TAttrs>;
  hydrate(row: TAttrs): M;
  hydrateMany(rows: TAttrs[]): M[];
};

/**
 * Base Model class. T is the attributes shape, e.g.
 * interface UserAttrs { id: number; name: string; email: string; }
 * class User extends Model<UserAttrs> { ... }
 */
export abstract class Model<T extends Record<string, any>> {
  // ---- Static config (per subclass) ----
  // override in subclass
  protected static table: string;
  protected static fillable: string[] = [];
  protected static hidden: string[] = [];
  protected static visible: string[] = []; // if non-empty => whitelist mode
  protected static primaryKey: string = "id";
  protected static softDeleteColumn: string | null = "deleted_at";

  // ---- Internal static state ----
  private static _booted = false;
  private static _listeners: Map<LifecycleEvent, LifecycleHandler<any>[]> =
    new Map();

  // ---- Instance state ----
  protected _attributes: Partial<T> = {};
  protected _exists = false;

  // linked-list & collection references (set by ModelCollection)
  protected _prev: this | null = null;
  protected _next: this | null = null;
  protected _hidden: Set<string> = new Set();
  protected _visible: Set<string> = new Set();
  protected _collection: ModelCollection<this> | null = null;
  protected _index: number | null = null;

  constructor(attrs: Partial<T> = {}) {
    this.defineFillableAccessors();
    this.fill(attrs);
  }

  /** Hidden columns accessor */
  static getHidden(): string[] {
    const self = this as typeof Model;
    return self.hidden || [];
  }

  /** Visible columns accessor (whitelist) */
  static getVisible(): string[] {
    const self = this as typeof Model;
    return self.visible || [];
  }

  /** Hide extra fields for this instance only */
  makeHidden(keys: (keyof T | string)[]): this {
    keys.map(String).forEach((k) => this._hidden.add(k));
    return this;
  }

  /** Show only these fields for this instance (whitelist) */
  makeVisible(keys: (keyof T | string)[]): this {
    keys.map(String).forEach((k) => this._visible.add(k));
    return this;
  }

  /** Replace hidden set for this instance */
  setHidden(keys: (keyof T | string)[]): this {
    this._hidden = new Set(keys.map(String));
    return this;
  }

  /** Replace visible set for this instance */
  setVisible(keys: (keyof T | string)[]): this {
    this._visible = new Set(keys.map(String));
    return this;
  }

  /** Clear per-instance overrides */
  clearHidden(): this {
    this._hidden.clear();
    return this;
  }

  clearVisible(): this {
    this._visible.clear();
    return this;
  }

  // ---------- Static helpers ----------

  /** Table name accessor */
  static getTable(): string {
    const self = this as typeof Model;
    if (!self.table) {
      throw new Error(`Model "${self.name}" must define static table`);
    }
    return self.table;
  }

  /** Fillable columns accessor */
  static getFillable(): string[] {
    const self = this as typeof Model;
    return self.fillable || [];
  }

  /** Primary key accessor */
  static getPrimaryKey(): string {
    return (this as typeof Model).primaryKey || "id";
  }

  /** Soft delete column (or null) */
  static getSoftDeleteColumn(): string | null {
    return (this as typeof Model).softDeleteColumn ?? null;
  }

  /** Lazily boot the model (to register observers/listeners) */
  protected static ensureBooted() {
    const self = this as typeof Model;
    if (!self._booted) {
      self._booted = true;
      if (typeof (self as any).booted === "function") {
        (self as any).booted();
      }
    }
  }

  /**
   * Subclasses can override this to register events:
   *
   * protected static booted() {
   *   this.on("creating", (user: User) => { ... });
   * }
   */
  protected static booted(): void {}

  /** Register lifecycle hooks from outside (observers/listeners/jobs) */
  static on(event: LifecycleEvent, handler: LifecycleHandler<any>) {
    const self = this as typeof Model;
    self.ensureBooted();
    const listeners = self._listeners.get(event) || [];
    listeners.push(handler as any);
    self._listeners.set(event, listeners);
  }

  protected static async fire(event: LifecycleEvent, model: Model<any>) {
    const self = this as typeof Model;
    const listeners = self._listeners.get(event) || [];
    for (const handler of listeners) {
      await handler(model);
    }
  }

  /** Base QueryBuilder for this model's table (respecting soft-delete by default) */
  static query<TAttrs extends Record<string, any>>(
    this: { new (...args: any[]): Model<TAttrs> } & typeof Model
  ): QueryBuilder<TAttrs> {
    this.ensureBooted();

    const table = this.getTable();
    const qb = DB.table<TAttrs>(table);

    const softCol = this.getSoftDeleteColumn();
    if (softCol) {
      // default: hide soft-deleted
      qb.withoutTrashed(softCol);
    }

    return qb;
  }

  /** With trashed rows included */
  static withTrashed<TAttrs extends Record<string, any>>(
    this: { new (...args: any[]): Model<TAttrs> } & typeof Model
  ): QueryBuilder<TAttrs> {
    const softCol = this.getSoftDeleteColumn();
    const qb = this.query<TAttrs>();
    if (softCol) {
      qb.withTrashed(softCol);
    }
    return qb;
  }

  /** Only soft-deleted rows */
  static onlyTrashed<TAttrs extends Record<string, any>>(
    this: { new (...args: any[]): Model<TAttrs> } & typeof Model
  ): QueryBuilder<TAttrs> {
    const softCol = this.getSoftDeleteColumn();
    const qb = this.query<TAttrs>();
    if (softCol) {
      qb.onlyTrashed(softCol);
    }
    return qb;
  }

  /** Hydrate a single raw row into a model instance */
  static hydrate<TAttrs extends Record<string, any>, M extends Model<TAttrs>>(
    this: { new (attrs: Partial<TAttrs>): M } & typeof Model,
    row: TAttrs
  ): M {
    const model = new (this as any)(row);
    (model as any)._exists = true;
    return model;
  }

  /** Hydrate an array of rows */
  static hydrateMany<
    TAttrs extends Record<string, any>,
    M extends Model<TAttrs>
  >(
    this: { new (attrs: Partial<TAttrs>): M } & typeof Model,
    rows: TAttrs[]
  ): M[] {
    return rows.map((row) => this.hydrate(row)) as M[];
  }

  /** Paginate and return ModelCollection<ThisModel> */
  static async paginate(page = 1, perPage = 10): Promise<ModelCollection<any>> {
    const ctor = this as any;
    const result = await ctor.query().paginate(page, perPage);

    const models = ctor.hydrateMany(result.data);

    const meta = {
      page: result.page,
      perPage: result.perPage,
      total: result.total,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    };

    return new ModelCollection(models, meta);
  }

  /** Find by primary key */
  static async find<
    TAttrs extends Record<string, any>,
    M extends Model<TAttrs>
  >(
    this: { new (attrs: Partial<TAttrs>): M } & typeof Model,
    id: any
  ): Promise<M | null> {
    const pk = this.getPrimaryKey();
    const row = await this.query<TAttrs>().where(`\`${pk}\` = ?`, [id]).first();

    if (!row) return null;
    return this.hydrate(row) as M;
  }

  /** Get the latest record by a given column (defaults to primary key) */
  static async latest<
    TAttrs extends Record<string, any>,
    M extends Model<TAttrs>
  >(
    this: { new (attrs: Partial<TAttrs>): M } & typeof Model,
    column?: keyof TAttrs | string
  ): Promise<M | null> {
    const col = column ? String(column) : this.getPrimaryKey();

    const row = await this.query<TAttrs>()
      .orderBy(`\`${col}\``, "DESC")
      .first();

    if (!row) return null;
    return this.hydrate(row) as M;
  }

  /** Convenience: latest record by primary key */
  static async last<
    TAttrs extends Record<string, any>,
    M extends Model<TAttrs>
  >(
    this: { new (attrs: Partial<TAttrs>): M } & typeof Model
  ): Promise<M | null> {
    // just delegate to latest() with default column (primary key)
    return this.latest<TAttrs, M>();
  }

  /** Get all records for this model (as hydrated instances) */
  static async all<TAttrs extends Record<string, any>, M extends Model<TAttrs>>(
    this: { new (attrs: Partial<TAttrs>): M } & typeof Model
  ): Promise<M[]> {
    const rows = await this.query<TAttrs>().get();
    return this.hydrateMany(rows) as M[];
  }

  // ---------- Instance attribute helpers ----------

  /** Raw attributes */
  get attributes(): Partial<T> {
    return { ...this._attributes };
  }

  /** Get attribute by key */
  get<K extends keyof T>(key: K): T[K] | undefined {
    return this._attributes[key] as T[K] | undefined;
  }

  /** Set attribute (only if in fillable) */
  set<K extends keyof T>(key: K, value: T[K]): this {
    const ctor = this.constructor as typeof Model;
    const fillable = ctor.getFillable();

    if (fillable.length > 0 && !fillable.includes(key as string)) {
      // silently ignore non-fillable; or throw if you prefer
      return this;
    }

    this._attributes[key] = value;
    return this;
  }

  /** Bulk fill from object (respecting fillable) */
  fill(attrs: Partial<T>): this {
    const ctor = this.constructor as typeof Model;
    const fillable = ctor.getFillable();

    if (fillable.length === 0) {
      // if no fillable configured, accept all keys
      Object.assign(this._attributes, attrs);
      return this;
    }

    for (const key of fillable) {
      if (key in attrs) {
        (this._attributes as any)[key] = (attrs as any)[key];
      }
    }

    return this;
  }

  protected defineFillableAccessors() {
    const ctor = this.constructor as typeof Model;
    const fillable = ctor.getFillable();

    if (!fillable || fillable.length === 0) return;

    for (const key of fillable) {
      // If there is already an accessor defined for this key (custom getter/setter),
      // don't override it.
      const existing =
        Object.getOwnPropertyDescriptor(this, key) ||
        Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), key);

      if (existing && (existing.get || existing.set)) {
        continue;
      }

      Object.defineProperty(this, key, {
        get: function () {
          return (this as any)._attributes[key];
        },
        set: function (value: any) {
          // Delegate to Model.set() so fillable rules are respected
          (this as any).set(key as any, value);
        },
        enumerable: true,
        configurable: true,
      });
    }
  }

  toJSON(): Partial<T> {
    const ctor = this.constructor as typeof Model;

    const raw = this.attributes as Record<string, any>;

    const staticHidden = new Set(ctor.getHidden().map(String));
    const staticVisible = new Set(ctor.getVisible().map(String));

    // instance overrides
    const hidden = new Set<string>([...staticHidden, ...this._hidden]);
    const visible = new Set<string>([...staticVisible, ...this._visible]);

    const useWhitelist = visible.size > 0;

    const out: Record<string, any> = {};

    for (const [key, value] of Object.entries(raw)) {
      if (hidden.has(key)) continue;

      if (useWhitelist) {
        if (visible.has(key)) out[key] = value;
        continue;
      }

      out[key] = value;
    }

    return out as Partial<T>;
  }

  // ---------- Linked list helpers ----------

  previous(): this | null {
    return this._prev;
  }

  next(): this | null {
    return this._next;
  }

  collection(): ModelCollection<this> | null {
    return this._collection;
  }

  indexInCollection(): number | null {
    return this._index;
  }

  // ---------- Persistence ----------

  /** Insert a single row (fillable-only) */
  static async insert<TAttrs extends Record<string, any>>(
    this: typeof Model,
    attrs: Partial<TAttrs>
  ) {
    const table = this.getTable();
    const fillable = this.getFillable();

    const data: Record<string, any> = {};
    if (fillable.length === 0) {
      Object.assign(data, attrs);
    } else {
      for (const key of fillable) {
        if (key in (attrs as any)) data[key] = (attrs as any)[key];
      }
    }

    // if PK is missing, do not force it
    const pk = this.getPrimaryKey();
    if (data[pk] == null) delete data[pk];

    return await DB.table(table).insert(data).exec();
  }

  /** Insert many rows (fillable-only) */
  static async insertMany<TAttrs extends Record<string, any>>(
    this: typeof Model,
    rows: Partial<TAttrs>[]
  ) {
    if (!rows.length) return;

    const table = this.getTable();
    const fillable = this.getFillable();
    const pk = this.getPrimaryKey();

    const dataRows = rows.map((attrs) => {
      const data: Record<string, any> = {};

      if (fillable.length === 0) {
        Object.assign(data, attrs);
      } else {
        for (const key of fillable) {
          if (key in (attrs as any)) data[key] = (attrs as any)[key];
        }
      }

      if (data[pk] == null) delete data[pk];
      return data;
    });

    // IMPORTANT: your QueryBuilder.insert must accept array to do bulk insert
    return await DB.table(table).insert(dataRows).exec();
  }

  /**
   * Safe upsert (works without raw SQL).
   * For each row:
   *  - find existing by uniqueBy
   *  - if exists => update only "update" columns
   *  - else => insert
   */
  static async upsert<TAttrs extends Record<string, any>>(
    this: typeof Model,
    rows: Partial<TAttrs>[],
    opts: {
      uniqueBy: (keyof TAttrs | string)[];
      update?: (keyof TAttrs | string)[];
    }
  ) {
    if (!rows.length) return;

    const table = this.getTable();
    const fillable = this.getFillable();
    const uniqueBy = opts.uniqueBy.map(String);
    const updateCols = (opts.update?.map(String) ?? []).filter(Boolean);

    const pickFillable = (attrs: any) => {
      if (!fillable.length) return { ...attrs };
      const out: any = {};
      for (const k of fillable) {
        if (k in attrs) out[k] = attrs[k];
      }
      return out;
    };

    for (const raw of rows) {
      const data = pickFillable(raw);

      // Build WHERE clause for uniqueBy
      const whereParts: string[] = [];
      const bindings: any[] = [];

      for (const key of uniqueBy) {
        if (data[key] === undefined) {
          throw new Error(
            `${this.name}.upsert(): missing uniqueBy field "${key}" in row`
          );
        }
        whereParts.push(`\`${key}\` = ?`);
        bindings.push(data[key]);
      }

      const existing = await DB.table(table)
        .where(whereParts.join(" AND "), bindings)
        .first();

      if (!existing) {
        await DB.table(table).insert(data).exec();
        continue;
      }

      // Update only requested columns (or update all non-unique fields if update not provided)
      const updateData: any = {};
      const colsToUpdate =
        updateCols.length > 0
          ? updateCols
          : Object.keys(data).filter((k) => !uniqueBy.includes(k));

      for (const col of colsToUpdate) {
        if (col in data) updateData[col] = data[col];
      }

      if (Object.keys(updateData).length) {
        await DB.table(table)
          .where(whereParts.join(" AND "), bindings)
          .update(updateData)
          .exec();
      }
    }
  }

  /** Insert or update based on _exists flag */
  async save(): Promise<this> {
    const ctor = this.constructor as typeof Model;
    const pk = ctor.getPrimaryKey();
    const table = ctor.getTable();
    const fillable = ctor.getFillable();

    const data: Record<string, any> = {};

    for (const key of fillable) {
      if (key in (this as any)._attributes) {
        data[key] = (this as any)._attributes[key];
      }
    }

    if (!(this as any)._exists) {
      if (data[pk] == null) {
        delete data[pk];
      }

      await (ctor as any).fire("creating", this);

      const result = await DB.table(table).insert(data).exec();

      const insertId = (result as any).insertId;

      // only backfill if PK wasn't manually set
      if ((this as any)._attributes[pk] == null && insertId) {
        (this as any)._attributes[pk] = insertId;
      }

      (this as any)._exists = true;

      await (ctor as any).fire("created", this);
    } else {
      const id = (this as any)._attributes[pk];

      await (ctor as any).fire("updating", this);

      await DB.table(table).where(`\`${pk}\` = ?`, [id]).update(data).exec();

      await (ctor as any).fire("updated", this);
    }

    return this;
  }

  /** Hard delete (no soft delete) */
  async delete(): Promise<void> {
    const ctor = this.constructor as typeof Model;
    const pk = ctor.getPrimaryKey();
    const table = ctor.getTable();
    const id = (this._attributes as any)[pk];

    if (id == null) {
      throw new Error(`Cannot delete model without primary key "${pk}" set`);
    }

    await (ctor as any).fire("deleting", this);
    await DB.table(table).where(`\`${pk}\` = ?`, [id]).delete().exec();
    this._exists = false;
    await (ctor as any).fire("deleted", this);
  }

  /** Soft delete via QueryBuilder.softDelete() if softDeleteColumn is defined */
  async softDelete(): Promise<void> {
    const ctor = this.constructor as typeof Model;
    const softCol = ctor.getSoftDeleteColumn();
    if (!softCol) {
      // no soft-delete configured; fallback to hard delete
      return this.delete();
    }

    const pk = ctor.getPrimaryKey();
    const table = ctor.getTable();
    const id = (this._attributes as any)[pk];

    if (id == null) {
      throw new Error(
        `Cannot soft delete model without primary key "${pk}" set`
      );
    }

    await (ctor as any).fire("softDeleting", this);
    const now = new Date();
    (this._attributes as any)[softCol] = now;

    await DB.table(table)
      .where(`\`${pk}\` = ?`, [id])
      .softDelete(softCol, now)
      .exec();

    await (ctor as any).fire("softDeleted", this);
  }

  /** Restore soft-deleted model */
  async restore(): Promise<void> {
    const ctor = this.constructor as typeof Model;
    const softCol = ctor.getSoftDeleteColumn();
    if (!softCol) {
      // nothing to restore
      return;
    }

    const pk = ctor.getPrimaryKey();
    const table = ctor.getTable();
    const id = (this._attributes as any)[pk];

    if (id == null) {
      throw new Error(`Cannot restore model without primary key "${pk}" set`);
    }

    (this._attributes as any)[softCol] = null;

    await DB.table(table).where(`\`${pk}\` = ?`, [id]).restore(softCol).exec();
  }

  /** TRUNCATE table (fast, resets auto-increment) */
  static async truncate(this: typeof Model) {
    const table = this.getTable();

    try {
      await DB.query(`TRUNCATE TABLE \`${table}\``);
    } catch (e: any) {
      // MySQL FK restriction
      if (e?.code === "ER_TRUNCATE_ILLEGAL_FK") {
        // This WILL work even with FKs (unless ON DELETE RESTRICT with existing rows)
        await DB.query(`DELETE FROM \`${table}\``);
        // optional: reset auto increment
        await DB.query(`ALTER TABLE \`${table}\` AUTO_INCREMENT = 1`);
        return;
      }
      throw e;
    }
  }

  // ---------- Relations ----------

  /**
   * belongsTo(RelatedModel, foreignKeyOnThis, ownerKeyOnRelated="id")
   *
   * Example:
   *   // In Post model: post.belongsTo(User, "user_id")
   */
  belongsTo<TAttrs extends Record<string, any>, R extends Model<TAttrs>>(
    Related: ModelCtor<TAttrs, R>,
    foreignKeyOnThis: keyof T,
    ownerKeyOnRelated: keyof TAttrs = Related.getPrimaryKey() as keyof TAttrs
  ) {
    const rel = new RelationOne<R>(async () => {
      const fkValue = (this._attributes as any)[String(foreignKeyOnThis)];
      if (fkValue == null) return null;

      const row = await Related.query()
        .where(`\`${String(ownerKeyOnRelated)}\` = ?`, [fkValue])
        .first();

      return row ? (Related.hydrate(row) as R) : null;
    });

    return rel.asProxy();
  }

  /**
   * hasOne(RelatedModel, foreignKeyOnRelated, localKeyOnThis="id")
   *
   * Example:
   *   // In User model: user.hasOne(Profile, "user_id")
   */
  hasOne<TAttrs extends Record<string, any>, R extends Model<TAttrs>>(
    Related: ModelCtor<TAttrs, R>,
    foreignKeyOnRelated: keyof TAttrs,
    localKeyOnThis: keyof T = (
      this.constructor as typeof Model
    ).getPrimaryKey() as keyof T
  ) {
    const rel = new RelationOne<R>(async () => {
      const localValue = (this._attributes as any)[String(localKeyOnThis)];
      if (localValue == null) return null;

      const row = await Related.query()
        .where(`\`${String(foreignKeyOnRelated)}\` = ?`, [localValue])
        .first();

      return row ? (Related.hydrate(row) as R) : null;
    });

    return rel.asProxy();
  }

  /**
   * hasMany(RelatedModel, foreignKeyOnRelated, localKeyOnThis="id")
   *
   * Example:
   *   // In User model: user.hasMany(Post, "user_id")
   */
  hasMany<TAttrs extends Record<string, any>, R extends Model<TAttrs>>(
    Related: ModelCtor<TAttrs, R>,
    foreignKeyOnRelated: keyof TAttrs,
    localKeyOnThis: keyof T = (
      this.constructor as typeof Model
    ).getPrimaryKey() as keyof T
  ) {
    const rel = new RelationMany<R>(async () => {
      const localValue = (this._attributes as any)[String(localKeyOnThis)];
      if (localValue == null) return [];

      const rows = await Related.query()
        .where(`\`${String(foreignKeyOnRelated)}\` = ?`, [localValue])
        .get();

      return Related.hydrateMany(rows) as R[];
    });

    return rel.asProxy();
  }
}
