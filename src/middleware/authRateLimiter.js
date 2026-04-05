const rateLimit = require("express-rate-limit");
const env = require("../config/env");

const authRateLimiter = rateLimit({
  windowMs: env.authRateLimitWindowMs,
  max: env.authRateLimitMaxRequests,
  skip: () => env.nodeEnv === "test",
  message: {
    success: false,
    message: "Too many authentication requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = authRateLimiter;
