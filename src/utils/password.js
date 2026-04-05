const crypto = require("crypto");

const generateTemporaryPassword = (length = 12) => {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$!";
  const bytes = crypto.randomBytes(length);

  let password = "";
  for (let index = 0; index < length; index += 1) {
    password += alphabet[bytes[index] % alphabet.length];
  }

  return password;
};

module.exports = {
  generateTemporaryPassword,
};
