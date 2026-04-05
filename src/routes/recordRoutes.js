const express = require("express");
const recordController = require("../controllers/recordController");
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");
const validateRequest = require("../middleware/validateRequest");
const { ROLES, RECORD_READ_ROLES } = require("../config/roles");
const {
  recordIdValidation,
  createRecordValidation,
  updateRecordValidation,
  getRecordsValidation,
} = require("../validations/recordValidation");

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize(...RECORD_READ_ROLES),
  getRecordsValidation,
  validateRequest,
  recordController.getRecords,
);

router.post(
  "/",
  authorize(ROLES.ADMIN),
  createRecordValidation,
  validateRequest,
  recordController.createRecord,
);

router.patch(
  "/:id",
  authorize(ROLES.ADMIN),
  updateRecordValidation,
  validateRequest,
  recordController.updateRecord,
);

router.delete(
  "/:id",
  authorize(ROLES.ADMIN),
  recordIdValidation,
  validateRequest,
  recordController.deleteRecord,
);

module.exports = router;
