const User = require("../models/User");
const { randomUUID } = require("crypto");
const RefreshToken = require("../models/RefreshToken");
const ApiError = require("../utils/ApiError");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiryDate,
} = require("../utils/jwt");
const { MANAGED_USER_ROLES, ROLES } = require("../config/roles");
const { generateTemporaryPassword } = require("../utils/password");
const { sendCredentialsEmail } = require("./emailService");

const ROLE_ALIASES = Object.freeze({
  admin: ROLES.ADMIN,
  staff: ROLES.ANALYST,
  user: ROLES.VIEWER,
  analyst: ROLES.ANALYST,
  viewer: ROLES.VIEWER,
});

const sanitizeUser = (userDocument) => ({
  id: userDocument._id,
  name: userDocument.name,
  email: userDocument.email,
  role: userDocument.role,
  isActive: userDocument.isActive,
  createdAt: userDocument.createdAt,
  updatedAt: userDocument.updatedAt,
});

const normalizeRoleInput = (role) => {
  if (typeof role === "undefined") {
    return undefined;
  }

  if (typeof role !== "string") {
    throw new ApiError(
      400,
      "Role must be one of: admin, staff, user, analyst, viewer",
    );
  }

  const normalizedRole = ROLE_ALIASES[role.trim().toLowerCase()];

  if (!normalizedRole) {
    throw new ApiError(
      400,
      "Role must be one of: admin, staff, user, analyst, viewer",
    );
  }

  return normalizedRole;
};

const normalizeStatusInput = (status) => {
  if (typeof status === "undefined") {
    return undefined;
  }

  if (typeof status === "boolean") {
    return status;
  }

  if (typeof status === "string") {
    const normalizedStatus = status.trim().toLowerCase();

    if (normalizedStatus === "active") {
      return true;
    }

    if (normalizedStatus === "inactive") {
      return false;
    }
  }

  throw new ApiError(400, "Status must be Active or Inactive");
};

const issueAuthTokens = async (user) => {
  const payload = {
    userId: user._id,
    role: user.role,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({
    ...payload,
    sid: randomUUID(),
  });

  await RefreshToken.create({
    userId: user._id,
    token: refreshToken,
    expiryDate: getRefreshTokenExpiryDate(),
  });

  return {
    token: accessToken,
    accessToken,
    refreshToken,
  };
};

const registerUser = async ({ name, email, password }) => {
  const normalizedEmail = email.toLowerCase();

  console.info(
    `[UserService] registerUser called for email=${normalizedEmail} (public signup flow, credentials email is not sent)`,
  );

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ApiError(400, "Email is already registered");
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
  });

  return sanitizeUser(user);
};

const createManagedUser = async ({
  name,
  email,
  role,
  isActive = true,
  password,
}) => {
  const normalizedEmail = email.toLowerCase();
  const managedRole = role || MANAGED_USER_ROLES[0];

  if (!MANAGED_USER_ROLES.includes(managedRole)) {
    throw new ApiError(
      400,
      `Role must be one of: ${MANAGED_USER_ROLES.join(", ")}`,
    );
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ApiError(400, "Email is already registered");
  }

  const temporaryPassword =
    typeof password === "string" && password.trim().length > 0
      ? password
      : generateTemporaryPassword();
  let user;

  console.info(
    `[UserService] createManagedUser requested for email=${normalizedEmail} role=${managedRole}`,
  );

  try {
    user = await User.create({
      name,
      email: normalizedEmail,
      password: temporaryPassword,
      role: managedRole,
      isActive,
    });

    console.info(
      `[UserService] Managed user created in DB (userId=${user._id}, email=${normalizedEmail})`,
    );

    await sendCredentialsEmail({
      to: normalizedEmail,
      name,
      password: temporaryPassword,
      role: managedRole,
    });

    console.info(
      `[UserService] Credential email flow completed (userId=${user._id}, email=${normalizedEmail})`,
    );
  } catch (error) {
    console.error(
      `[UserService] createManagedUser failed for email=${normalizedEmail}: ${error.message}`,
    );

    if (user && user._id) {
      await User.findByIdAndDelete(user._id);
      console.warn(
        `[UserService] Rolled back managed user due to email failure (userId=${user._id})`,
      );
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      500,
      "Unable to create user and send credentials email. Please retry.",
    );
  }

  return sanitizeUser(user);
};

