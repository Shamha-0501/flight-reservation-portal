import { Model } from "@/forge/database/model";

export interface UserProfileAttr {
  id: number;
  user_id: number;
  country_id: number;
  province_id: number;
  district_id: number;
  city_id: number;
  title: string;
  fname: string;
  lname: string;
  profile_url: string;
  code: string;
  mobile: string;
  mobile_verified: boolean;
  whatsapp: string;
  nic: string;
  date_of_birth: string;
  social_media: string;
  contact_method: string;
  address: string;
  bio: string;
}

export class UserProfile
  extends Model<UserProfileAttr>
  implements UserProfileAttr
{
  declare id: number;
  declare user_id: number;
  declare country_id: number;
  declare province_id: number;
  declare district_id: number;
  declare city_id: number;
  declare title: string;
  declare fname: string;
  declare lname: string;
  declare profile_url: string;
  declare code: string;
  declare mobile: string;
  declare mobile_verified: boolean;
  declare whatsapp: string;
  declare nic: string;
  declare date_of_birth: string;
  declare social_media: string;
  declare contact_method: string;
  declare address: string;
  declare bio: string;

  public static table = "user_profiles";
  public static fillable = [
    "id",
    "user_id",
    "country_id",
    "province_id",
    "district_id",
    "city_id",
    "title",
    "fname",
    "lname",
    "profile_url",
    "code",
    "mobile",
    "mobile_verified",
    "whatsapp",
    "nic",
    "date_of_birth",
    "social_media",
    "contact_method",
    "address",
    "bio",
  ];
}
