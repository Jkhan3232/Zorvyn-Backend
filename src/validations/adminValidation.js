const { body, param } = require("express-validator");

const profileUpdateValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("password")
    .optional()
    .isLength({ min: 6, max: 50 })
    .withMessage("Password must be between 6 and 50 characters"),
  body().custom((_, { req }) => {
    const hasAnyField = ["name", "email", "password"].some(
      (field) => typeof req.body[field] !== "undefined",
    );

    if (!hasAnyField) {
      throw new Error("At least one field is required for profile update");
    }

    return true;
  }),
];

const adminUpdateUserValidation = [
  param("id").isMongoId().withMessage("Invalid user id"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("role")
    .optional()
    .isString()
    .withMessage("Role must be a string")
    .trim()
    .toLowerCase()
    .isIn(["admin", "staff", "user"])
    .withMessage("Role must be one of: admin, staff, user"),
  body("status")
    .optional()
    .isString()
    .withMessage("Status must be a string")
    .trim()
    .toLowerCase()
    .isIn(["active", "inactive"])
    .withMessage("Status must be Active or Inactive"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean")
    .toBoolean(),
  body().custom((_, { req }) => {
    const hasAnyField = ["name", "email", "role", "status", "isActive"].some(
      (field) => typeof req.body[field] !== "undefined",
    );

    if (!hasAnyField) {
      throw new Error("At least one field is required for user update");
    }

    return true;
  }),
];

module.exports = {
  profileUpdateValidation,
  adminUpdateUserValidation,
};
