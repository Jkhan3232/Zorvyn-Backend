const asyncHandler = require("../utils/asyncHandler");
const userService = require("../services/userService");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const { verifyToken } = require("../utils/jwt");
const { ROLES } = require("../config/roles");

const getAdminRequester = async (authorizationHeader) => {
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authorizationHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user || !user.isActive || user.role !== ROLES.ADMIN) {
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
};

const register = asyncHandler(async (req, res) => {
  const adminRequester = await getAdminRequester(req.headers.authorization);
  const hasManagedFields =
    typeof req.body.role !== "undefined" ||
    typeof req.body.isActive !== "undefined";

  if (hasManagedFields && !adminRequester) {
    throw new ApiError(
      403,
      "Only admin can set role or activation status during registration",
    );
  }

  if (adminRequester) {
    const user = await userService.createManagedUser(req.body);

    return res.status(201).json({
      success: true,
      message: "User created and credentials email sent successfully",
      data: user,
    });
  }

  const user = await userService.registerUser(req.body);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: user,
  });
});

const login = asyncHandler(async (req, res) => {
  const result = await userService.loginUser(req.body);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: result,
  });
});

module.exports = {
  register,
  login,
};