const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase();

  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password",
  );
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new ApiError(403, "User account is deactivated");
  }

  const tokens = await issueAuthTokens(user);

  return {
    ...tokens,
    user: sanitizeUser(user),
  };
};

const refreshAccessToken = async (refreshTokenValue) => {
  if (!refreshTokenValue) {
    throw new ApiError(400, "Refresh token is required");
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshTokenValue);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const storedToken = await RefreshToken.findOne({
    userId: decoded.userId,
    token: refreshTokenValue,
  });

  if (!storedToken) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  if (storedToken.expiryDate <= new Date()) {
    await RefreshToken.deleteOne({ _id: storedToken._id });
    throw new ApiError(401, "Refresh token has expired");
  }

  const user = await User.findById(decoded.userId).select("-password");
  if (!user) {
    await RefreshToken.deleteOne({ _id: storedToken._id });
    throw new ApiError(401, "User associated with token does not exist");
  }

  if (!user.isActive) {
    await RefreshToken.deleteOne({ _id: storedToken._id });
    throw new ApiError(403, "User account is deactivated");
  }

  const accessToken = signAccessToken({
    userId: user._id,
    role: user.role,
  });

  return {
    token: accessToken,
    accessToken,
  };
};

const logoutUser = async (refreshTokenValue) => {
  if (!refreshTokenValue) {
    throw new ApiError(400, "Refresh token is required");
  }

  await RefreshToken.deleteOne({ token: refreshTokenValue });
};

const updateUserRole = async (userId, role) => {
  const normalizedRole = normalizeRoleInput(role);

  const user = await User.findByIdAndUpdate(
    userId,
    { role: normalizedRole },
    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return sanitizeUser(user);
};

const updateUserStatus = async (userId, isActive) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { isActive },
    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!isActive) {
    await RefreshToken.deleteMany({ userId: user._id });
  }

  return sanitizeUser(user);
};

const updateAdminProfile = async (adminId, payload) => {
  const { name, email, password } = payload;
  const adminUser = await User.findById(adminId).select("+password");

  if (!adminUser) {
    throw new ApiError(404, "Admin user not found");
  }

  if (typeof name !== "undefined") {
    adminUser.name = name;
  }

  if (typeof email !== "undefined") {
    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: adminUser._id },
    });

    if (existingUser) {
      throw new ApiError(400, "Email is already registered");
    }

    adminUser.email = normalizedEmail;
  }

  if (typeof password !== "undefined") {
    adminUser.password = password;
  }

  await adminUser.save();

  return sanitizeUser(adminUser);
};

const updateAnyUserByAdmin = async (userId, payload) => {
  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const updates = {
    hasChanges: false,
  };

  if (typeof payload.name !== "undefined") {
    user.name = payload.name;
    updates.hasChanges = true;
  }

  if (typeof payload.email !== "undefined") {
    const normalizedEmail = payload.email.toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: user._id },
    });

    if (existingUser) {
      throw new ApiError(400, "Email is already registered");
    }

    user.email = normalizedEmail;
    updates.hasChanges = true;
  }

  const normalizedRole = normalizeRoleInput(payload.role);
  if (typeof normalizedRole !== "undefined") {
    user.role = normalizedRole;
    updates.hasChanges = true;
  }

  const normalizedStatus =
    typeof payload.status !== "undefined"
      ? normalizeStatusInput(payload.status)
      : normalizeStatusInput(payload.isActive);

  if (typeof normalizedStatus !== "undefined") {
    user.isActive = normalizedStatus;
    updates.hasChanges = true;
  }

  if (!updates.hasChanges) {
    throw new ApiError(400, "At least one field is required for update");
  }

  await user.save();

  if (!user.isActive) {
    await RefreshToken.deleteMany({ userId: user._id });
  }

  return sanitizeUser(user);
};

const listUsers = async () => {
  const users = await User.find().sort({ createdAt: -1 });
  return users.map(sanitizeUser);
};

module.exports = {
  registerUser,
  createManagedUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  updateUserRole,
  updateUserStatus,
  updateAdminProfile,
  updateAnyUserByAdmin,
  listUsers,
};
