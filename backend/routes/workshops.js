/**
 * backend/routes/workshops.js
 *
 * Workshop Routes – SkillSphere
 * ==============================
 * All database access goes through backend/config/db.js.
 * All file handling goes through backend/config/storage.js.
 * Never import better-sqlite3 or multer directly.
 *
 * Mounted at: /api/workshops
 *
 * Public endpoints:
 *   GET  /                 – Paginated, searchable workshop list
 *   GET  /:id              – Workshop detail with instructor + stats
 *
 * Instructor-only endpoints (authenticate + authorize("instructor")):
 *   POST /                 – Create workshop (with optional image)
 *   PUT  /:id              – Update workshop (owner only, optional image replace)
 *   DELETE /:id            – Delete workshop (owner only, no active bookings)
 *   GET  /:id/students     – List booked students (owner only)
 */

"use strict";

const express = require("express");
const { v4: uuidv4 } = require("uuid");

const db      = require("../config/db");
const storage = require("../config/storage");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

// ─────────────────────────────────────────────────────────────────
//  Upload middleware (images only, 10 MB cap)
// ─────────────────────────────────────────────────────────────────
const upload = storage.getUploadMiddleware({
  maxSizeMB: 10,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
});

// ─────────────────────────────────────────────────────────────────
//  Helper utilities
// ─────────────────────────────────────────────────────────────────

/**
 * Map the API's "mode" string to the DB boolean integer.
 * "online"  → is_online = 1
 * "offline" → is_online = 0
 * @param {string} mode
 * @returns {number}
 */
function modeToIsOnline(mode) {
  return mode === "online" ? 1 : 0;
}

/**
 * Convert a DB row's is_online integer back to a mode string.
 * @param {number} isOnline
 * @returns {string}
 */
function isOnlineToMode(isOnline) {
  return isOnline === 1 ? "online" : "offline";
}

/**
 * Enrich a raw DB workshop row with computed / friendly fields.
 * Adds:  mode, image_url, avg_rating, review_count, remaining_seats
 *
 * @param {object} row – Raw DB row from the workshops table (may include joined cols)
 * @returns {object}
 */
