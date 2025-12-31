import ApiClient from "../config/axios";
import { ApiEndpoints } from "../config/endpoints";

export const getProfile = async (payload: any) => {
    try {
        const result = ApiClient.get(`${ApiEndpoints.User.Profile}/${payload.id}`);
        console.log(result);
    } catch (err: any) {
        throw new Error(err);
    }
}