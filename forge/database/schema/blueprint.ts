import { DB } from "@/forge/database/facades/db";

type ColumnType =
  | "int"
  | "bigint"
  | "varchar"
  | "text"
  | "boolean"
  | "datetime"
  | "timestamp"
  | "float"
  | "double"
  | "decimal"
  | "json"
  | "uuid"
  | "char"
  | "date"
  | "time"
  | "enum";

interface ColumnDefinition {
  name: string;
  type: ColumnType;
  length?: number;
  precision?: number;
  scale?: number;
  unsigned?: boolean;
  nullable?: boolean;
  default?: any;
  primary?: boolean;
  unique?: boolean;
  autoIncrement?: boolean;
  enumValues?: string[];
}

type IndexType = "index" | "unique";

interface IndexDefinition {
  type: IndexType;
  columns: string[];
  name?: string;
}

interface ForeignKeyDefinition {
  column: string;
  references: string;
  on: string;
  onDelete?: "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION";
  onUpdate?: "CASCADE" | "RESTRICT" | "NO ACTION";
}

type BlueprintMode = "create" | "alter";

export class Blueprint {
  readonly table: string;
  private mode: BlueprintMode;

  private columns: ColumnDefinition[] = [];
  private indexes: IndexDefinition[] = [];
  private foreignKeys: ForeignKeyDefinition[] = [];

  private _engine = "InnoDB";
  private _charset = "utf8mb4";
  private _collation = "utf8mb4_unicode_ci";

  constructor(table: string, mode: BlueprintMode = "create") {
    this.table = table;
    this.mode = mode;
  }

  asAlter(): this {
    this.mode = "alter";
    return this;
  }

  engine(engine: string): this {
    this._engine = engine;
    return this;
  }

  charset(charset: string, collation?: string): this {
    this._charset = charset;
    if (collation) this._collation = collation;
    return this;
  }

  // -----------------------
  // Column definitions
  // -----------------------

  increments(name: string): this {
    this.columns.push({
      name,
      type: "int",
      unsigned: true,
      autoIncrement: true,
      primary: true,
    });
    return this;
  }

  bigIncrements(name: string): this {
    this.columns.push({
      name,
      type: "bigint",
      unsigned: true,
      autoIncrement: true,
      primary: true,
    });
    return this;
  }

  string(name: string, length = 255): this {
    this.columns.push({ name, type: "varchar", length });
    return this;
  }

  text(name: string): this {
    this.columns.push({ name, type: "text" });
    return this;
  }

  integer(name: string, unsigned = false): this {
    this.columns.push({ name, type: "int", unsigned });
    return this;
  }

  float(name: string): this {
    this.columns.push({ name, type: "float" });
    return this;
  }

  double(name: string, precision = 15, scale = 8): this {
    this.columns.push({
      name,
      type: "double",
      precision,
      scale,
    });
    return this;
  }

  decimal(name: string, precision = 10, scale = 2): this {
    this.columns.push({
      name,
      type: "decimal",
      precision,
      scale,
    });
    return this;
  }

  json(name: string): this {
    this.columns.push({ name, type: "json" });
    return this;
  }

  uuid(name: string): this {
    this.columns.push({ name, type: "uuid" });
    return this;
  }

  char(name: string, length = 36): this {
    this.columns.push({ name, type: "char", length });
    return this;
  }

  date(name: string): this {
    this.columns.push({ name, type: "date" });
    return this;
  }

  time(name: string): this {
    this.columns.push({ name, type: "time" });
    return this;
  }

  bigInteger(name: string, unsigned = false): this {
    this.columns.push({ name, type: "bigint", unsigned });
    return this;
  }

  boolean(name: string): this {
    this.columns.push({ name, type: "boolean" });
    return this;
  }

  enum(name: string, values: string[]): this {
    if (!values || values.length === 0) {
      throw new Error(`Enum column "${name}" must have at least one value`);
    }

