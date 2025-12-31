import type { Seeder } from "@/forge/database/seeder/types";
import { RoleSeeder } from "./RoleSeeder";
import { CountryRegionSeeder } from "./CountryRegionSeeder";
import { CountrySubRegionSeeder } from "./CountrySubRegionSeeder";
import { CountrySeeder } from "./CountrySeeder";
import { CurrencySeeder } from "./CurrencySeeder";
import { ProvinceSeeder } from "./ProvinceSeeder";
import { DistrictSeeder } from "./DistrictSeeder";
import { CitySeeder } from "./CitySeeder";
import { ActionSeeder } from "./ActionSeeder";
import { UserSeeder } from "./UserSeeder";
import { UserRoleSeeder } from "./UserRoleSeeder";
import { ResourceSeeder } from "./ResourceSeeder";
import { PolicySeeder } from "./PolicySeeder";
import { PolicySubjectSeeder } from "./PolicySubjectSeeder";

export const SEEDERS: (new () => Seeder)[] = [
  RoleSeeder,
  CountryRegionSeeder,
  CountrySubRegionSeeder,
  CountrySeeder,
  CurrencySeeder,
  ProvinceSeeder,
  DistrictSeeder,
  CitySeeder,
  ActionSeeder,
  ResourceSeeder,
  UserSeeder,
  UserRoleSeeder,
  PolicySeeder,
  PolicySubjectSeeder,
];
