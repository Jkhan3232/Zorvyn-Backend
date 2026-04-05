const asyncHandler = require("../utils/asyncHandler");
const userService = require("../services/userService");

const updateProfile = asyncHandler(async (req, res) => {
  const updatedAdmin = await userService.updateAdminProfile(
    req.user._id,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Admin profile updated successfully",
    data: updatedAdmin,
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const updatedUser = await userService.updateAnyUserByAdmin(
    req.params.id,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: updatedUser,
  });
});

module.exports = {
  updateProfile,
  updateUser,
};
