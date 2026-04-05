const { body, header } = require("express-validator");
const { MANAGED_USER_ROLES } = require("../config/roles");

const registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6, max: 50 })
    .withMessage("Password must be between 6 and 50 characters"),
  body("role")
    .optional()
    .isIn(MANAGED_USER_ROLES)
    .withMessage(`Role must be one of: ${MANAGED_USER_ROLES.join(", ")}`),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean")
    .toBoolean(),
];

const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

const refreshTokenPayloadValidation = [
  body("refreshToken")
    .optional()
    .isString()
    .withMessage("refreshToken must be a string")
    .trim()
    .notEmpty()
    .withMessage("refreshToken cannot be empty"),
  header("x-refresh-token")
    .optional()
    .isString()
    .withMessage("x-refresh-token header must be a string")
    .trim()
    .notEmpty()
    .withMessage("x-refresh-token header cannot be empty"),
  body().custom((_, { req }) => {
    const tokenFromBody =
      req.body &&
      typeof req.body.refreshToken === "string" &&
      req.body.refreshToken.trim();
    const tokenFromHeader = req.get("x-refresh-token");

    if (!tokenFromBody && !tokenFromHeader) {
      throw new Error(
        "Provide refresh token using x-refresh-token header or refreshToken in request body",
      );
    }

    return true;
  }),
];

module.exports = {
  registerValidation,
  loginValidation,
  refreshTokenPayloadValidation,
};
