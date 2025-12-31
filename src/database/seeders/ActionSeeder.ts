import { ModelSeeder } from "@/forge/database/seeder/modelSeeder";
import {
    fromArray,
    fromCsv,
    fromCsvDir
} from "@/forge/database/seeder/dataSource";
import { Action, ActionAttr } from "@/src/http/models/Action";

type ActionInput = Omit<ActionAttr, "id">;

export class ActionSeeder extends ModelSeeder<ActionInput> {
    name = 'ActionSeeder';
    model = Action;

    source = fromArray<ActionInput>([
        {key: '*'},
        {key: 'create'},
        {key: 'view'},
        {key: 'update'},
        {key: 'softDelete'},
        {key: 'forceDelete'},
        {key: 'restore'},
        {key: 'import'},
        {key: 'export'},
        {key: 'backup'}
    ]);

    mapRow(row: any): ActionInput {
        return {
            key: row.key
        };
    };

    upsert = {
        uniqueBy: ['key'],
        update: ['key']
    };

    chunkSize = 500;
}