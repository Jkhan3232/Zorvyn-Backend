const asyncHandler = require("../utils/asyncHandler");
const userService = require("../services/userService");

const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createManagedUser(req.body);

  res.status(201).json({
    success: true,
    message: "User created and credentials email sent successfully",
    data: user,
  });
});

const listUsers = asyncHandler(async (req, res) => {
  const users = await userService.listUsers();

  res.status(200).json({
    success: true,
    data: users,
  });
});

const updateRole = asyncHandler(async (req, res) => {
  const updatedUser = await userService.updateUserRole(
    req.params.id,
    req.body.role,
  );

  res.status(200).json({
    success: true,
    message: "User role updated successfully",
    data: updatedUser,
  });
});

const updateStatus = asyncHandler(async (req, res) => {
  const updatedUser = await userService.updateUserStatus(
    req.params.id,
    req.body.isActive,
  );

  res.status(200).json({
    success: true,
    message: "User status updated successfully",
    data: updatedUser,
  });
});

module.exports = {
  createUser,
  listUsers,
  updateRole,
  updateStatus,
};
