const mongoose = require("mongoose");
const env = require("./env");

const connectDB = async () => {
  // Assumption: this service runs as a long-lived API with moderate traffic.
  const connectionOptions = {
    maxPoolSize: 20,
    minPoolSize: 5,
    maxIdleTimeMS: 5 * 60 * 1000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000,
  };

  await mongoose.connect(env.mongoUri, connectionOptions);
  console.log("MongoDB connected successfully");
};

module.exports = connectDB;
