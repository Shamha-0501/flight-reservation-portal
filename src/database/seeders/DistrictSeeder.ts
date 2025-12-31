import { ModelSeeder } from "@/forge/database/seeder/modelSeeder";
import {
  fromArray,
  fromCsv,
  fromCsvDir,
} from "@/forge/database/seeder/dataSource";
import { District, DistrictAttr } from "@/src/http/models/District";

type DistrictInput = Omit<DistrictAttr, "id">;

export class DistrictSeeder extends ModelSeeder<DistrictInput> {
  name = "DistrictSeeder";
  model = District;

  source = fromCsv("src/database/seeders/csv/districts.csv");

  mapRow(row: any): DistrictInput {
    return {
      province_id: row.province_id,
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