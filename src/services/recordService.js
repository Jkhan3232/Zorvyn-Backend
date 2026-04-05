const Record = require("../models/Record");
const ApiError = require("../utils/ApiError");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildRecordQuery = ({ startDate, endDate, category, type, search }) => {
  const query = {
    isDeleted: false,
  };

  if (startDate || endDate) {
    query.date = {};
    if (startDate) {
      query.date.$gte = new Date(startDate);
    }
    if (endDate) {
      query.date.$lte = new Date(endDate);
    }
  }

  if (category) {
    query.category = {
      $regex: new RegExp(`^${escapeRegex(category)}$`, "i"),
    };
  }

  if (type) {
    query.type = type;
  }

  if (search) {
    const safeSearch = escapeRegex(search);
    query.$or = [
      { category: { $regex: safeSearch, $options: "i" } },
      { note: { $regex: safeSearch, $options: "i" } },
    ];
  }

  return query;
};

const createRecord = async (payload, createdBy) => {
  const record = await Record.create({
    ...payload,
    createdBy,
  });

  return Record.findById(record._id).populate("createdBy", "name email role");
};

const updateRecord = async (recordId, payload) => {
  const record = await Record.findOneAndUpdate(
    {
      _id: recordId,
      isDeleted: false,
    },
    payload,
    {
      returnDocument: "after",
      runValidators: true,
    },
  ).populate("createdBy", "name email role");

  if (!record) {
    throw new ApiError(404, "Record not found");
  }

  return record;
};

const deleteRecord = async (recordId) => {
  const record = await Record.findOneAndUpdate(
    {
      _id: recordId,
      isDeleted: false,
    },
    {
      isDeleted: true,
    },
    {
      returnDocument: "after",
    },
  );

  if (!record) {
    throw new ApiError(404, "Record not found");
  }
};

const getRecords = async (filters) => {
  const { page = 1, limit = 10, sortBy = "date", sortOrder = "desc" } = filters;

  const query = buildRecordQuery(filters);
  const skip = (Number(page) - 1) * Number(limit);
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  const [records, total] = await Promise.all([
    Record.find(query)
      .populate("createdBy", "name email role")
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(Number(limit)),
    Record.countDocuments(query),
  ]);

  return {
    data: records,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)) || 1,
    },
  };
};

module.exports = {
  createRecord,
  updateRecord,
  deleteRecord,
  getRecords,
};
