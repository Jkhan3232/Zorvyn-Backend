const express = require("express");
const adminController = require("../controllers/adminController");
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");
const validateRequest = require("../middleware/validateRequest");
const { ROLES } = require("../config/roles");
const {
  profileUpdateValidation,
  adminUpdateUserValidation,
} = require("../validations/adminValidation");

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

router.put(
  "/profile",
  profileUpdateValidation,
  validateRequest,
  adminController.updateProfile,
);

router.put(
  "/user/:id",
  adminUpdateUserValidation,
  validateRequest,
  adminController.updateUser,
);

module.exports = router;
