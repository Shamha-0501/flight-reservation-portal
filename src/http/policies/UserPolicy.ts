import { Gate } from "@/forge/core/auth/gate";
import { BasePolicy } from "@/forge/core/auth/basePolicy";
import { UserAttr } from "../models/User";

type User = Pick<UserAttr, "id" | "email" | "role" | "tenant_id">;

export class UserPolicy extends BasePolicy<User, User> {
    viewAny(user: User, resource: User) {
        return Gate.allow();
    }

    view(user: User, resource: User) {
        if (user.id === resource.id) {
            return Gate.allow();
        }
        return Gate.deny();
    }
}