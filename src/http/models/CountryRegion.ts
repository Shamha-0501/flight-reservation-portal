import { Model } from "@/forge/database/model";

export interface CountryRegionAttr {
    id: number;
    region_name: string;
};

export class CountryRegion extends Model<CountryRegionAttr> implements CountryRegionAttr {
    declare id: number;
    declare region_name: string;

    protected static table = 'country_regions';
    protected static fillable = ['region_name'];
}