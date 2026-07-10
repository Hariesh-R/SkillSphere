/**
 * backend/middleware/auth.js
 *
 * Authentication & Authorization Middleware – SkillSphere
 * =========================================================
 * Exports two middleware factories:
 *
 *   authenticate()   – Verify JWT, attach req.user, pass to next handler.
 *   authorize(...roles) – Guard a route to specific roles only.
 *
 * Usage in routes:
 *   const { authenticate, authorize } = require("../middleware/auth");
 *
 *   router.get("/me",             authenticate(), meController);
 *   router.post("/workshop",      authenticate(), authorize("instructor"), createWorkshop);
 *   router.delete("/workshop/:id",authenticate(), authorize("instructor","admin"), deleteWorkshop);
 */

"use strict";

const jwt = require("jsonwebtoken");
const db  = require("../config/db");

// ─────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Extract the Bearer token from the Authorization header.
 * @param {import("express").Request} req
 * @returns {string|null}
 */
function _extractToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────
//  authenticate()
// ─────────────────────────────────────────────────────────────────

/**
 * Middleware: verify the JWT and attach the authenticated user to req.user.
 *
 * On success:   calls next()  with req.user = { id, name, email, role }
 * On failure:   responds 401 Unauthorized
 *
 * @returns {import("express").RequestHandler}
 */
function authenticate() {
  return function (req, res, next) {
    const token = _extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      const message =
        err.name === "TokenExpiredError"
          ? "Token has expired. Please log in again."
          : "Invalid token. Please log in again.";
      return res.status(401).json({ success: false, message });
    }

    // Re-fetch the user from the database on every request.
    // This ensures that deleted / role-changed users are rejected immediately
    // without waiting for the token to expire.
    const user = db.get(
      "SELECT id, name, email, role, avatar_url FROM users WHERE id = ?",
      [payload.sub]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists.",
      });
    }

    // Attach to request so downstream handlers can read it without another DB hit.
    req.user = user;
    next();
  };
}

// ─────────────────────────────────────────────────────────────────
//  authorize(...roles)
// ─────────────────────────────────────────────────────────────────

/**
 * Middleware: restrict a route to one or more roles.
 * Must be used AFTER authenticate() in the middleware chain.
 *
 * @param {...string} roles – Allowed roles (e.g. "instructor", "student").
 * @returns {import("express").RequestHandler}
 */
function authorize(...roles) {
  return function (req, res, next) {
    if (!req.user) {
      // Defensive: authenticate() should always run first.
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access forbidden. Required role: ${roles.join(" or ")}.`,
      });
    }

    next();
  };
}

module.exports = { authenticate, authorize };
