/**
 * backend/routes/bookings.js
 *
 * Booking Routes – SkillSphere
 * ==============================
 * All database access goes through backend/config/db.js.
 * All file URLs go through backend/config/storage.js.
 * Never import better-sqlite3 or multer directly.
 *
 * Mounted at: /api/bookings
 *
 * Student-only endpoints:
 *   POST   /            – Book a workshop (transactional, enforces capacity + uniqueness)
 *   GET    /my          – List the authenticated student's bookings
 *   DELETE /:id         – Cancel a booking (owner only, transactional)
 */

"use strict";

const express = require("express");
const { v4: uuidv4 } = require("uuid");

const db      = require("../config/db");
const storage = require("../config/storage");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

// ─────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Format a raw booking+workshop DB row into a clean API response object.
 * @param {object} row
 * @returns {object}
 */
function formatBooking(row) {
  return {
    booking_id:      row.booking_id,
    status:          row.booking_status,
    paid_amount:     row.paid_amount,
    booking_date:    row.booked_at,
    workshop: {
      id:            row.workshop_id,
      title:         row.title,
      category:      row.category,
      mode:          row.is_online === 1 ? "online" : "offline",
      price:         row.price,
      schedule:      row.scheduled_at || null,
      image_url:     storage.fileUrl(row.cover_url),
      status:        row.workshop_status,
    },
    instructor: {
      id:            row.instructor_id,
      name:          row.instructor_name,
      email:         row.instructor_email,
    },
  };
}

// ═════════════════════════════════════════════════════════════════
//  POST /api/bookings
//  Student only – book a workshop
//
//  Guards (all inside a single transaction):
//    1. Workshop must exist
//    2. Workshop must be published
//    3. Student cannot book the same workshop twice
//    4. Remaining seats > 0
// ═════════════════════════════════════════════════════════════════
router.post(
  "/",
  authenticate(),
  authorize("student"),
  (req, res, next) => {
    try {
      const { workshop_id } = req.body || {};

      if (!workshop_id || typeof workshop_id !== "string") {
        return res.status(400).json({
          success: false,
          message: "workshop_id is required.",
        });
      }

      let result;

      db.transaction(() => {
        // ── 1. Workshop must exist ──────────────────────────────
        const workshop = db.get(
          "SELECT * FROM workshops WHERE id = ?",
          [workshop_id]
        );

        if (!workshop) {
          // Throw so the transaction rolls back and we can respond 404
          const err = new Error("Workshop not found.");
          err.status = 404;
          throw err;
        }

        // ── 2. Workshop must be published ───────────────────────
        if (workshop.status !== "published") {
          const err = new Error("This workshop is not currently available for booking.");
          err.status = 400;
          throw err;
        }

        // ── 3. No duplicate bookings ────────────────────────────
        const existing = db.get(
          `SELECT id FROM bookings
           WHERE workshop_id = ? AND student_id = ? AND status != 'cancelled'`,
          [workshop_id, req.user.id]
        );

        if (existing) {
          const err = new Error("You have already booked this workshop.");
          err.status = 409;
          throw err;
        }

        // ── 4. Capacity check ───────────────────────────────────
        const { booked_count } = db.get(
          `SELECT COUNT(*) AS booked_count FROM bookings
           WHERE workshop_id = ? AND status IN ('confirmed', 'pending', 'attended')`,
          [workshop_id]
        );

        const remaining = workshop.max_seats - booked_count;

        if (remaining <= 0) {
          const err = new Error("Sorry, this workshop is fully booked.");
          err.status = 409;
          throw err;
        }

        // ── 5. Create booking ───────────────────────────────────
        const bookingId = uuidv4();

        db.run(
          `INSERT INTO bookings (id, workshop_id, student_id, status, paid_amount)
           VALUES (?, ?, ?, 'confirmed', ?)`,
          [bookingId, workshop_id, req.user.id, workshop.price]
        );

        result = {
          booking_id:      bookingId,
          workshop_id:     workshop.id,
          workshop_title:  workshop.title,
          status:          "confirmed",
          paid_amount:     workshop.price,
          remaining_seats: remaining - 1,
        };
      });

      return res.status(201).json({
        success: true,
        message: "Workshop booked successfully.",
        data: result,
      });
    } catch (err) {
      // Surface transaction errors as proper HTTP responses
      if (err.status) {
        return res.status(err.status).json({ success: false, message: err.message });
      }
      next(err);
    }
  }
);

// ═════════════════════════════════════════════════════════════════
//  GET /api/bookings/my
//  Student only – list all bookings for the authenticated student
// ═════════════════════════════════════════════════════════════════
router.get(
  "/my",
  authenticate(),
  authorize("student"),
  (req, res, next) => {
    try {
      const rows = db.all(
        `SELECT
           b.id            AS booking_id,
           b.status        AS booking_status,
           b.paid_amount,
           b.booked_at,
           w.id            AS workshop_id,
           w.title,
           w.category,
           w.is_online,
           w.price,
           w.scheduled_at,
           w.cover_url,
           w.status        AS workshop_status,
           u.id            AS instructor_id,
           u.name          AS instructor_name,
           u.email         AS instructor_email
         FROM bookings b
         JOIN workshops w ON w.id = b.workshop_id
         JOIN users     u ON u.id = w.instructor_id
         WHERE b.student_id = ?
         ORDER BY b.booked_at DESC`,
        [req.user.id]
      );

      return res.json({
        success: true,
        data: {
          total:    rows.length,
          bookings: rows.map(formatBooking),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ═════════════════════════════════════════════════════════════════
//  DELETE /api/bookings/:id
//  Student only, booking owner only – cancel a booking
//  Uses a transaction so the capacity slot is released atomically.
// ═════════════════════════════════════════════════════════════════
router.delete(
  "/:id",
  authenticate(),
  authorize("student"),
  (req, res, next) => {
    try {
      db.transaction(() => {
        const booking = db.get(
          "SELECT * FROM bookings WHERE id = ?",
          [req.params.id]
        );

        if (!booking) {
          const err = new Error("Booking not found.");
          err.status = 404;
          throw err;
        }

        // Only the booking owner may cancel
        if (booking.student_id !== req.user.id) {
          const err = new Error("Forbidden. You do not own this booking.");
          err.status = 403;
          throw err;
        }

        // Already cancelled
        if (booking.status === "cancelled") {
          const err = new Error("This booking is already cancelled.");
          err.status = 400;
          throw err;
        }

        // Update booking status to cancelled
        db.run(
          `UPDATE bookings SET status = 'cancelled', updated_at = datetime('now')
           WHERE id = ?`,
          [booking.id]
        );
      });

      return res.json({
        success: true,
        message: "Booking cancelled successfully.",
      });
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({ success: false, message: err.message });
      }
      next(err);
    }
  }
);

module.exports = router;
