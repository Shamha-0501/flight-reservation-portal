import { Model } from "@/forge/database/model";

export interface SessionAttrs {
  id: string;
  user_id: number | null;
  payload: string;
  ip_address: string | null;
  user_agent: string | null;
  last_activity: Date;
}

export class Session extends Model<SessionAttrs> {
  protected static table = "sessions";
  protected static fillable = [
    "id",
    "user_id",
    "payload",
    "ip_address",
    "user_agent",
    "last_activity",
  ];

  declare id: string;
  declare user_id: number | null;
  declare payload: string;
  declare ip_address: string | null;
  declare user_agent: string | null;
  declare last_activity: Date;
}