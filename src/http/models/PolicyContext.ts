import { Model } from "@/forge/database/model";

export interface PolicyContextAttr {
    id: number;
    policy_id: number;
    key: string;
    value: string;
};

export class PolicyContext extends Model<PolicyContextAttr> implements PolicyContextAttr {
    declare id: number;
    declare policy_id: number;
    declare key: string;
    declare value: string;
    
    protected static table = 'policy_context';
    protected static fillable = [
        'id',
        'policy_id',
        'key',
        'value'
    ];
}