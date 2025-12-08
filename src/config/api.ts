const apiConfig = {
  baseUrl: process.env.API_URL ?? "http://localhost:3000", // your backend base URL
  meEndpoint: process.env.AUTH_ME_ENDPOINT ?? "/api/auth/me",   // or "/api/user"
};

export default apiConfig;