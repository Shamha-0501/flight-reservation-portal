import { ModelSeeder, UpsertConfig } from "@/forge/database/seeder/modelSeeder";
import {
  fromArray,
  fromCsv,
  fromCsvDir,
} from "@/forge/database/seeder/dataSource";
import {
  CountrySubRegion,
  CountrySubRegionAttr,
} from "@/src/http/models/CountrySubRegion";

// type CountrySubRegionInput = Omit<CountrySubRegionAttr, "id">;
type CountrySubRegionInput = CountrySubRegionAttr;

export class CountrySubRegionSeeder extends ModelSeeder<CountrySubRegionInput> {
  name = "CountrySubRegionSeeder";
  model = CountrySubRegion;

  source = fromCsv("src/database/seeders/csv/country_sub_regions.csv");

  mapRow(row: any): CountrySubRegionInput {
    return {
      id: row.id,
      region_id: row.region_id,
      sub_region_name: row.sub_region_name,
    };
  }

  upsert = {
    uniqueBy: ["sub_region_name"],
    update: ["sub_region_name"],
  };

  chunkSize = 500;
}
