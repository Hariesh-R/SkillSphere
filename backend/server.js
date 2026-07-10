/**
 * backend/server.js
 *
 * Express Application Entry Point – SkillSphere
 * ===============================================
 * Startup sequence:
 *   1. Load environment variables (.env)
 *   2. Initialize the database (create tables / indexes)
 *   3. Configure Express (CORS, JSON parser, static files)
 *   4. Mount API routes
 *   5. 404 handler for unknown routes
 *   6. Global error handler
 *   7. Start HTTP listener
 */

"use strict";

// ── 1. Environment variables ──────────────────────────────────────
// Must be loaded BEFORE any other module that reads process.env.
require("dotenv").config();

const express = require("express");
const cors    = require("cors");
const path    = require("path");

// ── 2. Database initialization ────────────────────────────────────
const { initDatabase } = require("./db/init");

// ── 4. Route modules ──────────────────────────────────────────────
const authRoutes      = require("./routes/auth");
const workshopRoutes  = require("./routes/workshops");
const bookingRoutes   = require("./routes/bookings");
const reviewRoutes    = require("./routes/reviews");

// ─────────────────────────────────────────────────────────────────
//  App & Configuration
// ─────────────────────────────────────────────────────────────────

const app  = express();
const PORT = parseInt(process.env.PORT || "5000", 10);

// ── 3a. CORS ──────────────────────────────────────────────────────
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));

// ── 3b. Body parsers ──────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── 3c. Static file serving for uploads ──────────────────────────
// Serves files from /backend/uploads at the /uploads URL path.
const uploadsDir = path.resolve(
  process.env.UPLOADS_DIR || path.join(__dirname, "uploads")
);
app.use("/uploads", express.static(uploadsDir));

// ─────────────────────────────────────────────────────────────────
//  Health-check endpoint (unauthenticated)
// ─────────────────────────────────────────────────────────────────
const db      = require("./config/db");
const storage = require("./config/storage");

app.get("/api/health", (_req, res) => {
  const dbHealth      = db.healthCheck();
  const storageHealth = storage.healthCheck();
  const allOk         = dbHealth.ok && storageHealth.ok;

  return res.status(allOk ? 200 : 503).json({
    status:  allOk ? "healthy" : "degraded",
    version: process.env.npm_package_version || "1.0.0",
    db:      dbHealth,
    storage: storageHealth,
  });
});

// ── 4. API routes ─────────────────────────────────────────────────
app.use("/api/auth",                           authRoutes);
app.use("/api/workshops",                      workshopRoutes);
app.use("/api/bookings",                       bookingRoutes);
app.use("/api/workshops/:workshopId/reviews",  reviewRoutes);

// ─────────────────────────────────────────────────────────────────
//  404 – Unknown Route Handler
// ─────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─────────────────────────────────────────────────────────────────
//  Global Error Handler
//  Express identifies this as an error handler because it has 4 params.
// ─────────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Log the full error internally – never leak stack traces to the client.
  console.error(`[Error] ${req.method} ${req.originalUrl}`, err);

  // Multer file-type / size errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ success: false, message: "File is too large." });
  }

  // JWT errors that somehow escape the middleware
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }

  // Generic server error – hide internal details in production.
  const isDev = process.env.NODE_ENV === "development";
  return res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error.",
    ...(isDev && { stack: err.stack }),
  });
});

// ─────────────────────────────────────────────────────────────────
//  Startup
// ─────────────────────────────────────────────────────────────────
function start() {
  try {
    // Initialize database tables / indexes before accepting traffic.
    initDatabase();
  } catch (err) {
    console.error("[Startup] Database initialization failed:", err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log("╔══════════════════════════════════════════════╗");
    console.log("║          SkillSphere API Server              ║");
    console.log("╠══════════════════════════════════════════════╣");
    console.log(`║  Listening on  → http://localhost:${PORT}       ║`);
    console.log(`║  Environment   → ${(process.env.NODE_ENV || "development").padEnd(26)}║`);
    console.log(`║  DB Driver     → ${(process.env.DB_DRIVER || "sqlite").padEnd(26)}║`);
    console.log(`║  Storage       → ${(process.env.STORAGE_DRIVER || "local").padEnd(26)}║`);
    console.log("╚══════════════════════════════════════════════╝");
  });
}

start();

module.exports = app; // exported for testing
