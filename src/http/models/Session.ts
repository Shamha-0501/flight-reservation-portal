import { Model } from "@/forge/database/model";

export type SessionAttrs = {
  id: string;
  user_id: number | null;
  payload: string;
  ip_address: string | null;
  user_agent: string | null;
  last_activity: Date;
};

export class Session extends Model<SessionAttrs> {
  declare id: string;
  declare user_id: number | null;
  declare payload: string;
  declare ip_address: string | null;
  declare user_agent: string | null;
  declare last_activity: Date;

  protected static table = "sessions";

  protected static primaryKey = "id";
  protected static incrementing = false;   // id is NOT auto-increment
  protected static keyType = "string";

  protected static fillable = [
    "id",
    "user_id",
    "payload",
    "ip_address",
    "user_agent",
    "last_activity",
  ];
}
