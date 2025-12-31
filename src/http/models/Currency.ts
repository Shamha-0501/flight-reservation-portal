import { Model } from "@/forge/database/model";

export interface CurrencyAttr {
    id: number;
    code: string;
    name: string;
};

export class Currency extends Model<CurrencyAttr> implements CurrencyAttr {
    declare id: number;
    declare code: string;
    declare name: string;
    
    protected static table = 'currencies';
    protected static fillable = [
        'id',
        'code',
        'name'
    ];
}