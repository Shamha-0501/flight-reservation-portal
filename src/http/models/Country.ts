import { Model } from "@/forge/database/model";

export interface CountryAttr {
    id: number;
    name: string;
    alpha_2_code: string;
    alpha_3_code: string;
    capital: string;
    sub_region_id: string;
    longitude: number;
    latitude: number;
    demonym: string;
    flag: string;
};

export class Country extends Model<CountryAttr> implements CountryAttr {
    declare id: number;
    declare name: string;
    declare alpha_2_code: string;
    declare alpha_3_code: string;
    declare capital: string;
    declare sub_region_id: string;
    declare longitude: number;
    declare latitude: number;
    declare demonym: string;
    declare flag: string;

    protected static table = 'countries';
    protected static fillable = [
        'name',
        'alpha_2_code',
        'alpha_3_code',
        'capital',
        'sub_region_id',
        'longitude',
        'latitude',
        'demonym',
        'flag'
    ];
}