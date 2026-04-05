const { body, param } = require("express-validator");
const { ROLES, MANAGED_USER_ROLES } = require("../config/roles");

const createManagedUserValidation = [
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

const userIdValidation = [
  param("id").isMongoId().withMessage("Invalid user id"),
];

const updateRoleValidation = [
  ...userIdValidation,
  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(Object.values(ROLES))
    .withMessage(`Role must be one of: ${Object.values(ROLES).join(", ")}`),
];

const updateStatusValidation = [
  ...userIdValidation,
  body("isActive")
    .not()
    .isEmpty()
    .withMessage("isActive is required")
    .isBoolean()
    .withMessage("isActive must be a boolean")
    .toBoolean(),
];

module.exports = {
  createManagedUserValidation,
  userIdValidation,
  updateRoleValidation,
  updateStatusValidation,
};