    this.columns.push({
      name,
      type: "enum",
      enumValues: values,
    });

    return this;
  }

  datetime(name: string): this {
    this.columns.push({ name, type: "datetime" });
    return this;
  }

  timestamp(name: string): this {
    this.columns.push({ name, type: "timestamp" });
    return this;
  }

  timestamps(): this {
    this.datetime("created_at").nullable();
    this.datetime("updated_at").nullable();
    return this;
  }

  softDeletes(column = "deleted_at"): this {
    this.datetime(column).nullable();
    return this;
  }

  // -----------------------
  // Column modifiers
  // (apply to last column)
  // -----------------------

  nullable(): this {
    const last = this.columns[this.columns.length - 1];
    if (last) last.nullable = true;
    return this;
  }

  notNullable(): this {
    const last = this.columns[this.columns.length - 1];
    if (last) last.nullable = false;
    return this;
  }

  unsigned(): this {
    const last = this.columns[this.columns.length - 1];
    if (last) last.unsigned = true;
    return this;
  }

  default(value: any): this {
    const last = this.columns[this.columns.length - 1];
    if (last) last.default = value;
    return this;
  }

  unique(): this {
    const last = this.columns[this.columns.length - 1];
    if (last) last.unique = true;
    return this;
  }

  primary(): this {
    const last = this.columns[this.columns.length - 1];
    if (last) last.primary = true;
    return this;
  }

  // -----------------------
  // Indexes & foreign keys
  // -----------------------

  index(columns: string | string[], name?: string): this {
    this.indexes.push({
      type: "index",
      columns: Array.isArray(columns) ? columns : [columns],
      name,
    });
    return this;
  }

  uniqueIndex(columns: string | string[], name?: string): this {
    this.indexes.push({
      type: "unique",
      columns: Array.isArray(columns) ? columns : [columns],
      name,
    });
    return this;
  }

  foreign(column: string) {
    const fk: ForeignKeyDefinition = {
      column,
      references: "",
      on: "",
    };

    const api = {
      references: (ref: string) => {
        fk.references = ref;
        return api;
      },
      on: (table: string) => {
        fk.on = table;
        return api;
      },
      onDelete: (action: ForeignKeyDefinition["onDelete"]) => {
        fk.onDelete = action;
        return api;
      },
      onUpdate: (action: ForeignKeyDefinition["onUpdate"]) => {
        fk.onUpdate = action;
        return api;
      },
    };

    this.foreignKeys.push(fk);
    return api;
  }

  // -----------------------
  // Compile to SQL
  // -----------------------

  toSQL(): string[] {
    if (this.mode === "create") {
      return this.toCreateTableSQL();
    }
    return this.toAlterTableSQL();
  }

  private toCreateTableSQL(): string[] {
    const columnDefs = this.columns.map((col) => this.columnToSql(col));

    const fkDefs = this.foreignKeys.map((fk) => {
      let line = `FOREIGN KEY (\`${fk.column}\`) REFERENCES \`${fk.on}\`(\`${fk.references}\`)`;
      if (fk.onDelete) line += ` ON DELETE ${fk.onDelete}`;
      if (fk.onUpdate) line += ` ON UPDATE ${fk.onUpdate}`;
      return line;
    });

    const indexDefs = this.indexes.map((idx) => {
      const cols = idx.columns.map((c) => `\`${c}\``).join(", ");
      const name =
        idx.name ?? `${this.table}_${idx.columns.join("_")}_${idx.type}`;
      if (idx.type === "unique") {
        return `UNIQUE KEY \`${name}\` (${cols})`;
      }
      return `KEY \`${name}\` (${cols})`;
    });

    const allDefs = [...columnDefs, ...fkDefs, ...indexDefs].join(",\n  ");

    const sql = `
CREATE TABLE \`${this.table}\` (
  ${allDefs}
) ENGINE=${this._engine} DEFAULT CHARSET=${this._charset} COLLATE=${this._collation};
    `.trim();

    return [sql];
  }

