const express = require("express");
const authController = require("../controllers/authController");
const validateRequest = require("../middleware/validateRequest");
const {
  registerValidation,
  loginValidation,
} = require("../validations/authValidation");

const router = express.Router();

router.post(
  "/register",
  registerValidation,
  validateRequest,
  authController.register,
);
router.post("/login", loginValidation, validateRequest, authController.login);

module.exports = router;
