import { ModelSeeder, UpsertConfig } from "@/forge/database/seeder/modelSeeder";
import {
  fromArray,
  fromCsv,
  fromCsvDir,
  SeederSource,
} from "@/forge/database/seeder/dataSource";
import { Currency, CurrencyAttr } from "@/src/http/models/Currency";

export class CurrencySeeder extends ModelSeeder<CurrencyAttr> {
    name = "CurrencySeeder";
    model = Currency;

    source = fromCsv("src/database/seeders/csv/currencies.csv");

    mapRow(row: any): CurrencyAttr {
        return {
            id: row.id,
            code: row.code,
            name: row.name
        };
    }

    upsert = {
        uniqueBy: ["code"],
        update: ["name"]
    };

    chunkSize = 500;
}