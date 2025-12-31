import type { Seeder } from "./types";
import type { SeederSource } from "./dataSource";
import { resolveSource, forEachChunk } from "./dataSource";

export type UpsertConfig = {
    uniqueBy: string[];
    update?: string[];
};

export abstract class ModelSeeder<T> implements Seeder {
    abstract name: string;

    // Forge model class (Role, Permissions, City, etc.)
    abstract model: any;

    // Where data comes from (array, csv, or directory)
    abstract source: SeederSource<T>;

    // Convert CSV row -> T (and can also normalize array rows if you want)
    abstract mapRow(row: any): T;

    // For idempotency
    abstract upsert: UpsertConfig;

    // Performance knobs
    chunkSize = 1000;

    async run() {
        const iterable = resolveSource<T>(this.source, this.mapRow.bind(this));

        await forEachChunk(iterable, this.chunkSize, async (rows) => {
            await this.model.upsert(rows, this.upsert);
        });
    }
}