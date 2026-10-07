/**
 * backend/routes/freelance.js
 * Freelancing Marketplace API Endpoints
 */

"use strict";

const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const { authenticate } = require("../middleware/auth");
const { createNotification } = require("../services/notification");

const router = express.Router();

/**
 * GET /api/freelance/projects
 * Browse & search freelance projects with filters, sorting, pagination
 */
router.get("/projects", (req, res, next) => {
  try {
    const {
      search,
      skill,
      category,
      status = "OPEN",
      min_budget,
      max_budget,
      budget_type,
      sort_by = "newest", // newest, budget_asc, budget_desc, deadline
      page = 1,
      limit = 10
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    let whereClauses = [];
    let params = [];

    if (status && status !== "ALL") {
      whereClauses.push("p.status = ?");
      params.push(status);
    }

    if (search) {
      whereClauses.push("(p.title LIKE ? OR p.description LIKE ?)");
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    if (category && category !== "ALL") {
      whereClauses.push("p.category = ?");
      params.push(category);
    }

    if (budget_type && budget_type !== "ALL") {
      whereClauses.push("p.budget_type = ?");
      params.push(budget_type);
    }

    if (skill) {
      whereClauses.push("p.skills_required LIKE ?");
      params.push(`%${skill.trim()}%`);
    }

    if (min_budget) {
      whereClauses.push("p.min_budget >= ?");
      params.push(parseFloat(min_budget));
    }

    if (max_budget) {
      whereClauses.push("(p.max_budget IS NULL OR p.max_budget <= ?)");
      params.push(parseFloat(max_budget));
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

    let orderBy = "ORDER BY p.created_at DESC";
    if (sort_by === "budget_asc") orderBy = "ORDER BY p.min_budget ASC";
    if (sort_by === "budget_desc") orderBy = "ORDER BY p.min_budget DESC";
    if (sort_by === "deadline") orderBy = "ORDER BY p.deadline ASC";

    // Count query
    const countRow = db.get(
      `SELECT COUNT(*) as total FROM freelance_projects p ${whereSql}`,
      params
    );
    const total = countRow ? countRow.total : 0;

    // Data query
    const projects = db.all(
      `SELECT p.*,
              u.name as client_name,
              u.avatar_url as client_avatar,
              (SELECT COUNT(*) FROM proposals pr WHERE pr.project_id = p.id) as proposals_count
       FROM freelance_projects p
       JOIN users u ON p.client_id = u.id
       ${whereSql}
       ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    return res.status(200).json({
      success: true,
      data: {
        projects,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/freelance/projects
 * Post a new freelance project
 */
router.post("/projects", authenticate(), (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      budget_type = "fixed",
      min_budget,
      max_budget,
      currency = "INR",
      deadline,
      estimated_duration,
      experience_level = "intermediate",
      skills_required,
      attachments
    } = req.body || {};

    const errors = [];
    if (!title || typeof title !== "string" || title.trim().length < 5) {
      errors.push("Title must be at least 5 characters long.");
    }
    if (!description || typeof description !== "string" || description.trim().length < 20) {
      errors.push("Detailed description must be at least 20 characters long.");
    }
    if (!category) errors.push("Category is required.");

    const parsedMin = parseFloat(min_budget);
    if (isNaN(parsedMin) || parsedMin < 0) {
      errors.push("Minimum budget must be a non-negative number.");
    }

    let parsedMax = null;
    if (max_budget !== undefined && max_budget !== null && max_budget !== "") {
      parsedMax = parseFloat(max_budget);
      if (isNaN(parsedMax) || parsedMax < parsedMin) {
        errors.push("Maximum budget must be greater than or equal to minimum budget.");
      }
    }

    if (errors.length) {
      return res.status(400).json({ success: false, message: errors[0], errors });
    }

    const id = uuidv4();
    const skillsStr = Array.isArray(skills_required) ? JSON.stringify(skills_required) : (skills_required || "");
    const attachStr = Array.isArray(attachments) ? JSON.stringify(attachments) : (attachments || "");

    db.run(
      `INSERT INTO freelance_projects (
        id, client_id, title, description, category, budget_type,
        min_budget, max_budget, currency, deadline, estimated_duration,
        experience_level, status, skills_required, attachments
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?, ?)`,
      [
        id,
        req.user.id,
        title.trim(),
        description.trim(),
        category.trim(),
        budget_type,
        parsedMin,
        parsedMax,
        currency,
        deadline || null,
        estimated_duration || null,
        experience_level,
        skillsStr,
        attachStr
      ]
    );

    const project = db.get("SELECT * FROM freelance_projects WHERE id = ?", [id]);

    return res.status(201).json({
      success: true,
      message: "Freelance project posted successfully.",
      data: { project }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/freelance/projects/:id
 * Detailed project page with owner info and proposal status
 */
router.get("/projects/:id", (req, res, next) => {
  try {
    const project = db.get(
      `SELECT p.*,
              u.name as client_name,
              u.email as client_email,
              u.avatar_url as client_avatar,
              u.rating_avg as client_rating,
              f.name as freelancer_name,
              (SELECT COUNT(*) FROM proposals pr WHERE pr.project_id = p.id) as proposals_count
       FROM freelance_projects p
       JOIN users u ON p.client_id = u.id
       LEFT JOIN users f ON p.freelancer_id = f.id
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    // Submissions if project in progress / completed
    const submissions = db.all(
      `SELECT s.*, u.name as freelancer_name
       FROM project_submissions s
       JOIN users u ON s.freelancer_id = u.id
       WHERE s.project_id = ?
       ORDER BY s.created_at DESC`,
      [project.id]
    );

    // Reviews if completed
    const reviews = db.all(
      `SELECT r.*, u.name as reviewer_name
       FROM freelance_reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.project_id = ?`,
      [project.id]
    );

    return res.status(200).json({
      success: true,
      data: {
        project,
        submissions,
        reviews
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/freelance/projects/:id
 * Edit client project
 */
router.put("/projects/:id", authenticate(), (req, res, next) => {
  try {
    const project = db.get("SELECT * FROM freelance_projects WHERE id = ?", [req.params.id]);

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    if (project.client_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden. You can only edit your own projects." });
    }

    if (project.status === "COMPLETED" || project.status === "CANCELLED") {
      return res.status(400).json({ success: false, message: `Cannot edit project in ${project.status} state.` });
    }

    const {
      title,
      description,
      category,
      budget_type,
      min_budget,
      max_budget,
      deadline,
      estimated_duration,
      experience_level,
      skills_required
    } = req.body || {};

    const updatedTitle = title !== undefined ? title.trim() : project.title;
    const updatedDesc = description !== undefined ? description.trim() : project.description;
    const updatedCategory = category !== undefined ? category : project.category;
    const updatedBudgetType = budget_type !== undefined ? budget_type : project.budget_type;
    const updatedMin = min_budget !== undefined ? parseFloat(min_budget) : project.min_budget;
    const updatedMax = max_budget !== undefined ? (max_budget ? parseFloat(max_budget) : null) : project.max_budget;
    const updatedSkills = skills_required !== undefined ? (Array.isArray(skills_required) ? JSON.stringify(skills_required) : skills_required) : project.skills_required;

    db.run(
      `UPDATE freelance_projects
       SET title = ?, description = ?, category = ?, budget_type = ?,
           min_budget = ?, max_budget = ?, deadline = ?, estimated_duration = ?,
           experience_level = ?, skills_required = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [
        updatedTitle,
        updatedDesc,
        updatedCategory,
        updatedBudgetType,
        updatedMin,
        updatedMax,
        deadline !== undefined ? deadline : project.deadline,
        estimated_duration !== undefined ? estimated_duration : project.estimated_duration,
        experience_level !== undefined ? experience_level : project.experience_level,
        updatedSkills,
        req.params.id
      ]
    );

    const updated = db.get("SELECT * FROM freelance_projects WHERE id = ?", [req.params.id]);

    return res.status(200).json({
      success: true,
      message: "Project updated successfully.",
      data: { project: updated }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/freelance/projects/:id
 * Delete or cancel project
 */
router.delete("/projects/:id", authenticate(), (req, res, next) => {
  try {
    const project = db.get("SELECT * FROM freelance_projects WHERE id = ?", [req.params.id]);

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    if (project.client_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden. You do not own this project." });
    }

    if (project.status === "IN_PROGRESS" || project.status === "SUBMITTED") {
      return res.status(400).json({ success: false, message: "Active in-progress projects cannot be deleted. Cancel instead or complete with freelancer." });
    }

    db.run("DELETE FROM freelance_projects WHERE id = ?", [req.params.id]);

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully."
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/freelance/projects/:id/proposals
 * Submit proposal to open project
 */
router.post("/projects/:id/proposals", authenticate(), (req, res, next) => {
  try {
    const project = db.get("SELECT * FROM freelance_projects WHERE id = ?", [req.params.id]);

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    if (project.client_id === req.user.id) {
      return res.status(400).json({ success: false, message: "You cannot submit a proposal to your own project." });
    }

    if (project.status !== "OPEN") {
      return res.status(400).json({ success: false, message: "Proposals can only be submitted to OPEN projects." });
    }

    if (project.deadline && new Date(project.deadline) < new Date()) {
      return res.status(400).json({ success: false, message: "The application deadline for this project has passed." });
    }

    // Check duplicate active proposal
    const existing = db.get(
      "SELECT id FROM proposals WHERE project_id = ? AND freelancer_id = ?",
      [project.id, req.user.id]
    );

    if (existing) {
      return res.status(400).json({ success: false, message: "You have already submitted a proposal for this project." });
    }

    const { cover_letter, proposed_price, estimated_delivery_time, portfolio_items } = req.body || {};

    if (!cover_letter || typeof cover_letter !== "string" || cover_letter.trim().length < 20) {
      return res.status(400).json({ success: false, message: "Cover letter must be at least 20 characters long." });
    }

    const priceNum = parseFloat(proposed_price);
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ success: false, message: "Proposed price must be a valid positive number." });
    }

    if (!estimated_delivery_time) {
      return res.status(400).json({ success: false, message: "Estimated delivery time is required." });
    }

    const propId = uuidv4();
    const portStr = Array.isArray(portfolio_items) ? JSON.stringify(portfolio_items) : (portfolio_items || "");

    db.run(
      `INSERT INTO proposals (
        id, project_id, freelancer_id, cover_letter, proposed_price,
        estimated_delivery_time, portfolio_items, status
       ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      [
        propId,
        project.id,
        req.user.id,
        cover_letter.trim(),
        priceNum,
        estimated_delivery_time,
        portStr
      ]
    );

    const proposal = db.get("SELECT * FROM proposals WHERE id = ?", [propId]);

    // Notify client
    createNotification({
      userId: project.client_id,
      type: "new_proposal",
      title: "New Project Proposal",
      message: `${req.user.name} submitted a proposal for "${project.title}".`,
      link: `/freelance/my-projects`
    });

    return res.status(201).json({
      success: true,
      message: "Proposal submitted successfully.",
      data: { proposal }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/freelance/proposals/my
 * View freelancer's submitted proposals
 */
router.get("/proposals/my", authenticate(), (req, res, next) => {
  try {
    const proposals = db.all(
      `SELECT pr.*,
              p.title as project_title,
              p.category as project_category,
              p.status as project_status,
              p.currency as project_currency,
              u.name as client_name
       FROM proposals pr
       JOIN freelance_projects p ON pr.project_id = p.id
       JOIN users u ON p.client_id = u.id
       WHERE pr.freelancer_id = ?
       ORDER BY pr.created_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({ success: true, data: { proposals } });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/freelance/projects/:id/proposals
 * Client views proposals for their project
 */
router.get("/projects/:id/proposals", authenticate(), (req, res, next) => {
  try {
    const project = db.get("SELECT * FROM freelance_projects WHERE id = ?", [req.params.id]);

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    if (project.client_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden. Only project owners can view all proposals." });
    }

    const proposals = db.all(
      `SELECT pr.*,
              f.name as freelancer_name,
              f.avatar_url as freelancer_avatar,
              f.bio as freelancer_bio,
              f.skills as freelancer_skills,
              f.rating_avg as freelancer_rating,
              f.rating_count as freelancer_rating_count,
              f.completed_projects_count as freelancer_completed_count
       FROM proposals pr
       JOIN users f ON pr.freelancer_id = f.id
       WHERE pr.project_id = ?
       ORDER BY pr.created_at DESC`,
      [project.id]
    );

    return res.status(200).json({ success: true, data: { proposals } });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/freelance/proposals/:id/accept
 * Accept proposal & hire freelancer (Transaction safety)
 */
router.patch("/proposals/:id/accept", authenticate(), (req, res, next) => {
  try {
    const proposal = db.get("SELECT * FROM proposals WHERE id = ?", [req.params.id]);

    if (!proposal) {
      return res.status(404).json({ success: false, message: "Proposal not found." });
    }

    const project = db.get("SELECT * FROM freelance_projects WHERE id = ?", [proposal.project_id]);

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    if (project.client_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden. You can only hire for your own projects." });
    }

    if (project.status !== "OPEN") {
      return res.status(400).json({ success: false, message: `Cannot hire for a project in ${project.status} status.` });
    }

    if (proposal.status !== "PENDING") {
      return res.status(400).json({ success: false, message: "Proposal is no longer pending." });
    }

    // Execute atomic transaction for hiring
    let convId;
    db.transaction(() => {
      // 1. Accept this proposal
      db.run(
        "UPDATE proposals SET status = 'ACCEPTED', updated_at = datetime('now') WHERE id = ?",
        [proposal.id]
      );

      // 2. Reject other pending proposals
      db.run(
        "UPDATE proposals SET status = 'REJECTED', updated_at = datetime('now') WHERE project_id = ? AND id != ?",
        [project.id, proposal.id]
      );

      // 3. Assign freelancer & set status IN_PROGRESS
      db.run(
        "UPDATE freelance_projects SET freelancer_id = ?, status = 'IN_PROGRESS', updated_at = datetime('now') WHERE id = ?",
        [proposal.freelancer_id, project.id]
      );

      // 4. Create or fetch conversation
      let conv = db.get(
        "SELECT id FROM conversations WHERE project_id = ? AND type = 'project'",
        [project.id]
      );

      if (!conv) {
        convId = uuidv4();
        db.run(
          "INSERT INTO conversations (id, project_id, type, title) VALUES (?, ?, 'project', ?)",
          [convId, project.id, `Project: ${project.title}`]
        );
        db.run(
          "INSERT INTO conversation_participants (id, conversation_id, user_id) VALUES (?, ?, ?), (?, ?, ?)",
          [uuidv4(), convId, req.user.id, uuidv4(), convId, proposal.freelancer_id]
        );
      } else {
        convId = conv.id;
      }
    });

    // Notify hired freelancer
    createNotification({
      userId: proposal.freelancer_id,
      type: "proposal_accepted",
      title: "Proposal Accepted!",
      message: `Your proposal for "${project.title}" has been accepted! You can now start working and message the client.`,
      link: `/messages`
    });

    // Notify rejected applicants
    const rejectedProps = db.all(
      "SELECT freelancer_id FROM proposals WHERE project_id = ? AND id != ?",
      [project.id, proposal.id]
    );

    for (const r of rejectedProps) {
      createNotification({
        userId: r.freelancer_id,
        type: "proposal_rejected",
        title: "Proposal Status Update",
        message: `Another proposal was selected for "${project.title}".`,
        link: `/freelance/my-proposals`
      });
    }

    return res.status(200).json({
      success: true,
      message: "Proposal accepted! Freelancer hired successfully.",
      data: { conversation_id: convId }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/freelance/proposals/:id/reject
 */
router.patch("/proposals/:id/reject", authenticate(), (req, res, next) => {
  try {
    const proposal = db.get("SELECT * FROM proposals WHERE id = ?", [req.params.id]);

    if (!proposal) {
      return res.status(404).json({ success: false, message: "Proposal not found." });
    }

    const project = db.get("SELECT * FROM freelance_projects WHERE id = ?", [proposal.project_id]);

    if (project.client_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden. You can only manage proposals for your projects." });
    }

    db.run("UPDATE proposals SET status = 'REJECTED', updated_at = datetime('now') WHERE id = ?", [proposal.id]);

    createNotification({
      userId: proposal.freelancer_id,
      type: "proposal_rejected",
      title: "Proposal Declined",
      message: `Your proposal for "${project.title}" was declined.`,
      link: `/freelance/my-proposals`
    });

    return res.status(200).json({ success: true, message: "Proposal rejected." });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/freelance/projects/:id/submissions
 * Hired freelancer submits work
 */
router.post("/projects/:id/submissions", authenticate(), (req, res, next) => {
  try {
    const project = db.get("SELECT * FROM freelance_projects WHERE id = ?", [req.params.id]);

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    if (project.freelancer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden. Only the assigned freelancer can submit work." });
    }

    if (project.status !== "IN_PROGRESS" && project.status !== "SUBMITTED") {
      return res.status(400).json({ success: false, message: `Cannot submit work when project status is ${project.status}.` });
    }

    const { description, attachments } = req.body || {};

    if (!description || typeof description !== "string" || description.trim().length < 10) {
      return res.status(400).json({ success: false, message: "Submission description must be at least 10 characters long." });
    }

    const subId = uuidv4();
    const attachStr = Array.isArray(attachments) ? JSON.stringify(attachments) : (attachments || "");

    db.transaction(() => {
      db.run(
        `INSERT INTO project_submissions (id, project_id, freelancer_id, description, attachments, status)
         VALUES (?, ?, ?, ?, ?, 'SUBMITTED')`,
        [subId, project.id, req.user.id, description.trim(), attachStr]
      );

      db.run(
        "UPDATE freelance_projects SET status = 'SUBMITTED', updated_at = datetime('now') WHERE id = ?",
        [project.id]
      );
    });

    const submission = db.get("SELECT * FROM project_submissions WHERE id = ?", [subId]);

    createNotification({
      userId: project.client_id,
      type: "work_submitted",
      title: "Work Submitted for Review",
      message: `${req.user.name} submitted work for "${project.title}".`,
      link: `/freelance/my-projects`
    });

    return res.status(201).json({
      success: true,
      message: "Work submitted successfully for client review.",
      data: { submission }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/freelance/projects/:id/complete
 * Client approves work & completes project or requests revision
 */
router.patch("/projects/:id/complete", authenticate(), (req, res, next) => {
  try {
    const project = db.get("SELECT * FROM freelance_projects WHERE id = ?", [req.params.id]);

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    if (project.client_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden. Only the project owner can approve completion." });
    }

    if (project.status !== "SUBMITTED" && project.status !== "IN_PROGRESS") {
      return res.status(400).json({ success: false, message: `Cannot update completion state for project in ${project.status} status.` });
    }

    const { action = "ACCEPT", feedback } = req.body || {};

    if (action === "REVISION") {
      if (!feedback || typeof feedback !== "string" || feedback.trim().length < 5) {
        return res.status(400).json({ success: false, message: "Please provide detailed revision feedback." });
      }

      db.transaction(() => {
        db.run(
          "UPDATE freelance_projects SET status = 'IN_PROGRESS', updated_at = datetime('now') WHERE id = ?",
          [project.id]
        );
        db.run(
          `UPDATE project_submissions SET status = 'REVISION_REQUESTED', feedback = ?, updated_at = datetime('now')
           WHERE project_id = ? AND status = 'SUBMITTED'`,
          [feedback.trim(), project.id]
        );
      });

      createNotification({
        userId: project.freelancer_id,
        type: "revision_requested",
        title: "Revision Requested",
        message: `Client requested revisions for "${project.title}": ${feedback.trim()}`,
        link: `/freelance/my-proposals`
      });

      return res.status(200).json({
        success: true,
        message: "Revision request submitted to freelancer."
      });
    }

    // Default action ACCEPT
    db.transaction(() => {
      db.run(
        "UPDATE freelance_projects SET status = 'COMPLETED', updated_at = datetime('now') WHERE id = ?",
        [project.id]
      );
      db.run(
        "UPDATE project_submissions SET status = 'ACCEPTED', updated_at = datetime('now') WHERE project_id = ?",
        [project.id]
      );
      db.run(
        "UPDATE users SET completed_projects_count = completed_projects_count + 1 WHERE id IN (?, ?)",
        [project.client_id, project.freelancer_id]
      );
    });

    createNotification({
      userId: project.freelancer_id,
      type: "project_completed",
      title: "Project Completed!",
      message: `Work for "${project.title}" has been accepted. Project completed!`,
      link: `/freelance/my-proposals`
    });

    return res.status(200).json({
      success: true,
      message: "Project marked as completed successfully."
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/freelance/projects/:id/reviews
 * Submit review for completed project
 */
router.post("/projects/:id/reviews", authenticate(), (req, res, next) => {
  try {
    const project = db.get("SELECT * FROM freelance_projects WHERE id = ?", [req.params.id]);

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    if (project.status !== "COMPLETED") {
      return res.status(400).json({ success: false, message: "Reviews can only be submitted for COMPLETED projects." });
    }

    const isClient = project.client_id === req.user.id;
    const isFreelancer = project.freelancer_id === req.user.id;

    if (!isClient && !isFreelancer) {
      return res.status(403).json({ success: false, message: "Forbidden. Only participants of this project can submit a review." });
    }

    const revieweeId = isClient ? project.freelancer_id : project.client_id;
    const { rating, comment } = req.body || {};

    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ success: false, message: "Rating must be an integer between 1 and 5." });
    }

    const revId = uuidv4();

    db.transaction(() => {
      db.run(
        `INSERT INTO freelance_reviews (id, project_id, reviewer_id, reviewee_id, rating, comment)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [revId, project.id, req.user.id, revieweeId, ratingNum, comment ? comment.trim() : null]
      );

      // Recalculate rating avg for reviewee
      const stats = db.get(
        `SELECT COUNT(*) as count, AVG(rating) as avg_rating FROM freelance_reviews WHERE reviewee_id = ?`,
        [revieweeId]
      );

      db.run(
        "UPDATE users SET rating_avg = ?, rating_count = ? WHERE id = ?",
        [stats ? Math.round(stats.avg_rating * 10) / 10 : ratingNum, stats ? stats.count : 1, revieweeId]
      );
    });

    const review = db.get("SELECT * FROM freelance_reviews WHERE id = ?", [revId]);

    createNotification({
      userId: revieweeId,
      type: "new_review",
      title: "New Review Received",
      message: `${req.user.name} left you a ${ratingNum}-star review for "${project.title}".`,
      link: `/profile`
    });

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully.",
      data: { review }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
