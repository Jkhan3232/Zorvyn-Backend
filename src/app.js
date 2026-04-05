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

const swaggerDocsHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Zorvyn API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: #f8fafc;
      }
      #swagger-ui {
        max-width: 1200px;
        margin: 0 auto;
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = function () {
        window.ui = SwaggerUIBundle({
          url: window.location.origin + "/swagger.json",
          dom_id: "#swagger-ui",
          deepLinking: true,
          persistAuthorization: true,
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset,
          ],
          layout: "StandaloneLayout",
        });
      };
    </script>
  </body>
</html>`;

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
    app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        explorer: true,
      }),
    );
  } else {
    app.get("/api-docs", (req, res) => {
      res.redirect(301, "/api-docs/");
    });

    app.get("/api-docs/", (req, res) => {
      // Allow Swagger assets and inline boot script for docs rendering.
      res.set(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https:; font-src 'self' data: https://unpkg.com; connect-src 'self' https:;",
      );

      res.status(200).type("html").send(swaggerDocsHtml);
    });
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
