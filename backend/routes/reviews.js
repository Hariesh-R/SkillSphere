/**
 * backend/routes/reviews.js
 *
 * Review Routes – SkillSphere
 * ============================
 * All database access goes through backend/config/db.js.
 * Never import better-sqlite3 directly.
 *
 * These routes are sub-resources of workshops, so they are mounted at:
 *   /api/workshops/:workshopId/reviews
 *
 * The router uses mergeParams: true so that req.params.workshopId is available.
 *
 * Endpoints:
 *   POST /api/workshops/:workshopId/reviews  – Submit a review (student, must be booked)
 *   GET  /api/workshops/:workshopId/reviews  – Public list of reviews for a workshop
 */

"use strict";

const express = require("express");
const { v4: uuidv4 } = require("uuid");

const db = require("../config/db");
const { authenticate, authorize } = require("../middleware/auth");

// mergeParams allows access to :workshopId from the parent router mount
const router = express.Router({ mergeParams: true });

// ═════════════════════════════════════════════════════════════════
//  POST /api/workshops/:workshopId/reviews
//  Student only – submit a review for a workshop
//
//  Guards:
//    1. Workshop must exist
//    2. Student must have a confirmed/attended booking for this workshop
//    3. Student may only submit one review per workshop
//    4. Rating must be an integer between 1 and 5
// ═════════════════════════════════════════════════════════════════
router.post(
  "/",
  authenticate(),
  authorize("student"),
  (req, res, next) => {
    try {
      const { workshopId } = req.params;
      const { rating, comment } = req.body || {};

      // ── Validation ────────────────────────────────────────────
      const parsedRating = parseInt(rating, 10);
      if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be an integer between 1 and 5.",
        });
      }

      // ── 1. Workshop must exist ────────────────────────────────
      const workshop = db.get(
        "SELECT id, title FROM workshops WHERE id = ?",
        [workshopId]
      );

      if (!workshop) {
        return res.status(404).json({
          success: false,
          message: "Workshop not found.",
        });
      }

      // ── 2. Student must have a valid booking ──────────────────
      const booking = db.get(
        `SELECT id FROM bookings
         WHERE workshop_id = ? AND student_id = ?
           AND status IN ('confirmed', 'attended')`,
        [workshopId, req.user.id]
      );

      if (!booking) {
        return res.status(403).json({
          success: false,
          message: "You can only review workshops you have booked.",
        });
      }

      // ── 3. One review per student per workshop ────────────────
      const existingReview = db.get(
        "SELECT id FROM reviews WHERE workshop_id = ? AND reviewer_id = ?",
        [workshopId, req.user.id]
      );

      if (existingReview) {
        return res.status(409).json({
          success: false,
          message: "You have already submitted a review for this workshop.",
        });
      }

      // ── 4. Persist the review ─────────────────────────────────
      const reviewId = uuidv4();

      db.run(
        `INSERT INTO reviews (id, workshop_id, reviewer_id, rating, comment)
         VALUES (?, ?, ?, ?, ?)`,
        [
          reviewId,
          workshopId,
          req.user.id,
          parsedRating,
          comment ? comment.trim() : null,
        ]
      );

      // ── 5. Fetch the created review with reviewer name ────────
      const review = db.get(
        `SELECT
           r.id,
           r.rating,
           r.comment,
           r.created_at,
           u.name AS reviewer_name
         FROM reviews r
         JOIN users u ON u.id = r.reviewer_id
         WHERE r.id = ?`,
        [reviewId]
      );

      return res.status(201).json({
        success: true,
        message: "Review submitted successfully.",
        data: review,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ═════════════════════════════════════════════════════════════════
//  GET /api/workshops/:workshopId/reviews
//  Public – list all reviews for a workshop (newest first)
// ═════════════════════════════════════════════════════════════════
router.get("/", (req, res, next) => {
  try {
    const { workshopId } = req.params;

    // Confirm the workshop exists first
    const workshop = db.get(
      "SELECT id, title FROM workshops WHERE id = ?",
      [workshopId]
    );

    if (!workshop) {
      return res.status(404).json({
        success: false,
        message: "Workshop not found.",
      });
    }

    const reviews = db.all(
      `SELECT
         r.id,
         r.rating,
         r.comment,
         r.created_at,
         u.name AS student_name
       FROM reviews r
       JOIN users u ON u.id = r.reviewer_id
       WHERE r.workshop_id = ?
       ORDER BY r.created_at DESC`,
      [workshopId]
    );

    // Compute aggregate stats inline (avoids a second query round-trip)
    const total    = reviews.length;
    const avg      = total
      ? Number(
          (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1)
        )
      : null;

    return res.json({
      success: true,
      data: {
        workshop_id:    workshopId,
        workshop_title: workshop.title,
        total,
        avg_rating:     avg,
        reviews,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
