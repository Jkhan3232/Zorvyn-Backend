const asyncHandler = require("../utils/asyncHandler");
const recordService = require("../services/recordService");

const createRecord = asyncHandler(async (req, res) => {
  const record = await recordService.createRecord(req.body, req.user._id);

  res.status(201).json({
    success: true,
    message: "Record created successfully",
    data: record,
  });
});

const updateRecord = asyncHandler(async (req, res) => {
  const record = await recordService.updateRecord(req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: "Record updated successfully",
    data: record,
  });
});

const deleteRecord = asyncHandler(async (req, res) => {
  await recordService.deleteRecord(req.params.id);

  res.status(200).json({
    success: true,
    message: "Record deleted successfully",
  });
});

const getRecords = asyncHandler(async (req, res) => {
  const result = await recordService.getRecords(req.query);

  res.status(200).json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
});

module.exports = {
  createRecord,
  updateRecord,
  deleteRecord,
  getRecords,
};