  private toAlterTableSQL(): string[] {
    const statements: string[] = [];

    // Simple version: only ADD COLUMN + ADD INDEX + ADD FK
    if (this.columns.length > 0) {
      const adds = this.columns
        .map((col) => `ADD COLUMN ${this.columnToSql(col)}`)
        .join(", ");
      statements.push(`ALTER TABLE \`${this.table}\` ${adds};`);
    }

    if (this.indexes.length > 0) {
      for (const idx of this.indexes) {
        const cols = idx.columns.map((c) => `\`${c}\``).join(", ");
        const name =
          idx.name ?? `${this.table}_${idx.columns.join("_")}_${idx.type}`;
        if (idx.type === "unique") {
          statements.push(
            `ALTER TABLE \`${this.table}\` ADD UNIQUE KEY \`${name}\` (${cols});`
          );
        } else {
          statements.push(
            `ALTER TABLE \`${this.table}\` ADD KEY \`${name}\` (${cols});`
          );
        }
      }
    }

    if (this.foreignKeys.length > 0) {
      for (const fk of this.foreignKeys) {
        let line = `ALTER TABLE \`${this.table}\` ADD CONSTRAINT \`${this.table}_${fk.column}_foreign\` FOREIGN KEY (\`${fk.column}\`) REFERENCES \`${fk.on}\`(\`${fk.references}\`)`;
        if (fk.onDelete) line += ` ON DELETE ${fk.onDelete}`;
        if (fk.onUpdate) line += ` ON UPDATE ${fk.onUpdate}`;
        line += ";";
        statements.push(line);
      }
    }

    return statements;
  }

  private columnToSql(col: ColumnDefinition): string {
    let line = `\`${col.name}\` ${this.columnTypeSql(col)}`;

    if (col.unsigned) line += " UNSIGNED";
    if (col.autoIncrement) line += " AUTO_INCREMENT";

    if (col.nullable) line += " NULL";
    else line += " NOT NULL";

    if (col.default !== undefined) {
      if (col.default === null) line += " DEFAULT NULL";
      else if (typeof col.default === "string")
        line += ` DEFAULT '${col.default}'`;
      else line += ` DEFAULT ${col.default}`;
    }

    if (col.unique) line += " UNIQUE";
    if (col.primary) line += " PRIMARY KEY";

    return line;
  }

  private columnTypeSql(col: ColumnDefinition): string {
    switch (col.type) {
      case "varchar":
        return `VARCHAR(${col.length ?? 255})`;

      case "char":
        return `CHAR(${col.length ?? 36})`;

      case "int":
        return "INT";

      case "bigint":
        return "BIGINT";

      case "text":
        return "TEXT";

      case "boolean":
        return "TINYINT(1)";

      case "enum":
        if (!col.enumValues || col.enumValues.length === 0) {
          throw new Error(`Enum "${col.name}" has no values`);
        }
        const vals = col.enumValues.map((v) => `'${v}'`).join(", ");
        return `ENUM(${vals})`;

      case "datetime":
        return "DATETIME";

      case "timestamp":
        return "TIMESTAMP";

      case "float":
        return "FLOAT";

      case "double":
        return `DOUBLE(${col.precision ?? 15}, ${col.scale ?? 8})`;

      case "decimal":
        return `DECIMAL(${col.precision ?? 10}, ${col.scale ?? 2})`;

      case "json":
        return "JSON";

      case "uuid":
        return "CHAR(36)";

      case "date":
        return "DATE";

      case "time":
        return "TIME";

      default:
        throw new Error(`Unknown column type: ${col.type}`);
    }
  }

  // -----------------------
  // Execute directly (optional)
  // -----------------------

  async build(): Promise<void> {
    const statements = this.toSQL();
    for (const sql of statements) {
      await DB.query(sql);
    }
  }
}
