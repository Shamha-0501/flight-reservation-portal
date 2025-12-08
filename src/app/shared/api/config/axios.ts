import axios from "axios";

const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:3000/api"; // fallback to default base url (nextjs base url)

const ApiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  withCredentials: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

let authState = { isAuthenticated: false, user: null };

export const updateAuthState = (isAuthenticated: boolean, user: any) => {
  authState = { isAuthenticated, user };
};

export const getAuthState = () => authState;

/**
 * Cookie helpers
 */

// Grab XSRF-TOKEN from cookie
const getXSRFToken = () => {
    const cookie = document?.cookie ?? "";
    const parts = cookie.split(";").find((row) => row.startsWith("XSRF-TOKEN="));
    if (!parts) return null;

    try {
        return decodeURIComponent(parts.split("=")[1]);
    } catch {
        return null;
    }
};

// Initialize sanctum CSRF cookie 
export const initializeXSRFToken = async () => {
    try {
        await ApiClient.get("/sanctum/csrf-cookie");

        const token = getXSRFToken();
        if (token) {
            ApiClient.defaults.headers.common["X-XSRF-TOKEN"] = token;
        }
    } catch (err: any) {
        console.warn("initializeCSRFToken failed:", err?.message || err);
    }
};

// Attach XSRF headers on each request if missing
ApiClient.interceptors.request.use((config: any) => {
    if (!config.headers) config.headers = {};
    if (!config.headers["X-XSRF-TOKEN"]) {
        const token = getXSRFToken();
        if (token) config.headers["X-XSRF-TOKEN"] = token;
    }

    return config;
});

// Normalize errors
ApiClient.interceptors.response.use(
    (res) => res,
    (error) => {
        const status = error?.response?.status ?? 0;
        let message = "Request Failed";
        let errors = null;

        if (error?.response?.data) {
            const data = error.response.data;
            message = data.message || message;
            errors = data.errors || null;
        } else
        if (error?.message) {
            message = error.message;
        }

        return Promise.reject({ ...error, status, message, errors });
    }
);

export default ApiClient;