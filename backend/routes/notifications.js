/**
 * backend/routes/notifications.js
 * Notifications API Endpoints
 */

"use strict";

const express = require("express");
const db = require("../config/db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// GET /api/notifications - List user's notifications
router.get("/", authenticate(), (req, res, next) => {
  try {
    const notifications = db.all(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
      [req.user.id]
    );

    const unreadCountRow = db.get(
      "SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = 0",
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        unread_count: unreadCountRow ? unreadCountRow.unread_count : 0
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/notifications/unread-count
router.get("/unread-count", authenticate(), (req, res, next) => {
  try {
    const row = db.get(
      "SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = 0",
      [req.user.id]
    );
    return res.status(200).json({
      success: true,
      data: { unread_count: row ? row.unread_count : 0 }
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/:id/read - Mark single notification as read
router.patch("/:id/read", authenticate(), (req, res, next) => {
  try {
    const notif = db.get("SELECT * FROM notifications WHERE id = ?", [req.params.id]);

    if (!notif) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }

    if (notif.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden." });
    }

    db.run("UPDATE notifications SET is_read = 1 WHERE id = ?", [req.params.id]);

    return res.status(200).json({ success: true, message: "Notification marked read." });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/read-all - Mark all notifications as read
router.patch("/read-all", authenticate(), (req, res, next) => {
  try {
    db.run("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [req.user.id]);
    return res.status(200).json({ success: true, message: "All notifications marked read." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
