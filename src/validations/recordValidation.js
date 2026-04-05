const { body, param, query } = require("express-validator");

const recordIdValidation = [
  param("id").isMongoId().withMessage("Invalid record id"),
];

const createRecordValidation = [
  body("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isFloat({ min: 0 })
    .withMessage("Amount must be a non-negative number")
    .toFloat(),
  body("type")
    .notEmpty()
    .withMessage("Type is required")
    .isIn(["income", "expense"])
    .withMessage("Type must be either income or expense"),
  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required")
    .isLength({ max: 100 })
    .withMessage("Category must be at most 100 characters"),
  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be a valid ISO date")
    .toDate(),
  body("note")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Note must be at most 500 characters"),
];

const updateRecordValidation = [
  ...recordIdValidation,
  body("amount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Amount must be a non-negative number")
    .toFloat(),
  body("type")
    .optional()
    .isIn(["income", "expense"])
    .withMessage("Type must be either income or expense"),
  body("category")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Category must be between 1 and 100 characters"),
  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be a valid ISO date")
    .toDate(),
  body("note")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Note must be at most 500 characters"),
];

const getRecordsValidation = [
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("startDate must be a valid ISO date")
    .toDate(),
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("endDate must be a valid ISO date")
    .toDate(),
  query("category")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("category must be between 1 and 100 characters"),
  query("type")
    .optional()
    .isIn(["income", "expense"])
    .withMessage("type must be either income or expense"),
  query("search")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("search must be between 1 and 100 characters"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer")
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100")
    .toInt(),
  query("sortBy")
    .optional()
    .isIn(["date", "amount", "category", "createdAt"])
    .withMessage("sortBy must be one of date, amount, category, createdAt"),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("sortOrder must be either asc or desc"),
];

module.exports = {
  recordIdValidation,
  createRecordValidation,
  updateRecordValidation,
  getRecordsValidation,
};
