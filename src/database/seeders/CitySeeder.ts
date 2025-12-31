import { ModelSeeder } from "@/forge/database/seeder/modelSeeder";
import {
  fromArray,
  fromCsv,
  fromCsvDir,
} from "@/forge/database/seeder/dataSource";
import { City, CityAttr } from "@/src/http/models/City";

type CityInput = Omit<CityAttr, "id">;

export class CitySeeder extends ModelSeeder<CityInput> {
  name = "CitySeeder";
  model = City;

  source = fromCsv("src/database/seeders/csv/cities.csv");

  mapRow(row: any): CityInput {
    return {
      name: row.name,
      district_id: row.district_id,
      sub_name: row.sub_name,
      postal_code: row.postal_code,
      longitude: row.longitude,
      latitude: row.latitude
    };
  };

  upsert = {
    uniqueBy: ["name"],
    update: ["district_id", "sub_name", "postal_code", "longitude", "latitude"]
  };

  chunkSize = 500;
}