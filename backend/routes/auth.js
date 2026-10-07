/**
 * backend/routes/auth.js
 *
 * Authentication Routes – SkillSphere
 * =====================================
 * Implements the MVC pattern:
 *   Route  → inline controller logic (thin layer)  → db.js abstraction
 *
 * Endpoints:
 *   POST /api/auth/register  – Create a new account
 *   POST /api/auth/login     – Authenticate and receive a JWT
 *   GET  /api/auth/me        – Return the authenticated user's profile
 *
 * Rules:
 *   - Never import better-sqlite3 directly.
 *   - All DB calls go through backend/config/db.js.
 *   - Passwords are never returned in responses.
 */

"use strict";

const express  = require("express");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const db = require("../config/db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// ─────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────

const SALT_ROUNDS = 12;

/**
 * Sign a JWT for the given user.
 * The token subject (`sub`) is the user's UUID.
 *
 * @param {{ id: string, role: string }} user
 * @returns {string} signed JWT
 */
function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

/**
 * Strip the password field from a user row before sending it to the client.
 *
 * @param {object} user – Raw DB row
 * @returns {object}    – Safe user object
 */
function sanitizeUser(user) {
  const { password: _omit, ...safe } = user;
  return safe;
}

/**
 * Validate registration input.
 * Returns an array of error messages (empty = valid).
 *
 * @param {{ name, email, password, role }} body
 * @returns {string[]}
 */
function validateRegisterInput({ name, email, password, role }) {
  const errors = [];

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    errors.push("Name must be at least 2 characters.");
  }
  if (name && name.trim().length > 100) {
    errors.push("Name must not exceed 100 characters.");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    errors.push("A valid email address is required.");
  }

  if (!password || password.length < 8) {
    errors.push("Password must be at least 8 characters.");
  }
  if (password && password.length > 128) {
    errors.push("Password must not exceed 128 characters.");
  }

  const allowedRoles = ["student", "instructor"];
  if (role && !allowedRoles.includes(role)) {
    errors.push(`Role must be one of: ${allowedRoles.join(", ")}.`);
  }

  return errors;
}

/**
 * Validate login input.
 * @param {{ email, password }} body
 * @returns {string[]}
 */
function validateLoginInput({ email, password }) {
  const errors = [];
  if (!email || typeof email !== "string") errors.push("Email is required.");
  if (!password || typeof password !== "string") errors.push("Password is required.");
  return errors;
}

// ─────────────────────────────────────────────────────────────────
//  POST /api/auth/register
// ─────────────────────────────────────────────────────────────────

/**
 * Register a new user.
 *
 * Body (JSON):
 *   { name, email, password, role? }   role defaults to "student"
 *
 * Responses:
 *   201 – { success, message, data: { user, token } }
 *   400 – Validation errors or duplicate email
 *   500 – Unexpected server error
 */
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, role = "student" } = req.body || {};

    // ── Input validation ─────────────────────────────────────────
    const errors = validateRegisterInput({ name, email, password, role });
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors[0], errors });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ── Duplicate email check ────────────────────────────────────
    const existing = db.get("SELECT id FROM users WHERE email = ?", [
      normalizedEmail,
    ]);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // ── Hash password ────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // ── Persist user ─────────────────────────────────────────────
    const id = uuidv4();
    db.run(
      `INSERT INTO users (id, name, email, password, role)
       VALUES (?, ?, ?, ?, ?)`,
      [id, name.trim(), normalizedEmail, hashedPassword, role]
    );

    // Fetch the newly created row (avoids returning stale local data)
    const user = db.get("SELECT * FROM users WHERE id = ?", [id]);

    const token = signToken(user);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      data: { user: sanitizeUser(user), token },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────
//  POST /api/auth/login
// ─────────────────────────────────────────────────────────────────

/**
 * Authenticate a user and return a JWT.
 *
 * Body (JSON):
 *   { email, password }
 *
 * Responses:
 *   200 – { success, message, data: { user, token } }
 *   400 – Missing / invalid input
 *   401 – Invalid credentials
 *   500 – Unexpected server error
 */
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    // ── Input validation ─────────────────────────────────────────
    const errors = validateLoginInput({ email, password });
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors[0], errors });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ── Lookup user ───────────────────────────────────────────────
    const user = db.get("SELECT * FROM users WHERE email = ?", [
      normalizedEmail,
    ]);

    // Use a constant-time comparison even when the user doesn't exist.
    // This prevents timing attacks that could be used to enumerate emails.
    const dummyHash =
      "$2a$12$invalidhashusedtopreventimingtattack0000000000000000000";
    const passwordToCheck = user ? user.password : dummyHash;

    const isMatch = await bcrypt.compare(password, passwordToCheck);

    if (!user || !isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = signToken(user);

    return res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      data: { user: sanitizeUser(user), token },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────
//  GET /api/auth/me
// ─────────────────────────────────────────────────────────────────

/**
 * Return the currently authenticated user's profile.
 * Requires a valid Bearer token.
 *
 * Responses:
 *   200 – { success, data: { user } }
 *   401 – Missing or invalid token (handled by authenticate middleware)
 */
router.get("/me", authenticate(), (req, res) => {
  // Fetch fresh full user profile including portfolio items count
  const fullUser = db.get("SELECT * FROM users WHERE id = ?", [req.user.id]);
  return res.status(200).json({
    success: true,
    data: { user: sanitizeUser(fullUser) },
  });
});

/**
 * Update the authenticated user's profile.
 * PUT /api/auth/me
 */
router.put("/me", authenticate(), (req, res, next) => {
  try {
    const {
      name,
      bio,
      skills,
      expertise,
      education,
      github_url,
      linkedin_url,
      website_url,
      avatar_url
    } = req.body || {};

    if (name !== undefined && (!name || typeof name !== "string" || name.trim().length < 2)) {
      return res.status(400).json({ success: false, message: "Name must be at least 2 characters." });
    }

    const current = db.get("SELECT * FROM users WHERE id = ?", [req.user.id]);

    const updatedName = name !== undefined ? name.trim() : current.name;
    const updatedBio = bio !== undefined ? bio : current.bio;
    const updatedSkills = skills !== undefined ? (Array.isArray(skills) ? JSON.stringify(skills) : skills) : current.skills;
    const updatedExpertise = expertise !== undefined ? expertise : current.expertise;
    const updatedEducation = education !== undefined ? education : current.education;
    const updatedGithub = github_url !== undefined ? github_url : current.github_url;
    const updatedLinkedin = linkedin_url !== undefined ? linkedin_url : current.linkedin_url;
    const updatedWebsite = website_url !== undefined ? website_url : current.website_url;
    const updatedAvatar = avatar_url !== undefined ? avatar_url : current.avatar_url;

    db.run(
      `UPDATE users
       SET name = ?, bio = ?, skills = ?, expertise = ?, education = ?,
           github_url = ?, linkedin_url = ?, website_url = ?, avatar_url = ?,
           updated_at = datetime('now')
       WHERE id = ?`,
      [
        updatedName,
        updatedBio,
        updatedSkills,
        updatedExpertise,
        updatedEducation,
        updatedGithub,
        updatedLinkedin,
        updatedWebsite,
        updatedAvatar,
        req.user.id
      ]
    );

    const user = db.get("SELECT * FROM users WHERE id = ?", [req.user.id]);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: { user: sanitizeUser(user) }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
