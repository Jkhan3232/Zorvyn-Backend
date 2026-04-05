const asyncHandler = require("../utils/asyncHandler");
const dashboardService = require("../services/dashboardService");

const getTotalIncome = asyncHandler(async (req, res) => {
  const totals = await dashboardService.getTotals();

  res.status(200).json({
    success: true,
    data: {
      totalIncome: totals.totalIncome,
    },
  });
});

const getTotalExpense = asyncHandler(async (req, res) => {
  const totals = await dashboardService.getTotals();

  res.status(200).json({
    success: true,
    data: {
      totalExpense: totals.totalExpense,
    },
  });
});

const getNetBalance = asyncHandler(async (req, res) => {
  const totals = await dashboardService.getTotals();

  res.status(200).json({
    success: true,
    data: {
      netBalance: totals.netBalance,
    },
  });
});

const getCategoryTotals = asyncHandler(async (req, res) => {
  const categoryTotals = await dashboardService.getCategoryTotals();

  res.status(200).json({
    success: true,
    data: categoryTotals,
  });
});

const getMonthlyTrends = asyncHandler(async (req, res) => {
  const monthlyTrends = await dashboardService.getMonthlyTrends();

  res.status(200).json({
    success: true,
    data: monthlyTrends,
  });
});

const getRecentTransactions = asyncHandler(async (req, res) => {
  const recentTransactions = await dashboardService.getRecentTransactions();

  res.status(200).json({
    success: true,
    data: recentTransactions,
  });
});

const getSummary = asyncHandler(async (req, res) => {
  const summary = await dashboardService.getDashboardSummary();

  res.status(200).json({
    success: true,
    data: summary,
  });
});

module.exports = {
  getTotalIncome,
  getTotalExpense,
  getNetBalance,
  getCategoryTotals,
  getMonthlyTrends,
  getRecentTransactions,
  getSummary,
};
