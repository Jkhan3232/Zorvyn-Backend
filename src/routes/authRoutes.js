const express = require("express");
const authController = require("../controllers/authController");
const validateRequest = require("../middleware/validateRequest");
const authRateLimiter = require("../middleware/authRateLimiter");
const {
  registerValidation,
  loginValidation,
  refreshTokenPayloadValidation,
} = require("../validations/authValidation");

const router = express.Router();

router.use(authRateLimiter);

router.post(
  "/register",
  registerValidation,
  validateRequest,
  authController.register,
);
router.post("/login", loginValidation, validateRequest, authController.login);
router.post(
  "/refresh-token",
  refreshTokenPayloadValidation,
  validateRequest,
  authController.refreshToken,
);
router.post(
  "/logout",
  refreshTokenPayloadValidation,
  validateRequest,
  authController.logout,
);

module.exports = router;
