/**
 * backend/routes/messaging.js
 * Conversations and Real-time Messaging REST APIs
 */

"use strict";

const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const { authenticate } = require("../middleware/auth");
const { createNotification } = require("../services/notification");

const router = express.Router();

let ioInstance = null;
function setIO(io) {
  ioInstance = io;
}

// GET /api/conversations - List conversations for authenticated user
router.get("/conversations", authenticate(), (req, res, next) => {
  try {
    const convs = db.all(
      `SELECT c.*,
              (SELECT m.text FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
              (SELECT m.created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_at,
              (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_id != ? AND m.is_read = 0) as unread_count
       FROM conversations c
       JOIN conversation_participants cp ON c.id = cp.conversation_id
       WHERE cp.user_id = ?
       ORDER BY COALESCE(last_message_at, c.created_at) DESC`,
      [req.user.id, req.user.id]
    );

    // Attach participants details to each conversation
    const result = convs.map((conv) => {
      const participants = db.all(
        `SELECT u.id, u.name, u.email, u.avatar_url, u.role
         FROM conversation_participants cp
         JOIN users u ON cp.user_id = u.id
         WHERE cp.conversation_id = ?`,
        [conv.id]
      );
      return { ...conv, participants };
    });

    return res.status(200).json({ success: true, data: { conversations: result } });
  } catch (err) {
    next(err);
  }
});

// POST /api/conversations/direct - Get or create a direct conversation
router.post("/conversations/direct", authenticate(), (req, res, next) => {
  try {
    const { target_user_id } = req.body || {};

    if (!target_user_id || target_user_id === req.user.id) {
      return res.status(400).json({ success: false, message: "Invalid target user." });
    }

    const targetUser = db.get("SELECT id, name FROM users WHERE id = ?", [target_user_id]);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "Target user not found." });
    }

    // Check if direct conversation already exists between these 2 users
    const existing = db.get(
      `SELECT c.id
       FROM conversations c
       JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = ?
       JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id = ?
       WHERE c.type = 'direct'`,
      [req.user.id, target_user_id]
    );

    if (existing) {
      return res.status(200).json({ success: true, data: { conversation_id: existing.id } });
    }

    // Create new direct conversation
    const convId = uuidv4();
    db.transaction(() => {
      db.run(
        "INSERT INTO conversations (id, type, title) VALUES (?, 'direct', ?)",
        [convId, `Chat with ${targetUser.name}`]
      );
      db.run(
        "INSERT INTO conversation_participants (id, conversation_id, user_id) VALUES (?, ?, ?), (?, ?, ?)",
        [uuidv4(), convId, req.user.id, uuidv4(), convId, target_user_id]
      );
    });

    return res.status(201).json({ success: true, data: { conversation_id: convId } });
  } catch (err) {
    next(err);
  }
});

// GET /api/conversations/:id/messages - Fetch message history
router.get("/conversations/:id/messages", authenticate(), (req, res, next) => {
  try {
    const part = db.get(
      "SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );

    if (!part) {
      return res.status(403).json({ success: false, message: "Forbidden. You are not a participant in this conversation." });
    }

    const messages = db.all(
      `SELECT m.*, u.name as sender_name, u.avatar_url as sender_avatar
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at ASC`,
      [req.params.id]
    );

    // Mark unread messages sent to req.user.id as read
    db.run(
      "UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ?",
      [req.params.id, req.user.id]
    );

    return res.status(200).json({ success: true, data: { messages } });
  } catch (err) {
    next(err);
  }
});

// POST /api/conversations/:id/messages - Send a message
router.post("/conversations/:id/messages", authenticate(), (req, res, next) => {
  try {
    const { text, attachments } = req.body || {};

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Message text cannot be empty." });
    }

    if (text.length > 5000) {
      return res.status(400).json({ success: false, message: "Message exceeds maximum length of 5000 characters." });
    }

    const part = db.get(
      "SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );

    if (!part) {
      return res.status(403).json({ success: false, message: "Forbidden. You are not a participant in this conversation." });
    }

    const msgId = uuidv4();
    const attachStr = Array.isArray(attachments) ? JSON.stringify(attachments) : (attachments || null);

    db.transaction(() => {
      db.run(
        `INSERT INTO messages (id, conversation_id, sender_id, text, attachments)
         VALUES (?, ?, ?, ?, ?)`,
        [msgId, req.params.id, req.user.id, text.trim(), attachStr]
      );

      db.run(
        "UPDATE conversations SET updated_at = datetime('now') WHERE id = ?",
        [req.params.id]
      );
    });

    const message = db.get(
      `SELECT m.*, u.name as sender_name, u.avatar_url as sender_avatar
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.id = ?`,
      [msgId]
    );

    // Emit live via socket
    if (ioInstance) {
      ioInstance.to(`conversation:${req.params.id}`).emit("new_message", message);
    }

    // Notify other participants
    const otherParts = db.all(
      "SELECT user_id FROM conversation_participants WHERE conversation_id = ? AND user_id != ?",
      [req.params.id, req.user.id]
    );

    for (const p of otherParts) {
      createNotification({
        userId: p.user_id,
        type: "new_message",
        title: `New message from ${req.user.name}`,
        message: text.length > 60 ? text.slice(0, 57) + "..." : text,
        link: `/messages`
      });
    }

    return res.status(201).json({ success: true, data: { message } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/conversations/:id/read - Mark conversation read
router.patch("/conversations/:id/read", authenticate(), (req, res, next) => {
  try {
    db.run(
      "UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ?",
      [req.params.id, req.user.id]
    );
    return res.status(200).json({ success: true, message: "Conversation marked read." });
  } catch (err) {
    next(err);
  }
});

module.exports = { router, setIO };
