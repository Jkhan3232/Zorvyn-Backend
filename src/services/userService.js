const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const { signToken } = require("../utils/jwt");
const { MANAGED_USER_ROLES } = require("../config/roles");
const { generateTemporaryPassword } = require("../utils/password");
const { sendCredentialsEmail } = require("./emailService");

const sanitizeUser = (userDocument) => ({
  id: userDocument._id,
  name: userDocument.name,
  email: userDocument.email,
  role: userDocument.role,
  isActive: userDocument.isActive,
  createdAt: userDocument.createdAt,
  updatedAt: userDocument.updatedAt,
});

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

  const token = signToken({
    userId: user._id,
    role: user.role,
  });

  return {
    token,
    user: sanitizeUser(user),
  };
};

const updateUserRole = async (userId, role) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { role },
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
  updateUserRole,
  updateUserStatus,
  listUsers,
};
