/**
 * backend/services/notification.js
 * Notification creation helper with Socket.IO live emission
 */

"use strict";

const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");

let ioInstance = null;

function setIO(io) {
  ioInstance = io;
}

function createNotification({ userId, type, title, message, link = null }) {
  try {
    const id = uuidv4();
    db.run(
      `INSERT INTO notifications (id, user_id, type, title, message, link)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, userId, type, title, message, link]
    );

    const notification = db.get("SELECT * FROM notifications WHERE id = ?", [id]);

    if (ioInstance) {
      // Emit to user room
      ioInstance.to(`user:${userId}`).emit("notification", notification);
    }

    return notification;
  } catch (err) {
    console.error("[Notification Service] Error creating notification:", err);
    return null;
  }
}

module.exports = { setIO, createNotification };
