import { Model } from "@/forge/database/model";

export interface UserAttrs {
  id: number;
  email: string;
  password: string;
  role_id: number;
  remember_token: string;
  verified: boolean;
  subscribe_news_letter: boolean;
}

export class User extends Model<UserAttrs> implements UserAttrs {
  declare id: number;
  declare email: string;
  declare password: string;
  declare role_id: number;
  declare remember_token: string;
  declare verified: boolean;
  declare subscribe_news_letter: boolean;
  
  protected static table = "users";
  protected static fillable = [
    "id",
    "email",
    "password",
    "role_id",
    "remember_token",
    "verified",
    "subscribe_news_letter",
  ];
}
