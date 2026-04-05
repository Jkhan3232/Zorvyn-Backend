const express = require("express");
const userController = require("../controllers/userController");
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");
const validateRequest = require("../middleware/validateRequest");
const { ROLES } = require("../config/roles");
const {
  createManagedUserValidation,
  updateRoleValidation,
  updateStatusValidation,
} = require("../validations/userValidation");

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

router.post(
  "/",
  createManagedUserValidation,
  validateRequest,
  userController.createUser,
);
router.get("/", userController.listUsers);
router.patch(
  "/:id/role",
  updateRoleValidation,
  validateRequest,
  userController.updateRole,
);
router.patch(
  "/:id/status",
  updateStatusValidation,
  validateRequest,
  userController.updateStatus,
);

module.exports = router;
