import { Model } from "@/forge/database/model";

export interface CityAttr {
    id: number;
    name: string;
    district_id: string;
    sub_name: string;
    postal_code: number;
    longitude: number;
    latitude: number;
};

export class City extends Model<CityAttr> implements CityAttr {
    declare id: number;
    declare name: string;
    declare district_id: string;
    declare sub_name: string;
    declare postal_code: number;
    declare longitude: number;
    declare latitude: number;
    
    protected static table = 'cities';
    protected static fillable = [
        'name',
        'district_id',
        'sub_name',
        'postal_code',
        'longitude',
        'latitude',
    ];
}