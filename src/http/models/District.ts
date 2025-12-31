import { Model } from "@/forge/database/model";

export interface DistrictAttr {
    id: number;
    province_id: number;
    name_en: string;
    name_si: string;
    name_ta: string;
};

export class District extends Model<DistrictAttr> implements DistrictAttr {
    declare id: number;
    declare province_id: number;
    declare name_en: string;
    declare name_si: string;
    declare name_ta: string;
    
    protected static table = 'districts';
    protected static fillable = [
        'province_id',
        'name_en',
        'name_si',
        'name_ta',
    ];
}