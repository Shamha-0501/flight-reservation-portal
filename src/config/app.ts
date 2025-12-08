const appConfig = {
  name: process.env.APP_NAME ?? "Nexfort Real Estate Rest API",
  env:  process.env.APP_ENV ?? "production",
  url:  process.env.APP_URL ?? "http://localhost",
  key:  process.env.APP_KEY ?? "",
};

export default appConfig;