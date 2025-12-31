import { Model } from "@/forge/database/model";

export interface ActionAttr {
    id: number;
    key: string;
};

export class Action extends Model<ActionAttr> implements ActionAttr {
    declare id: number;
    declare key: string;

    protected static table = 'actions';
    protected static fillable = ['key'];
}