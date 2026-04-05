const express = require("express");
const dashboardController = require("../controllers/dashboardController");
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");
const { DASHBOARD_READ_ROLES } = require("../config/roles");

const router = express.Router();

router.use(authenticate);
router.use(authorize(...DASHBOARD_READ_ROLES));

router.get("/total-income", dashboardController.getTotalIncome);
router.get("/total-expense", dashboardController.getTotalExpense);
router.get("/net-balance", dashboardController.getNetBalance);
router.get("/category-totals", dashboardController.getCategoryTotals);
router.get("/monthly-trends", dashboardController.getMonthlyTrends);
router.get("/recent-transactions", dashboardController.getRecentTransactions);
router.get("/summary", dashboardController.getSummary);

module.exports = router;
