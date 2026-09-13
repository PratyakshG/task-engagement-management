import cors from "cors";
import express from "express";

import { prisma } from "./lib/prisma.js";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";

export const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL ?? "http://localhost:3000",
  }),
);

app.use(express.json());

/**
 * Health check
 */
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

/**
 * Database health check
 */
app.get("/api/db/status", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return res.json({
      status: "connected",
    });
  } catch {
    return res.status(503).json({
      status: "unavailable",
    });
  }
});

/**
 * API routes
 */
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);

/**
 * 404 handler
 */
app.use((_req, res) => {
  return res.status(404).json({
    error: "Route not found",
  });
});

/**
 * Global error handler
 */
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);

    return res.status(500).json({
      error: "An unexpected server error occurred.",
    });
  },
);