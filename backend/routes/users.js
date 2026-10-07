/**
 * backend/routes/users.js
 * User public profiles and portfolio items CRUD
 */

"use strict";

const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

function sanitizePublicUser(user) {
  if (!user) return null;
  const { password: _p, ...safe } = user;
  return safe;
}

// GET /api/users/:id - Public profile with portfolio and completed projects
router.get("/:id", (req, res, next) => {
  try {
    const user = db.get("SELECT * FROM users WHERE id = ?", [req.params.id]);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const portfolio = db.all("SELECT * FROM portfolio_items WHERE user_id = ? ORDER BY created_at DESC", [user.id]);
    const completedProjects = db.all(
      `SELECT id, title, category, budget_type, min_budget, max_budget, currency, status, updated_at
       FROM freelance_projects
       WHERE (freelancer_id = ? OR client_id = ?) AND status = 'COMPLETED'
       ORDER BY updated_at DESC`,
      [user.id, user.id]
    );

    const reviews = db.all(
      `SELECT r.*, u.name as reviewer_name, u.avatar_url as reviewer_avatar
       FROM freelance_reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.reviewee_id = ?
       ORDER BY r.created_at DESC`,
      [user.id]
    );

    return res.status(200).json({
      success: true,
      data: {
        user: sanitizePublicUser(user),
        portfolio,
        completedProjects,
        reviews,
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id/portfolio
router.get("/:id/portfolio", (req, res, next) => {
  try {
    const portfolio = db.all(
      "SELECT * FROM portfolio_items WHERE user_id = ? ORDER BY created_at DESC",
      [req.params.id]
    );
    return res.status(200).json({ success: true, data: { portfolio } });
  } catch (err) {
    next(err);
  }
});

// POST /api/users/portfolio - Create portfolio item
router.post("/portfolio", authenticate(), (req, res, next) => {
  try {
    const { title, description, technologies, project_url, github_url, image_url } = req.body || {};

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Portfolio title is required." });
    }

    const id = uuidv4();
    db.run(
      `INSERT INTO portfolio_items (id, user_id, title, description, technologies, project_url, github_url, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        req.user.id,
        title.trim(),
        description || null,
        technologies || null,
        project_url || null,
        github_url || null,
        image_url || null
      ]
    );

    const item = db.get("SELECT * FROM portfolio_items WHERE id = ?", [id]);

    return res.status(201).json({
      success: true,
      message: "Portfolio item added successfully.",
      data: { item }
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/portfolio/:id - Edit portfolio item
router.put("/portfolio/:id", authenticate(), (req, res, next) => {
  try {
    const item = db.get("SELECT * FROM portfolio_items WHERE id = ?", [req.params.id]);

    if (!item) {
      return res.status(404).json({ success: false, message: "Portfolio item not found." });
    }

    if (item.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden. You can only edit your own portfolio items." });
    }

    const { title, description, technologies, project_url, github_url, image_url } = req.body || {};

    if (title !== undefined && (!title || typeof title !== "string" || title.trim().length === 0)) {
      return res.status(400).json({ success: false, message: "Title cannot be empty." });
    }

    db.run(
      `UPDATE portfolio_items
       SET title = ?, description = ?, technologies = ?, project_url = ?, github_url = ?, image_url = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [
        title !== undefined ? title.trim() : item.title,
        description !== undefined ? description : item.description,
        technologies !== undefined ? technologies : item.technologies,
        project_url !== undefined ? project_url : item.project_url,
        github_url !== undefined ? github_url : item.github_url,
        image_url !== undefined ? image_url : item.image_url,
        req.params.id
      ]
    );

    const updated = db.get("SELECT * FROM portfolio_items WHERE id = ?", [req.params.id]);

    return res.status(200).json({
      success: true,
      message: "Portfolio item updated.",
      data: { item: updated }
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/portfolio/:id - Delete portfolio item
router.delete("/portfolio/:id", authenticate(), (req, res, next) => {
  try {
    const item = db.get("SELECT * FROM portfolio_items WHERE id = ?", [req.params.id]);

    if (!item) {
      return res.status(404).json({ success: false, message: "Portfolio item not found." });
    }

    if (item.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden. You can only delete your own portfolio items." });
    }

    db.run("DELETE FROM portfolio_items WHERE id = ?", [req.params.id]);

    return res.status(200).json({
      success: true,
      message: "Portfolio item deleted."
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
