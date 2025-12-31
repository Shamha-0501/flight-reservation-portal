import mysql, {
  Pool,
  PoolOptions,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import { config as loadEnv } from 'dotenv';

if (process.env.NODE_ENV === 'test') {
    loadEnv({ path: '.env.test', quiet: true });
} else {
    loadEnv({ quiet: true });
}

const config: PoolOptions = {
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

declare global {
    var _mysqlPool: Pool | undefined;
}

const pool: Pool = global._mysqlPool ?? mysql.createPool(config);

if (process.env.NODE_ENV === 'production') {
    global._mysqlPool = pool;
}

// Common param type
export type QueryValues = any[] | Record<string, any> | undefined;

// -------- DDL CLIENT ---------
export const ddl = {
    /**
     * Execute DDL: CREATE TABLE, ALTER TABLE, DROP, TRUNCATE, etc
     * @param sql table related queries
     * @param values 
     * @returns 
     */
    async exec(sql: string, values?: QueryValues) {
        const [ result ] = await pool.query<ResultSetHeader>(sql, values);
        return result;
    }
};

// -------- DML CLIENT ---------
export const dml = {
    /**
     * SELECT queries -> return rows
     * @param sql 
     * @param values 
     * @returns 
     */
    async select<T extends RowDataPacket[] = RowDataPacket[]>(sql: string, values?: QueryValues) {
        const [ rows ] = await pool.query<T>(sql, values);
        return rows;
    },

    /**
     * INSERT queries – returns insertId, affectedRows, etc.
     * @param sql 
     * @param values 
     * @returns 
     */
    async insert(sql: string, values?: QueryValues) {
        const [ result ] = await pool.query<ResultSetHeader>(sql, values);
        return result;
    },

    /**
     * UPDATE queries – returns affectedRows, changedRows, etc.
     * @param sql 
     * @param values 
     * @returns 
     */
    async update(sql: string, values?: QueryValues) {
        const [ result ] = await pool.query<ResultSetHeader>(sql, values);
        return result;
    },

    /**
     * DELETE queries – returns affectedRows.
     * @param sql 
     * @param values 
     * @returns returns affectedRows
     */
    async remove(sql: string, values?: QueryValues) {
        const [ result ] = await pool.query<ResultSetHeader>(sql, values);
        return result;
    }
};

// -------- RAW CLIENT ---------
export const raw = {
    /**
     * Fully raw query helper – you control SQL completely.
     * Use `?` placeholders + values to avoid SQL injection.
     * @param sql 
     * @param values 
     * @returns 
     */
    async query<T = any>(sql: string, values?: QueryValues): Promise<T[]> {
        const [ rows ] = await pool.query(sql, values);
        return rows as T[];
    },

    async statement(sql: string, values?: QueryValues) {
       await raw.query(sql, values);
    },

    /**
     * If you want raw access to the pool for advanced stuff.
     * @returns pool
     */
    getPool() {
        return pool;
    }
};

// ---------- Raw SQL fragment helper ----------
export class RawSQL {
  sql: string;
  bindings?: QueryValues;

  constructor(sql: string, bindings?: QueryValues) {
    this.sql = sql;
    this.bindings = bindings;
  }
}

export function isRaw(value: unknown): value is RawSQL {
  return value instanceof RawSQL;
}