import { Model } from "@/forge/database/model";

export interface RoleAttr {
    id: number;
    role_key: string;
    display_name: string;
    default_scope: string;
    is_external: boolean;
    description: string;
}

export class Role extends Model<RoleAttr> implements RoleAttr {
    declare id: number;
    declare role_key: string;
    declare display_name: string;
    declare default_scope: string;
    declare is_external: boolean;
    declare description: string;

    protected static table = "roles";
    protected static fillable = [
        'id',
        'role_key',
        'display_name',
        'default_scope',
        'is_external',
        'description'
    ];
}