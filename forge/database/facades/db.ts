import { QueryValues, raw, RawSQL } from "@/forge/pool/mysql";
import { QueryBuilder } from "@/forge/database/builder";

export class DB {
    /**
     * Expose low-level raw pool if needed
     */
    static pool() {
        return raw.getPool();
    }

    /**
     * Build a RawSQL fragment that can be used everywhere in builders.
     */
    static raw(sql: string, bindings?: QueryValues) {
        return new RawSQL(sql, bindings);
    }

    /**
     * Create a new query builder bound to a table.
     */
    static table<T = any>(table: string | RawSQL) {
        return new QueryBuilder<T>(table);
    }

    /**
     * Shortcut for raw query (no builder).
     */
    static async query<T = any>(sql: string, values?: QueryValues): Promise<T[]> {
        return raw.query<T>(sql, values);
    }

    /**
     * "Prepare" helper: mostly sugar. You can keep function + reuse values.
     */
    static prepare<T = any>(sql: string) {
        return async (values?: QueryValues): Promise<T[]> => {
            return raw.query<T>(sql, values);
        }
    }
}