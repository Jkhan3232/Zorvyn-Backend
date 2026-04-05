const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { verifyToken } = require("../utils/jwt");

const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new ApiError(401, "Missing or invalid authorization header");
  }

  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!bearerMatch) {
    throw new ApiError(401, "Missing or invalid authorization header");
  }

  const token = bearerMatch[1].trim().replace(/^"(.*)"$/, "$1");
  if (!token) {
    throw new ApiError(401, "Missing or invalid authorization header");
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired token");
  }

  const user = await User.findById(decoded.userId).select("-password");

  if (!user) {
    throw new ApiError(401, "User associated with token does not exist");
  }

  if (!user.isActive) {
    throw new ApiError(403, "User account is deactivated");
  }

  req.user = user;
  next();
});

module.exports = authenticate;
