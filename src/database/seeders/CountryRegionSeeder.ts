import { ModelSeeder } from "@/forge/database/seeder/modelSeeder";
import {
  fromArray,
  fromCsv,
  fromCsvDir,
} from "@/forge/database/seeder/dataSource";
import {
  CountryRegion,
  CountryRegionAttr,
} from "@/src/http/models/CountryRegion";

type CountryRegionSeedInput = Omit<CountryRegionAttr, "id">;

export class CountryRegionSeeder extends ModelSeeder<CountryRegionSeedInput> {
  name = "CountryRegionSeeder";
  model = CountryRegion;

  source = fromCsv("src/database/seeders/csv/country_regions.csv");

  mapRow(row: any): CountryRegionSeedInput {
    return {
      region_name: row.region_name,
    };
  }

  upsert = {
    uniqueBy: ["region_name"],
    update: ["region_name"],
  };

  chunkSize = 500;
}