function formatWorkshop(row) {
  const remaining = (row.max_seats || 0) - (row.booked_count || 0);
  return {
    id:             row.id,
    title:          row.title,
    description:    row.description,
    category:       row.category,
    skill_level:    row.skill_level,
    mode:           isOnlineToMode(row.is_online),
    price:          row.price,
    capacity:       row.max_seats,
    remaining_seats: remaining < 0 ? 0 : remaining,
    location:       row.location || null,
    status:         row.status,
    schedule:       row.scheduled_at || null,
    meet_link:      row.meet_link    || null,
    image_url:      storage.fileUrl(row.cover_url),
    cover_url:      row.cover_url    || null,
    avg_rating:     row.avg_rating   != null ? Number(Number(row.avg_rating).toFixed(1)) : null,
    review_count:   row.review_count || 0,
    instructor_id:  row.instructor_id,
    instructor_name:  row.instructor_name  || null,
    instructor_email: row.instructor_email || null,
    instructor_avatar:row.instructor_avatar
                      ? storage.fileUrl(row.instructor_avatar)
                      : null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Respond with a validation error.
 * @param {import("express").Response} res
 * @param {string} message
 */
function validationError(res, message) {
  return res.status(400).json({ success: false, message });
}

/**
 * Build the paginated workshops base query with all common JOINs.
 * Returns { sql, params, countSql, countParams }.
 *
 * @param {object} filters
 * @returns {{ sql: string, params: any[], countSql: string, countParams: any[] }}
 */
function buildListQuery(filters) {
  const {
    search,
    category,
    mode,
    minPrice,
    maxPrice,
    sort,
    offset,
    limit,
  } = filters;

  const WHERE  = [];
  const params = [];

  // Only show published workshops in the public listing
  WHERE.push("w.status = 'published'");

  if (search) {
    WHERE.push("(w.title LIKE ? OR w.description LIKE ? OR w.category LIKE ?)");
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  if (category) {
    WHERE.push("w.category = ?");
    params.push(category);
  }

  if (mode === "online" || mode === "offline") {
    WHERE.push("w.is_online = ?");
    params.push(modeToIsOnline(mode));
  }

  if (minPrice !== undefined && minPrice !== null && minPrice !== "") {
    const min = parseFloat(minPrice);
    if (!isNaN(min)) {
      WHERE.push("w.price >= ?");
      params.push(min);
    }
  }

  if (maxPrice !== undefined && maxPrice !== null && maxPrice !== "") {
    const max = parseFloat(maxPrice);
    if (!isNaN(max)) {
      WHERE.push("w.price <= ?");
      params.push(max);
    }
  }

  const whereClause = WHERE.length ? `WHERE ${WHERE.join(" AND ")}` : "";

  // Allowed sort columns (whitelist to prevent SQL injection)
  const SORT_MAP = {
    newest:    "w.created_at DESC",
    oldest:    "w.created_at ASC",
    price_asc: "w.price ASC",
    price_desc:"w.price DESC",
    rating:    "avg_rating DESC",
    title:     "w.title ASC",
  };
  const orderBy = SORT_MAP[sort] || "w.created_at DESC";

  const baseSql = `
    FROM workshops w
    JOIN users u ON u.id = w.instructor_id
    LEFT JOIN (
      SELECT workshop_id, COUNT(*) AS booked_count
      FROM bookings
      WHERE status IN ('confirmed', 'pending', 'attended')
      GROUP BY workshop_id
    ) b ON b.workshop_id = w.id
    LEFT JOIN (
      SELECT workshop_id,
             AVG(CAST(rating AS REAL)) AS avg_rating,
             COUNT(*) AS review_count
      FROM reviews
      GROUP BY workshop_id
    ) r ON r.workshop_id = w.id
    ${whereClause}
  `;

  const countSql    = `SELECT COUNT(*) AS total ${baseSql}`;
  const countParams = [...params];

  const sql = `
    SELECT
      w.*,
      u.name   AS instructor_name,
      u.email  AS instructor_email,
      u.avatar_url AS instructor_avatar,
      COALESCE(b.booked_count, 0) AS booked_count,
      r.avg_rating,
      COALESCE(r.review_count, 0) AS review_count
    ${baseSql}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `;
  params.push(limit, offset);

  return { sql, params, countSql, countParams };
}

// ═════════════════════════════════════════════════════════════════
//  GET /api/workshops
//  Public – paginated + filtered workshop listings
// ═════════════════════════════════════════════════════════════════
router.get("/", (req, res, next) => {
  try {
    const page     = Math.max(1, parseInt(req.query.page  || "1",  10));
    const limit    = Math.min(50, Math.max(1, parseInt(req.query.limit || "12", 10)));
    const offset   = (page - 1) * limit;

    const { sql, params, countSql, countParams } = buildListQuery({
      search:   req.query.search   || "",
      category: req.query.category || "",
      mode:     req.query.mode     || "",
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      sort:     req.query.sort     || "newest",
      offset,
      limit,
    });

    const totalRow = db.get(countSql, countParams);
    const total    = totalRow ? totalRow.total : 0;
    const rows     = db.all(sql, params);

    return res.json({
      success: true,
      data: {
        items: rows.map(formatWorkshop),
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ═════════════════════════════════════════════════════════════════
//  GET /api/workshops/:id
//  Public – full workshop detail with instructor info and stats
// ═════════════════════════════════════════════════════════════════
router.get("/:id", (req, res, next) => {
  try {
    const row = db.get(
      `SELECT
         w.*,
         u.name       AS instructor_name,
         u.email      AS instructor_email,
         u.avatar_url AS instructor_avatar,
         u.bio        AS instructor_bio,
         COALESCE(b.booked_count, 0) AS booked_count,
         r.avg_rating,
         COALESCE(r.review_count, 0) AS review_count
       FROM workshops w
       JOIN users u ON u.id = w.instructor_id
       LEFT JOIN (
         SELECT workshop_id, COUNT(*) AS booked_count
         FROM bookings
         WHERE status IN ('confirmed', 'pending', 'attended')
         GROUP BY workshop_id
       ) b ON b.workshop_id = w.id
       LEFT JOIN (
         SELECT workshop_id,
                AVG(CAST(rating AS REAL)) AS avg_rating,
                COUNT(*) AS review_count
         FROM reviews
         GROUP BY workshop_id
       ) r ON r.workshop_id = w.id
       WHERE w.id = ?`,
      [req.params.id]
    );

    if (!row) {
      return res.status(404).json({ success: false, message: "Workshop not found." });
    }

    return res.json({
      success: true,
      data: {
        ...formatWorkshop(row),
        instructor_bio: row.instructor_bio || null,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ═════════════════════════════════════════════════════════════════
//  POST /api/workshops
//  Instructor only – create a workshop (with optional cover image)
// ═════════════════════════════════════════════════════════════════
router.post(
  "/",
  authenticate(),
  authorize("instructor"),
  (req, res, next) => {
    // Run multer upload first, then validate
    upload.single("image")(req, res, (uploadErr) => {
      if (uploadErr) {
        return res.status(400).json({ success: false, message: uploadErr.message });
      }
      next();
    });
  },
  (req, res, next) => {
    try {
      const {
        title,
        description,
        category,
        skill_level,
        mode,
        price,
        capacity,
        schedule,
        meet_link,
        location,
        status,
      } = req.body;

      // ── Validation ────────────────────────────────────────────
      if (!title || !title.trim()) {
        if (req.file) storage.deleteFile(req.file.filename);
        return validationError(res, "Title is required.");
      }

      if (!category || !category.trim()) {
        if (req.file) storage.deleteFile(req.file.filename);
        return validationError(res, "Category is required.");
      }

      const validModes = ["online", "offline"];
      if (!mode || !validModes.includes(mode)) {
        if (req.file) storage.deleteFile(req.file.filename);
        return validationError(res, `Mode must be one of: ${validModes.join(", ")}.`);
      }

      const parsedPrice    = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        if (req.file) storage.deleteFile(req.file.filename);
        return validationError(res, "Price must be a number >= 0.");
      }

      const parsedCapacity = parseInt(capacity, 10);
      if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
        if (req.file) storage.deleteFile(req.file.filename);
        return validationError(res, "Capacity must be an integer > 0.");
      }

      const validSkillLevels = ["beginner", "intermediate", "advanced"];
      const normalizedLevel  = skill_level && validSkillLevels.includes(skill_level)
        ? skill_level
        : "beginner";

      const validStatuses = ["draft", "published"];
      const normalizedStatus = status && validStatuses.includes(status)
        ? status
        : "draft";

      const workshopId = uuidv4();
      const coverFilename = req.file ? req.file.filename : null;

      db.run(
        `INSERT INTO workshops
           (id, instructor_id, title, description, category, skill_level,
            price, max_seats, is_online, location, status, scheduled_at, meet_link, cover_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          workshopId,
          req.user.id,
          title.trim(),
          description ? description.trim() : null,
          category.trim(),
          normalizedLevel,
          parsedPrice,
          parsedCapacity,
          modeToIsOnline(mode),
          location ? location.trim() : null,
          normalizedStatus,
          schedule  ? schedule.trim()  : null,
          meet_link ? meet_link.trim() : null,
          coverFilename,
        ]
      );

      const created = db.get("SELECT * FROM workshops WHERE id = ?", [workshopId]);

      return res.status(201).json({
        success: true,
        message: "Workshop created successfully.",
        data: formatWorkshop({
          ...created,
          booked_count: 0,
          avg_rating: null,
          review_count: 0,
          instructor_name:  req.user.name,
          instructor_email: req.user.email,
          instructor_avatar: req.user.avatar_url || null,
        }),
      });
    } catch (err) {
      // Clean up uploaded file on unexpected error
      if (req.file) storage.deleteFile(req.file.filename);
      next(err);
    }
  }
);

// ═════════════════════════════════════════════════════════════════
//  PUT /api/workshops/:id
//  Instructor only, owner only – update workshop fields / image
// ═════════════════════════════════════════════════════════════════
router.put(
  "/:id",
  authenticate(),
  authorize("instructor"),
  (req, res, next) => {
    upload.single("image")(req, res, (uploadErr) => {
      if (uploadErr) {
        return res.status(400).json({ success: false, message: uploadErr.message });
      }
      next();
    });
  },
  (req, res, next) => {
    try {
      const workshop = db.get("SELECT * FROM workshops WHERE id = ?", [req.params.id]);

      if (!workshop) {
        if (req.file) storage.deleteFile(req.file.filename);
        return res.status(404).json({ success: false, message: "Workshop not found." });
      }

      if (workshop.instructor_id !== req.user.id) {
        if (req.file) storage.deleteFile(req.file.filename);
        return res.status(403).json({
          success: false,
          message: "Forbidden. You are not the owner of this workshop.",
        });
      }

      const {
        title,
        description,
        category,
        skill_level,
        mode,
        price,
        capacity,
        schedule,
        meet_link,
        location,
        status,
      } = req.body;

      // ── Field-level validation (only validate fields that are provided) ──
      if (title !== undefined && !title.trim()) {
        if (req.file) storage.deleteFile(req.file.filename);
        return validationError(res, "Title cannot be empty.");
      }

      let parsedPrice = workshop.price;
      if (price !== undefined) {
        parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
          if (req.file) storage.deleteFile(req.file.filename);
          return validationError(res, "Price must be a number >= 0.");
        }
      }

      let parsedCapacity = workshop.max_seats;
      if (capacity !== undefined) {
        parsedCapacity = parseInt(capacity, 10);
        if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
          if (req.file) storage.deleteFile(req.file.filename);
          return validationError(res, "Capacity must be an integer > 0.");
        }
      }

      const validModes = ["online", "offline"];
      if (mode !== undefined && !validModes.includes(mode)) {
        if (req.file) storage.deleteFile(req.file.filename);
        return validationError(res, `Mode must be one of: ${validModes.join(", ")}.`);
      }

      const validSkillLevels = ["beginner", "intermediate", "advanced"];
      if (skill_level !== undefined && !validSkillLevels.includes(skill_level)) {
        if (req.file) storage.deleteFile(req.file.filename);
        return validationError(res, `skill_level must be one of: ${validSkillLevels.join(", ")}.`);
      }

      const validStatuses = ["draft", "published", "cancelled", "completed"];
      if (status !== undefined && !validStatuses.includes(status)) {
        if (req.file) storage.deleteFile(req.file.filename);
        return validationError(res, `status must be one of: ${validStatuses.join(", ")}.`);
      }

      // ── Image handling ────────────────────────────────────────
      let newCoverFilename = workshop.cover_url;
      if (req.file) {
        // Delete the old image if one existed
        if (workshop.cover_url) {
          storage.deleteFile(workshop.cover_url);
        }
        newCoverFilename = req.file.filename;
      }

      // ── Merge with existing values (partial update) ───────────
      db.run(
        `UPDATE workshops SET
           title        = ?,
           description  = ?,
           category     = ?,
           skill_level  = ?,
           is_online    = ?,
           price        = ?,
           max_seats    = ?,
           location     = ?,
           status       = ?,
           scheduled_at = ?,
           meet_link    = ?,
           cover_url    = ?,
           updated_at   = datetime('now')
         WHERE id = ?`,
        [
          title        !== undefined ? title.trim()        : workshop.title,
          description  !== undefined ? (description ? description.trim() : null) : workshop.description,
          category     !== undefined ? category.trim()     : workshop.category,
          skill_level  !== undefined ? skill_level         : workshop.skill_level,
          mode         !== undefined ? modeToIsOnline(mode): workshop.is_online,
          parsedPrice,
          parsedCapacity,
          location     !== undefined ? (location ? location.trim() : null) : workshop.location,
          status       !== undefined ? status              : workshop.status,
          schedule     !== undefined ? (schedule ? schedule.trim() : null) : workshop.scheduled_at,
          meet_link    !== undefined ? (meet_link ? meet_link.trim() : null) : workshop.meet_link,
          newCoverFilename,
          req.params.id,
        ]
      );

      const updated = db.get(
        `SELECT w.*, u.name AS instructor_name, u.email AS instructor_email,
                u.avatar_url AS instructor_avatar,
                COALESCE(b.booked_count, 0) AS booked_count,
                r.avg_rating, COALESCE(r.review_count, 0) AS review_count
         FROM workshops w
         JOIN users u ON u.id = w.instructor_id
         LEFT JOIN (
           SELECT workshop_id, COUNT(*) AS booked_count FROM bookings
           WHERE status IN ('confirmed','pending','attended') GROUP BY workshop_id
         ) b ON b.workshop_id = w.id
         LEFT JOIN (
           SELECT workshop_id, AVG(CAST(rating AS REAL)) AS avg_rating, COUNT(*) AS review_count
           FROM reviews GROUP BY workshop_id
         ) r ON r.workshop_id = w.id
         WHERE w.id = ?`,
        [req.params.id]
      );

      return res.json({
        success: true,
        message: "Workshop updated successfully.",
        data: formatWorkshop(updated),
      });
    } catch (err) {
      if (req.file) storage.deleteFile(req.file.filename);
      next(err);
    }
  }
);

// ═════════════════════════════════════════════════════════════════
//  DELETE /api/workshops/:id
//  Instructor only, owner only – delete workshop + image
//  Blocked if active (non-cancelled) bookings exist
// ═════════════════════════════════════════════════════════════════
router.delete(
  "/:id",
  authenticate(),
  authorize("instructor"),
  (req, res, next) => {
    try {
      const workshop = db.get("SELECT * FROM workshops WHERE id = ?", [req.params.id]);

      if (!workshop) {
        return res.status(404).json({ success: false, message: "Workshop not found." });
      }

      if (workshop.instructor_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Forbidden. You are not the owner of this workshop.",
        });
      }

      // Check for active (non-cancelled) bookings
      const activeBooking = db.get(
        `SELECT id FROM bookings
         WHERE workshop_id = ? AND status NOT IN ('cancelled')
         LIMIT 1`,
        [req.params.id]
      );

      if (activeBooking) {
        return res.status(409).json({
          success: false,
          message:
            "Cannot delete workshop with active bookings. Cancel all bookings first.",
        });
      }

      // Delete the workshop (CASCADE removes bookings/reviews)
      db.run("DELETE FROM workshops WHERE id = ?", [req.params.id]);

      // Delete cover image from storage
      if (workshop.cover_url) {
        storage.deleteFile(workshop.cover_url);
      }

      return res.json({
        success: true,
        message: "Workshop deleted successfully.",
      });
    } catch (err) {
      next(err);
    }
  }
);

// ═════════════════════════════════════════════════════════════════
//  GET /api/workshops/:id/students
//  Instructor only, owner only – list all booked students
// ═════════════════════════════════════════════════════════════════
router.get(
  "/:id/students",
  authenticate(),
  authorize("instructor"),
  (req, res, next) => {
    try {
      const workshop = db.get(
        "SELECT id, instructor_id, title FROM workshops WHERE id = ?",
        [req.params.id]
      );

      if (!workshop) {
        return res.status(404).json({ success: false, message: "Workshop not found." });
      }

      if (workshop.instructor_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Forbidden. You are not the owner of this workshop.",
        });
      }

      const students = db.all(
        `SELECT
           u.id,
           u.name,
           u.email,
           b.status         AS booking_status,
           b.paid_amount,
           b.booked_at      AS booking_date,
           b.id             AS booking_id
         FROM bookings b
         JOIN users u ON u.id = b.student_id
         WHERE b.workshop_id = ?
         ORDER BY b.booked_at DESC`,
        [req.params.id]
      );

      return res.json({
        success: true,
        data: {
          workshop_id:   workshop.id,
          workshop_title: workshop.title,
          total: students.length,
          students,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
