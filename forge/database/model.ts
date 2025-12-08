import { PaginatedResult, QueryBuilder } from "@/forge/database/builder";
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
  protected _collection: ModelCollection<this> | null = null;
  protected _index: number | null = null;

  constructor(attrs: Partial<T> = {}) {
    this.defineFillableAccessors();
    this.fill(attrs);
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
    return this.attributes;
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

  // ---------- Relations ----------

  /**
   * belongsTo(RelatedModel, foreignKeyOnThis, ownerKeyOnRelated="id")
   *
   * Example:
   *   // In Post model: post.belongsTo(User, "user_id")
   */
  async belongsTo<TAttrs extends Record<string, any>, R extends Model<TAttrs>>(
    Related: { new (attrs: Partial<TAttrs>): R } & typeof Model,
    foreignKey: keyof T,
    ownerKey: keyof TAttrs = Related.getPrimaryKey() as keyof TAttrs
  ): Promise<R | null> {
    const fkValue = (this._attributes as any)[foreignKey as string];
    if (fkValue == null) return null;

    const row = await Related.query<TAttrs>()
      .where(`\`${String(ownerKey)}\` = ?`, [fkValue])
      .first();

    return row ? (Related.hydrate(row) as R) : null;
  }

  /**
   * hasOne(RelatedModel, foreignKeyOnRelated, localKeyOnThis="id")
   *
   * Example:
   *   // In User model: user.hasOne(Profile, "user_id")
   */
  async hasOne<TAttrs extends Record<string, any>, R extends Model<TAttrs>>(
    Related: { new (attrs: Partial<TAttrs>): R } & typeof Model,
    foreignKey: keyof TAttrs,
    localKey: keyof T = (
      this.constructor as typeof Model
    ).getPrimaryKey() as keyof T
  ): Promise<R | null> {
    const localValue = (this._attributes as any)[localKey as string];
    if (localValue == null) return null;

    const row = await Related.query<TAttrs>()
      .where(`\`${String(foreignKey)}\` = ?`, [localValue])
      .first();

    return row ? (Related.hydrate(row) as R) : null;
  }

  /**
   * hasMany(RelatedModel, foreignKeyOnRelated, localKeyOnThis="id")
   *
   * Example:
   *   // In User model: user.hasMany(Post, "user_id")
   */
  async hasMany<TAttrs extends Record<string, any>, R extends Model<TAttrs>>(
    Related: { new (attrs: Partial<TAttrs>): R } & typeof Model,
    foreignKey: keyof TAttrs,
    localKey: keyof T = (
      this.constructor as typeof Model
    ).getPrimaryKey() as keyof T
  ): Promise<R[]> {
    const localValue = (this._attributes as any)[localKey as string];
    if (localValue == null) return [];

    const rows = await Related.query<TAttrs>()
      .where(`\`${String(foreignKey)}\` = ?`, [localValue])
      .get();

    return Related.hydrateMany(rows) as R[];
  }
}
