import { Model } from "@/forge/database/model";
import { Role } from "./Role";
import { User } from "./User";

export interface UserRoleAttr {
    id: number;
    user_id: number;
    role_id: number;
};

export class UserRole extends Model<UserRoleAttr> implements UserRoleAttr {
    declare id: number;
    declare user_id: number;
    declare role_id: number;
    
    protected static table = 'user_roles';
    protected static fillable = [
        'user_id',
        'role_id'
    ];

    public role() {
        return this.belongsTo(Role, 'role_id')
    }

    public user() {
        return this.belongsTo(User, 'user_id');
    }
}