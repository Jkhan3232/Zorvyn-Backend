const env = require("../src/config/env");
const connectDB = require("../src/config/db");
const createApp = require("../src/app");

let appInstance = null;

// Ye func Vercel Serverless Function ke tor par run hoga
module.exports = async (req, res) => {
  try {
    // Agar DB connect aur App express pehle se memory me nahi hai toh initialize karein (Cold Start optimization)
    if (!appInstance) {
      await connectDB();
      appInstance = await createApp();
    }

    // Express app ko actual Request aur Response pass kar dega
    return appInstance(req, res);
  } catch (error) {
    console.error("Vercel Initialization Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
