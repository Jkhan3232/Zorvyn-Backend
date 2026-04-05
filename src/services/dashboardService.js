const Record = require("../models/Record");

const baseMatch = {
  isDeleted: false,
};

const getTotals = async () => {
  const [totals] = await Record.aggregate([
    { $match: baseMatch },
    {
      $group: {
        _id: null,
        totalIncome: {
          $sum: {
            $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
          },
        },
        totalExpense: {
          $sum: {
            $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalIncome: 1,
        totalExpense: 1,
        netBalance: {
          $subtract: ["$totalIncome", "$totalExpense"],
        },
      },
    },
  ]);

  return (
    totals || {
      totalIncome: 0,
      totalExpense: 0,
      netBalance: 0,
    }
  );
};

const getCategoryTotals = async () => {
  return Record.aggregate([
    { $match: baseMatch },
    {
      $group: {
        _id: {
          category: "$category",
          type: "$type",
        },
        total: { $sum: "$amount" },
      },
    },
    {
      $group: {
        _id: "$_id.category",
        income: {
          $sum: {
            $cond: [{ $eq: ["$_id.type", "income"] }, "$total", 0],
          },
        },
        expense: {
          $sum: {
            $cond: [{ $eq: ["$_id.type", "expense"] }, "$total", 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        category: "$_id",
        income: 1,
        expense: 1,
        net: { $subtract: ["$income", "$expense"] },
      },
    },
    {
      $sort: { category: 1 },
    },
  ]);
};

const getMonthlyTrends = async () => {
  return Record.aggregate([
    { $match: baseMatch },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m",
            date: "$date",
          },
        },
        totalIncome: {
          $sum: {
            $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
          },
        },
        totalExpense: {
          $sum: {
            $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        month: "$_id",
        totalIncome: 1,
        totalExpense: 1,
        netBalance: { $subtract: ["$totalIncome", "$totalExpense"] },
      },
    },
    {
      $sort: { month: 1 },
    },
  ]);
};

const getRecentTransactions = async () => {
  return Record.find(baseMatch)
    .populate("createdBy", "name email role")
    .sort({ date: -1, createdAt: -1 })
    .limit(5);
};

const getDashboardSummary = async () => {
  const [totals, categoryTotals, monthlyTrends, recentTransactions] =
    await Promise.all([
      getTotals(),
      getCategoryTotals(),
      getMonthlyTrends(),
      getRecentTransactions(),
    ]);

  return {
    ...totals,
    categoryTotals,
    monthlyTrends,
    recentTransactions,
  };
};

module.exports = {
  getTotals,
  getCategoryTotals,
  getMonthlyTrends,
  getRecentTransactions,
  getDashboardSummary,
};
