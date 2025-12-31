import { Model } from "@/forge/database/model";

export interface ProvinceAttr {
    id: number;
    name_en: string;
    name_si: string;
    name_ta: string;
};

export class Province extends Model<ProvinceAttr> implements ProvinceAttr {
    declare id: number;
    declare name_en: string;
    declare name_si: string;
    declare name_ta: string;
    
    protected static table = 'provinces';
    protected static fillable = [
        'name_en',
        'name_si',
        'name_ta',
    ];
}