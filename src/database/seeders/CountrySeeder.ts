import { ModelSeeder, UpsertConfig } from "@/forge/database/seeder/modelSeeder";
import {
  fromArray,
  fromCsv,
  fromCsvDir,
} from "@/forge/database/seeder/dataSource";
import { Country, CountryAttr } from "@/src/http/models/Country";

type CountryInput = Omit<CountryAttr, "id">;

export class CountrySeeder extends ModelSeeder<CountryInput> {
  name = "CountrySeeder";
  model = Country;

  source = fromCsv("src/database/seeders/csv/countries.csv");

  mapRow(row: any): CountryInput {
    return {
      name: row.name,
      alpha_2_code: row.alpha_2_code,
      alpha_3_code: row.alpha_3_code,
      capital: row.capital,
      sub_region_id: row.sub_region_id,
      longitude: row.longitude,
      latitude: row.latitude,
      demonym: row.demonym,
      flag: row.flag,
    };
  }

  upsert = {
    uniqueBy: ["name"],
    update: [
      "alpha_2_code",
      "alph_3_code",
      "capital",
      "longitude",
      "latitude",
      "demonym",
      "flag",
    ],
  };
}
