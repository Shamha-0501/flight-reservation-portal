import axios from "axios";
import { API_ORIGIN } from "./origin";

export const http = axios.create({
  baseURL: API_ORIGIN,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json",
  },

  // IMPORTANT for Laravel
  withCredentials: true,    
  withXSRFToken: true,         
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
});

export async function csrf() {
  await http.get("/sanctum/csrf-cookie");
}

http.interceptors.response.use(
  (res) => {
    console.log("[API RESPONSE]", {
      url: res.config.url,
      status: res.status,
      data: res.data,
      headers: res.headers,
    });
    return res;
  },
  (err) => {
    console.log("[API ERROR]", {
      message: err.message,
      status: err?.response?.status,
      url: err?.config?.url,
      data: err?.response?.data,
      headers: err?.response?.headers,
    });
    return Promise.reject(err);
  }
);
