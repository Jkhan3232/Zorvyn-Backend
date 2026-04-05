const jwt = require("jsonwebtoken");
const env = require("../config/env");

const parseDurationToMs = (duration) => {
  if (typeof duration === "number" && Number.isFinite(duration)) {
    return duration * 1000;
  }

  if (typeof duration !== "string") {
    return 7 * 24 * 60 * 60 * 1000;
  }

  const trimmed = duration.trim();

  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed) * 1000;
  }

  const match = trimmed.match(/^(\d+)([smhd])$/i);

  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();

  const unitToMs = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * unitToMs[unit];
};

const signAccessToken = (payload) => {
  return jwt.sign(payload, env.accessTokenSecret, {
    expiresIn: env.accessTokenExpiresIn,
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, env.accessTokenSecret);
};

const signRefreshToken = (payload) => {
  return jwt.sign(payload, env.refreshTokenSecret, {
    expiresIn: env.refreshTokenExpiresIn,
  });
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.refreshTokenSecret);
};

const getRefreshTokenExpiryDate = () => {
  const expiresInMs = parseDurationToMs(env.refreshTokenExpiresIn);
  return new Date(Date.now() + expiresInMs);
};

module.exports = {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiryDate,
  // Backward-compatible aliases used in existing code paths.
  signToken: signAccessToken,
  verifyToken: verifyAccessToken,
};
