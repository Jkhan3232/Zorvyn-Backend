const http = require("http");
const env = require("./config/env");
const connectDB = require("./config/db");
const createApp = require("./app");

let server;

const startServer = async () => {
  try {
    await connectDB();
    const app = await createApp();

    server = http.createServer(app);
    server.listen(env.port, () => {
      console.log(`Server is running on port ${env.port}`);
    });

    return server;
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

const shutdown = async () => {
  if (server) {
    server.close(() => {
      console.log("HTTP server closed");
    });
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

if (require.main === module) {
  startServer();
}

module.exports = {
  startServer,
};
