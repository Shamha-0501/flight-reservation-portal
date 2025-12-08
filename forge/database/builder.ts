import type { ResultSetHeader } from "mysql2";
import { dml, raw, RawSQL, isRaw, QueryValues } from "@/forge/pool/mysql";

type BuilderType = "select" | "insert" | "update" | "delete";

type WhereNode =
  | {
      kind: "basic";
      bool: "AND" | "OR";
      condition: string | RawSQL;
      bindings?: QueryValues;
    }
  | {
      kind: "group";
      bool: "AND" | "OR";
      children: WhereNode[];
    };

type WhereCallback = (q: {
  where: (cond: string | RawSQL, bindings?: QueryValues) => void;
  orWhere: (cond: string | RawSQL, bindings?: QueryValues) => void;
}) => void;

/**
 * Standard pagination result for queries.
 */
export interface PaginatedResult<T> {
  data: T[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Trashed mode for soft deletes.
 * - "with": no implicit filter
 * - "without": deleted_at IS NULL
 * - "only": deleted_at IS NOT NULL
 */
type TrashedMode = "with" | "without" | "only";

export class QueryBuilder<T = any> {
  private _type: BuilderType = "select";
  private _table!: string | RawSQL;
  private _columns: (string | RawSQL)[] = ["*"];

  private _wheres: WhereNode[] = [];
  private _orderBy: { column: string | RawSQL; direction: "ASC" | "DESC" }[] =
    [];

  private _limit?: number;
  private _offset?: number;

  private _insertData?: Record<string, any> | Record<string, any>[];
  private _updateData?: Record<string, any>;

  // soft delete state
  private _trashedMode: TrashedMode = "with";
  private _softDeleteColumn = "deleted_at";

  constructor(table: string | RawSQL) {
    this._table = table;
  }

  /**
   * Clone builder (helps with reuse if needed)
   */
  clone(): QueryBuilder<T> {
    const queryBuilder = new QueryBuilder<T>(this._table);

    queryBuilder._type = this._type;
    queryBuilder._columns = this._columns;
    queryBuilder._wheres = this._wheres;
    queryBuilder._orderBy = this._orderBy;
    queryBuilder._limit = this._limit;
    queryBuilder._offset = this._offset;
    queryBuilder._insertData = this._insertData
      ? Array.isArray(this._insertData)
        ? [...this._insertData]
        : { ...this._insertData }
      : undefined;
    queryBuilder._updateData = this._updateData
      ? { ...this._updateData }
      : undefined;
    queryBuilder._trashedMode = this._trashedMode;
    queryBuilder._softDeleteColumn = this._softDeleteColumn;

    return queryBuilder;
  }

  /**
   * Core type setters
   */
  select(...columns: (string | RawSQL)[]): this {
    this._type = "select";
    if (columns.length > 0) {
      this._columns = columns;
    }
    return this;
  }

  insert(data: Record<string, any> | Record<string, any>[]): this {
    this._type = "insert";
    this._insertData = data;
    return this;
  }

  update(data: Record<string, any>): this {
    this._type = "update";
    this._updateData = data;
    return this;
  }

  delete(): this {
    this._type = "delete";
    return this;
  }

  // ---------- Soft delete helpers ----------

  /**
   * Soft delete: turn this query into an UPDATE that sets deleted_at (or custom column).
   */
  softDelete(column = this._softDeleteColumn, value: any = new Date()): this {
    this._softDeleteColumn = column;
    this._type = "update";
    this._updateData = {
      ...(this._updateData ?? {}),
      [column]: value,
    };
    return this;
  }

  /**
   * Restore soft-deleted rows: set deleted_at (or custom column) to NULL.
   */
  restore(column = this._softDeleteColumn): this {
    this._softDeleteColumn = column;
    this._type = "update";
    this._updateData = {
      ...(this._updateData ?? {}),
      [column]: null,
    };
    return this;
  }

  /**
   * Include soft-deleted + non-deleted (no implicit filter).
   */
  withTrashed(column = this._softDeleteColumn): this {
    this._softDeleteColumn = column;
    this._trashedMode = "with";
    return this;
  }

  /**
   * Only non-deleted rows (deleted_at IS NULL).
   */
  withoutTrashed(column = this._softDeleteColumn): this {
    this._softDeleteColumn = column;
    this._trashedMode = "without";
    return this;
  }

  /**
   * Only soft-deleted rows (deleted_at IS NOT NULL).
   */
  onlyTrashed(column = this._softDeleteColumn): this {
    this._softDeleteColumn = column;
    this._trashedMode = "only";
    return this;
  }

  /**
   * Explicit filter helpers, if you want to add them manually.
   */
  whereNotDeleted(column = this._softDeleteColumn): this {
    return this.where(`\`${column}\` IS NULL`);
  }

  whereDeleted(column = this._softDeleteColumn): this {
    return this.where(`\`${column}\` IS NOT NULL`);
  }

  /**
   * Where / orWhere with nested callback
   */
  where(
    conditionOrCallback: string | RawSQL | WhereCallback,
    bindings?: QueryValues
  ): this {
    if (typeof conditionOrCallback === "function") {
      const children: WhereNode[] = [];

      const nested = {
        where: (cond: string | RawSQL, b?: QueryValues) => {
          children.push({
            kind: "basic",
            bool: "AND",
            condition: cond,
            bindings: b,
          });
          return nested;
        },
        orWhere: (cond: string | RawSQL, b?: QueryValues) => {
          children.push({
            kind: "basic",
            bool: "OR",
            condition: cond,
            bindings: b,
          });
          return nested;
        },
      };

      conditionOrCallback(nested);

      if (children.length > 0) {
        this._wheres.push({
          kind: "group",
          bool: "AND",
          children,
        });
      }

      return this;
    }

    // Normal wheres
    this._wheres.push({
      kind: "basic",
      bool: "AND",
      condition: conditionOrCallback,
      bindings,
    });

    return this;
  }

  /**
   * ---------- when(value, callback) ----------
   * Conditionally apply query modifications.
   * - value: anything that is NOT undefined/null/false will trigger callback
   * - callback: (qb, value) => void
   * - otherwise (optional): (qb, value) => void
   */
  when<V>(
    value: V,
    callback: (qb: this, value: V) => any,
    otherwise?: (qb: this, value: V) => any
  ): this {
    const hasValue = value !== undefined && value !== null && value !== false;

    if (hasValue) {
      callback(this, value);
    } else if (otherwise) {
      otherwise(this, value);
    }

    return this;
  }

  // ---------- Order / Limit / Offset ----------
  orderBy(column: string | RawSQL, direction: "ASC" | "DESC" = "ASC"): this {
    this._orderBy.push({ column, direction });
    return this;
  }

  limit(limit: number): this {
    this._limit = limit;
    return this;
  }

  offset(offset: number): this {
    this._offset = offset;
    return this;
  }

  // ------------ SQL builder ------------
  toSQL(): { sql: string; values: any[] } {
    switch (this._type) {
      case "select":
        return this.buildSelect();
      case "insert":
        return this.buildInsert();
      case "update":
        return this.buildUpdate();
      case "delete":
        return this.buildDelete();
      default:
        throw new Error(`Unsupported query type: ${this._type}`);
    }
  }

  private buildTableFragment(): { sql: string; values: any[] } {
    if (isRaw(this._table)) {
      return {
        sql: this._table.sql,
        values: this.collectBindings(this._table.bindings),
      };
    }
    return { sql: `\`${this._table}\``, values: [] };
  }

  private buildSelect(): { sql: string; values: any[] } {
    const values: any[] = [];
    const tableFragment = this.buildTableFragment();
    values.push(...tableFragment.values);

    const columnsSql = this._columns
      .map((col) => {
        if (isRaw(col)) {
          values.push(...this.collectBindings(col.bindings));
          return col.sql;
        }

        if (col === "*") {
          return "*";
        }

        return `\`${col}\``;
      })
      .join(", ");

    let sql = `SELECT ${columnsSql} FROM ${tableFragment.sql}`;

    const whereFragment = this.buildWhere();
    if (whereFragment.sql) {
      sql += whereFragment.sql;
      values.push(...whereFragment.values);
    }

    if (this._orderBy.length > 0) {
      const orderSql = this._orderBy
        .map((o) => {
          if (isRaw(o.column)) {
            values.push(...this.collectBindings(o.column.bindings));
            return `${o.column.sql} ${o.direction}`;
          }
          return `${o.column} ${o.direction}`;
        })
        .join(", ");

      sql += ` ORDER BY ${orderSql}`;
    }

    if (typeof this._limit === "number") {
      sql += ` LIMIT ${this._limit}`;
    }

    if (typeof this._offset === "number") {
      sql += ` OFFSET ${this._offset}`;
    }

    return { sql, values };
  }

  private buildInsert(): { sql: string; values: any[] } {
    if (!this._insertData) {
      throw new Error("No insert data provided.");
    }

    const tableFragment = this.buildTableFragment();
    const values: any[] = [...tableFragment.values];

    const rows = Array.isArray(this._insertData)
      ? this._insertData
      : [this._insertData];

    if (rows.length === 0) {
      throw new Error("Insert data connot be empty.");
    }

    const columns = Object.keys(rows[0]);
    const columnsSql = columns.map((col) => `\`${col}\``).join(", ");

    const placeholders = rows
      .map((row) => {
        const rowValues = columns.map((col) => row[col]);
        values.push(...rowValues);
        return `(${columns.map(() => "?").join(", ")})`;
      })
      .join(", ");

    const sql = `INSERT INTO ${tableFragment.sql} (${columnsSql}) VALUES ${placeholders}`;
    return { sql, values };
  }

  private buildUpdate(): { sql: string; values: any[] } {
    if (!this._updateData) {
      throw new Error("No update data provided.");
    }

    const tableFragment = this.buildTableFragment();
    const values: any[] = [...tableFragment.values];

    const setClauses: string[] = [];
    for (const [key, value] of Object.entries(this._updateData)) {
      setClauses.push(`\`${key}\` = ?`);
      values.push(value);
    }

    let sql = `UPDATE ${tableFragment.sql} SET ${setClauses.join(", ")}`;

    const whereFragment = this.buildWhere();
    if (whereFragment.sql) {
      sql += whereFragment.sql;
      values.push(...whereFragment.values);
    }

    if (typeof this._limit === "number") {
      sql += ` LIMIT ${this._limit}`;
    }

    return { sql, values };
  }

  private buildDelete(): { sql: string; values: any[] } {
    const tableFragment = this.buildTableFragment();
    const values: any[] = [...tableFragment.values];

    let sql = `DELETE FROM ${tableFragment.sql}`;

    const whereFragment = this.buildWhere();
    if (whereFragment.sql) {
      sql += whereFragment.sql;
      values.push(...whereFragment.values);
    }

    if (typeof this._limit === "number") {
      sql += ` LIMIT ${this._limit}`;
    }

    return { sql, values };
  }

  private buildWhere(): { sql: string; values: any[] } {
    const nodes: WhereNode[] = [...this._wheres];

    // apply soft-delete implicit filters based on trashed mode
    if (this._trashedMode === "without") {
      nodes.push({
        kind: "basic",
        bool: "AND",
        condition: `\`${this._softDeleteColumn}\` IS NULL`,
      });
    } else if (this._trashedMode === "only") {
      nodes.push({
        kind: "basic",
        bool: "AND",
        condition: `\`${this._softDeleteColumn}\` IS NOT NULL`,
      });
    }

    if (nodes.length === 0) return { sql: "", values: [] };

    const { sql, values } = this.buildWhereExpression(nodes);
    return { sql: ` WHERE ${sql}`, values };
  }

  private buildWhereExpression(nodes: WhereNode[]): {
    sql: string;
    values: any[];
  } {
    const values: any[] = [];
    const parts: string[] = [];

    nodes.forEach((node, index) => {
      const prefix = index === 0 ? "" : ` ${node.bool} `;

      if (node.kind === "basic") {
        if (isRaw(node.condition)) {
          parts.push(prefix + node.condition.sql);
          if (node.condition.bindings) {
            values.push(...this.collectBindings(node.condition.bindings));
          }
        } else {
          parts.push(prefix + node.condition);
          if (node.bindings) {
            values.push(...this.collectBindings(node.bindings));
          }
        }
      } else {
        const inner = this.buildWhereExpression(node.children);
        if (!inner.sql) return;
        parts.push(prefix + `( ${inner.sql} )`);
        values.push(...inner.values);
      }
    });

    return { sql: parts.join(""), values };
  }

  private collectBindings(bindings?: QueryValues): any[] {
    if (!bindings) return [];
    if (Array.isArray(bindings)) return bindings;
    return Object.values(bindings);
  }

  // ---------- Execution helpers ----------
  async get(): Promise<T[]> {
    const { sql, values } = this.toSQL();

    if (this._type === "select") {
      const rows = await dml.select<any[]>(sql, values);
      return rows as T[];
    }

    const rows = await raw.query<T>(sql, values);
    return rows as T[];
  }

  async first(): Promise<T | null> {
    this.limit(1);
    const rows = await this.get();
    return rows[0] ?? null;
  }

  async exec(): Promise<ResultSetHeader> {
    const { sql, values } = this.toSQL();

    switch (this._type) {
      case "insert":
        return dml.insert(sql, values);
      case "update":
        return dml.update(sql, values);
      case "delete":
        return dml.remove(sql, values);
      default:
        throw new Error(
          `exec() only for insert / update / delete (got ${this._type}).`
        );
    }
  }

  // ---------- Pagination ----------
  /**
   * Paginate using LIMIT/OFFSET + COUNT(*).
   *
   * Example:
   *   const page = await User.query<User>()
   *     .where("age > ?", [18])
   *     .orderBy("id", "DESC")
   *     .paginate(2, 10);
   */
  async paginate(page = 1, perPage = 10): Promise<PaginatedResult<T>> {
    if (perPage <= 0) {
      throw new Error("perPage must be greater than 0");
    }

    const countQuery = this.clone() as QueryBuilder<any>;
    countQuery._type = "select";
    countQuery._columns = [new RawSQL("COUNT(*) AS total")];
    countQuery._orderBy = [];
    countQuery._limit = undefined;
    countQuery._offset = undefined;

    const { sql: countSql, values: countValues } = countQuery.toSQL();
    const countRows = await dml.select<any[]>(countSql, countValues);
    const total: number = countRows[0]?.total ?? 0;

    if (total === 0) {
      return {
        data: [],
        page: 1,
        perPage: perPage,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      };
    }

    const totalPages = Math.ceil(total / perPage);
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const offset = (safePage - 1) * perPage;

    const dataQuery = this.clone();
    dataQuery._type = "select";
    dataQuery.limit(perPage).offset(offset);

    const data = await dataQuery.get();

    return {
      data: data,
      page: safePage,
      perPage: perPage,
      total: total,
      totalPages: totalPages,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1,
    };
  }
}
