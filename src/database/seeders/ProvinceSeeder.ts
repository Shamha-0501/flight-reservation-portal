import { ModelSeeder, UpsertConfig } from "@/forge/database/seeder/modelSeeder";
import {
  fromArray,
  fromCsv,
  fromCsvDir,
} from "@/forge/database/seeder/dataSource";
import { Province, ProvinceAttr } from "@/src/http/models/Province";

type ProvinceInput = Omit<ProvinceAttr, "id">;

export class ProvinceSeeder extends ModelSeeder<ProvinceInput> {
  name = "ProvinceSeeder";
  model = Province;

  source = fromCsv("src/database/seeders/csv/provinces.csv");

  mapRow(row: any): ProvinceInput {
    return {
      name_en: row.name_en,
      name_si: row.name_si,
      name_ta: row.name_ta,
    };
  };

  upsert = {
    uniqueBy: ["name_en"],
    update: ["name_si", "name_ta"]
  };

  chunkSize = 500;
}