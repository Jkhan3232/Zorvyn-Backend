const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const env = require("./config/env");
const routes = require("./routes");
const swaggerSpec = require("./config/swagger");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const apiLimiter = require("./middleware/rateLimiter");
const applyGraphQL = require("./graphql");

const createApp = async () => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(apiLimiter);

  app.get("/health", (req, res) => {
    res.status(200).json({
      success: true,
      message: "Service is healthy",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/swagger.json", (req, res) => {
    res.status(200).json(swaggerSpec);
  });

  if (env.nodeEnv !== "production") {
    const swaggerUi = require("swagger-ui-express");
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  }

  app.use("/api", routes);

  if (env.enableGraphQL) {
    await applyGraphQL(app);
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
