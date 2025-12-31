import { Model } from "@/forge/database/model";

export interface PolicyAttr {
    id: number;
    name: string;
    effect: string;
    priority: number;
    resource_id: number;
    action_id: number;
    condition: string;
    enabled: boolean;
};

export class Policy extends Model<PolicyAttr> implements PolicyAttr {
    declare id: number;
    declare name: string;
    declare effect: string;
    declare priority: number;
    declare resource_id: number;
    declare action_id: number;
    declare condition: string;
    declare enabled: boolean;
    
    protected static table = 'policies';
    protected static fillable = [
        'id',
        'name',
        'effect',
        'priority',
        'resource_id',
        'action_id',
        'condition',
        'enabled'
    ];
}