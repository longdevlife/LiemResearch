import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { pinoHttp } from "pino-http";
import swaggerUi from "swagger-ui-express";

import { env } from "./config/env.js";
import { logger } from "./infrastructure/logger.js";
import { errorHandler, notFoundHandler } from "./common/middleware/error-handler.js";
import { apiRouter } from "./routes/index.js";
import { openapiSpec } from "./openapi.js";

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(pinoHttp({ logger }));

  app.get("/health", (_req, res) => {
    res.json({ success: true, data: { status: "ok", ts: new Date().toISOString() } });
  });

  // Interactive API docs (browsable + testable). Helmet's default CSP blocks
  // Swagger UI's inline assets, so disable CSP for this route only.
  app.use(
    "/api-docs",
    helmet({ contentSecurityPolicy: false }),
    swaggerUi.serve,
    swaggerUi.setup(openapiSpec as Record<string, unknown>, {
      customSiteTitle: "Publication Trend API",
    }),
  );

  app.use("/api/v1", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
