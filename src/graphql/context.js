const User = require("../models/User");
const { verifyAccessToken } = require("../utils/jwt");

const buildGraphQLContext = async ({ req }) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { user: null };
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user || !user.isActive) {
      return { user: null };
    }

    return { user };
  } catch (error) {
    return { user: null };
  }
};

module.exports = buildGraphQLContext;
