import { ForgeFaker } from "@/forge/database/facker/faker";
import { BaseFactory } from "@/forge/database/factory/base";
import { hashPassword } from "@/forge/security/password";
import { UserAttr } from "@/src/http/models/User";


type UserInput = Omit<UserAttr, "id" | "remember_token" | "subscribe_news_letter" | "tenant_id">;

export class UserFactory extends BaseFactory<UserInput> {
    definition(facker: ForgeFaker): UserInput {
        const fullName = facker.fullName();

        return {
            email: facker.email(fullName, 'bluemoon.lk'),
            password: hashPassword("password"),
            role: "user",
            verified: facker.boolean(0.8),
        };
    }
}