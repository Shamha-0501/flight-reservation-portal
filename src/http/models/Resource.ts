import { Model } from "@/forge/database/model";

export interface ResourceAttr {
    id: number;
    key: string;
    description: string;
};

export class Resource extends Model<ResourceAttr> implements ResourceAttr {
    declare id: number;
    declare key: string;
    declare description: string;

    protected static table = 'resources';
    protected static fillable = [
        'key', 
        'description'
    ];
}