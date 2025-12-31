import { Model } from "@/forge/database/model";

export interface CountrySubRegionAttr {
    id: number;
    region_id: number;
    sub_region_name: string;
};

export class CountrySubRegion extends Model<CountrySubRegionAttr> implements CountrySubRegionAttr {
    declare id: number;
    declare region_id: number;
    declare sub_region_name: string;
    
    protected static table = 'country_sub_regions';
    protected static fillable = [
        'id',
        'region_id',
        'sub_region_name'
    ];
}