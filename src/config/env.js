const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  mongoUri:
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/finance_dashboard",
  jwtSecret: process.env.JWT_SECRET || "change_me_in_production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  accessTokenSecret:
    process.env.JWT_ACCESS_SECRET ||
    process.env.JWT_SECRET ||
    "change_me_in_production",
  accessTokenExpiresIn:
    process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_EXPIRES_IN || "15m",
  refreshTokenSecret:
    process.env.JWT_REFRESH_SECRET ||
    `${process.env.JWT_SECRET || "change_me_in_production"}_refresh`,
  refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  enableGraphQL:
    String(process.env.ENABLE_GRAPHQL || "true").toLowerCase() === "true",
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 200,
  authRateLimitWindowMs:
    Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  authRateLimitMaxRequests:
    Number(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 20,
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpSecure:
    String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpFromEmail: process.env.SMTP_FROM_EMAIL || "",
  smtpFromName: process.env.SMTP_FROM_NAME || "Finance Dashboard",
  appLoginUrl: process.env.APP_LOGIN_URL || "",
  appBaseUrl: process.env.APP_BASE_URL || "",
};
