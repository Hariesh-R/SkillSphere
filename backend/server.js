/**
 * backend/server.js
 *
 * Express Application & Socket.IO Entry Point – SkillSphere
 * =========================================================
 */

"use strict";

require("dotenv").config();

const express = require("express");
const http    = require("http");
const cors    = require("cors");
const path    = require("path");
const jwt     = require("jsonwebtoken");
const { Server } = require("socket.io");

// ── 2. Database initialization ────────────────────────────────────
const db               = require("./config/db");
const storage          = require("./config/storage");
const { initDatabase } = require("./db/init");

// ── 3. Notification & Messaging Services ──────────────────────────
const { setIO: setNotificationIO } = require("./services/notification");
const { router: messagingRoutes, setIO: setMessagingIO } = require("./routes/messaging");

// ── 4. Route modules ──────────────────────────────────────────────
const authRoutes          = require("./routes/auth");
const userRoutes          = require("./routes/users");
const workshopRoutes      = require("./routes/workshops");
const bookingRoutes       = require("./routes/bookings");
const reviewRoutes        = require("./routes/reviews");
const freelanceRoutes     = require("./routes/freelance");
const notificationRoutes  = require("./routes/notifications");
const teamRoutes          = require("./routes/teams");

const app  = express();
const PORT = parseInt(process.env.PORT || "5000", 10);
const server = http.createServer(app);

// ── 3a. CORS Configuration ────────────────────────────────────────
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));

// ── 3b. Socket.IO Initialization ──────────────────────────────────
const io = new Server(server, {
  cors: corsOptions,
});

setNotificationIO(io);
setMessagingIO(io);

// Socket.IO JWT Authentication Middleware
io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.get("SELECT id, name, email, role FROM users WHERE id = ?", [payload.sub]);

    if (!user) {
      return next(new Error("Authentication error: User no longer exists"));
    }

    socket.user = user;
    next();
  } catch (err) {
    return next(new Error("Authentication error: Invalid or expired token"));
  }
});

io.on("connection", (socket) => {
  console.log(`[Socket] Client connected: ${socket.user.name} (${socket.id})`);

  // Automatically join personal user room for targeted notifications
  socket.join(`user:${socket.user.id}`);

  // Join a room for a specific conversation
  socket.on("join_conversation", (conversationId) => {
    // Verify membership
    const part = db.get(
      "SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?",
      [conversationId, socket.user.id]
    );

    if (part) {
      socket.join(`conversation:${conversationId}`);
      console.log(`[Socket] User ${socket.user.name} joined conversation:${conversationId}`);
    }
  });

  socket.on("leave_conversation", (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
  });

  socket.on("disconnect", () => {
    console.log(`[Socket] Client disconnected: ${socket.user.name}`);
  });
});

// ── Body parsers ──────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Static uploads serving ───────────────────────────────────────
const uploadsDir = path.resolve(process.env.UPLOADS_DIR || path.join(__dirname, "uploads"));
app.use("/uploads", express.static(uploadsDir));

// ── Health Check Endpoint ─────────────────────────────────────────
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

// ── Mount API Routes ──────────────────────────────────────────────
app.use("/api/auth",                           authRoutes);
app.use("/api/users",                          userRoutes);
app.use("/api/workshops",                      workshopRoutes);
app.use("/api/bookings",                       bookingRoutes);
app.use("/api/workshops/:workshopId/reviews",  reviewRoutes);
app.use("/api/freelance",                      freelanceRoutes);
app.use("/api/messaging",                      messagingRoutes);
app.use("/api/notifications",                  notificationRoutes);
app.use("/api/teams",                          teamRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SkillSphere Backend API is running 🚀"
  });
});

// ── 404 Handler ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ── Global Error Handler ──────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.originalUrl}`, err);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ success: false, message: "File is too large." });
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }

  const isDev = process.env.NODE_ENV === "development";
  return res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error.",
    ...(isDev && { stack: err.stack }),
  });
});

// ── Startup routine ───────────────────────────────────────────────
function start() {
  try {
    initDatabase();
  } catch (err) {
    console.error("[Startup] Database initialization failed:", err.message);
    process.exit(1);
  }

  server.listen(PORT, () => {
    console.log("╔══════════════════════════════════════════════╗");
    console.log("║          SkillSphere API Server              ║");
    console.log("╠══════════════════════════════════════════════╣");
    console.log(`║  Listening on  → http://localhost:${PORT}       ║`);
    console.log(`║  Environment   → ${(process.env.NODE_ENV || "development").padEnd(26)}║`);
    console.log(`║  DB Driver     → ${(process.env.DB_DRIVER || "sqlite").padEnd(26)}║`);
    console.log("╚══════════════════════════════════════════════╝");
  });
}

start();

module.exports = server;
