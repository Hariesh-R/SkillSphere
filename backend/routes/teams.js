/**
 * backend/routes/teams.js
 * Team Finder & Collaborative Projects API Endpoints
 */

"use strict";

const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const { authenticate } = require("../middleware/auth");
const { createNotification } = require("../services/notification");

const router = express.Router();

/**
 * GET /api/teams
 * Browse & search team projects
 */
router.get("/", (req, res, next) => {
  try {
    const {
      search,
      category,
      skill,
      status = "RECRUITING",
      page = 1,
      limit = 10
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    let whereClauses = [];
    let params = [];

    if (status && status !== "ALL") {
      whereClauses.push("t.status = ?");
      params.push(status);
    }

    if (search) {
      whereClauses.push("(t.title LIKE ? OR t.description LIKE ? OR t.goals LIKE ?)");
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (category && category !== "ALL") {
      whereClauses.push("t.category = ?");
      params.push(category);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const countRow = db.get(`SELECT COUNT(*) as total FROM team_projects t ${whereSql}`, params);
    const total = countRow ? countRow.total : 0;

    const teams = db.all(
      `SELECT t.*,
              u.name as owner_name,
              u.avatar_url as owner_avatar,
              (SELECT COUNT(*) FROM team_members tm WHERE tm.team_project_id = t.id) as current_member_count
       FROM team_projects t
       JOIN users u ON t.owner_id = u.id
       ${whereSql}
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    // Attach open roles to each team
    const result = teams.map((team) => {
      const openRoles = db.all(
        "SELECT * FROM team_roles WHERE team_project_id = ? AND is_open = 1",
        [team.id]
      );

      // Filter by skill if requested
      if (skill) {
        const matchesSkill = openRoles.some(r => r.required_skills && r.required_skills.toLowerCase().includes(skill.toLowerCase()));
        if (!matchesSkill && !team.description.toLowerCase().includes(skill.toLowerCase())) {
          return null;
        }
      }

      return { ...team, open_roles: openRoles };
    }).filter(Boolean);

    return res.status(200).json({
      success: true,
      data: {
        teams: result,
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
 * GET /api/teams/my-teams
 * Dashboard for teams user owns or is a member of
 */
router.get("/my-teams", authenticate(), (req, res, next) => {
  try {
    const teams = db.all(
      `SELECT DISTINCT t.*,
              u.name as owner_name,
              u.avatar_url as owner_avatar,
              (SELECT COUNT(*) FROM team_members tm WHERE tm.team_project_id = t.id) as current_member_count
       FROM team_projects t
       JOIN users u ON t.owner_id = u.id
       LEFT JOIN team_members tm ON t.id = tm.team_project_id
       WHERE t.owner_id = ? OR tm.user_id = ?
       ORDER BY t.updated_at DESC`,
      [req.user.id, req.user.id]
    );

    const result = teams.map((team) => {
      const roles = db.all("SELECT * FROM team_roles WHERE team_project_id = ?", [team.id]);
      const members = db.all(
        `SELECT tm.*, u.name, u.email, u.avatar_url
         FROM team_members tm
         JOIN users u ON tm.user_id = u.id
         WHERE tm.team_project_id = ?`,
        [team.id]
      );
      return { ...team, roles, members, is_owner: team.owner_id === req.user.id };
    });

    return res.status(200).json({ success: true, data: { teams: result } });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/teams/my-applications
 * List user's submitted team applications
 */
router.get("/my-applications", authenticate(), (req, res, next) => {
  try {
    const applications = db.all(
      `SELECT ta.*,
              t.title as team_title,
              t.category as team_category,
              t.status as team_status,
              r.role_name,
              u.name as owner_name
       FROM team_applications ta
       JOIN team_projects t ON ta.team_project_id = t.id
       JOIN team_roles r ON ta.role_id = r.id
       JOIN users u ON t.owner_id = u.id
       WHERE ta.applicant_id = ?
       ORDER BY ta.created_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({ success: true, data: { applications } });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/teams
 * Create team project with initial recruitment roles
 */
router.post("/", authenticate(), (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      goals,
      github_url,
      member_limit = 5,
      roles = []
    } = req.body || {};

    const errors = [];
    if (!title || typeof title !== "string" || title.trim().length < 5) {
      errors.push("Title must be at least 5 characters long.");
    }
    if (!description || typeof description !== "string" || description.trim().length < 20) {
      errors.push("Description must be at least 20 characters long.");
    }
    if (!category) errors.push("Category is required.");

    const limitNum = parseInt(member_limit, 10);
    if (isNaN(limitNum) || limitNum < 2) {
      errors.push("Team member limit must be at least 2.");
    }

    if (errors.length) {
      return res.status(400).json({ success: false, message: errors[0], errors });
    }

    const teamId = uuidv4();

    db.transaction(() => {
      db.run(
        `INSERT INTO team_projects (id, owner_id, title, description, category, goals, github_url, member_limit, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'RECRUITING')`,
        [teamId, req.user.id, title.trim(), description.trim(), category.trim(), goals || null, github_url || null, limitNum]
      );

      // Add owner as Lead member
      db.run(
        `INSERT INTO team_members (id, team_project_id, user_id, role_name)
         VALUES (?, ?, ?, 'Project Owner / Lead')`,
        [uuidv4(), teamId, req.user.id]
      );

      // Insert roles
      if (Array.isArray(roles)) {
        for (const r of roles) {
          if (r.role_name && r.role_name.trim()) {
            const roleId = uuidv4();
            const slots = parseInt(r.slots_total, 10) || 1;
            const skillsStr = Array.isArray(r.required_skills) ? JSON.stringify(r.required_skills) : (r.required_skills || null);

            db.run(
              `INSERT INTO team_roles (id, team_project_id, role_name, description, required_skills, slots_total, slots_filled, is_open)
               VALUES (?, ?, ?, ?, ?, ?, 0, 1)`,
              [roleId, teamId, r.role_name.trim(), r.description || null, skillsStr, slots]
            );
          }
        }
      }
    });

    const team = db.get("SELECT * FROM team_projects WHERE id = ?", [teamId]);
    const createdRoles = db.all("SELECT * FROM team_roles WHERE team_project_id = ?", [teamId]);

    return res.status(201).json({
      success: true,
      message: "Team project created successfully.",
      data: { team, roles: createdRoles }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/teams/:id
 * Team project details page
 */
router.get("/:id", (req, res, next) => {
  try {
    const team = db.get(
      `SELECT t.*,
              u.name as owner_name,
              u.email as owner_email,
              u.avatar_url as owner_avatar,
              (SELECT COUNT(*) FROM team_members tm WHERE tm.team_project_id = t.id) as current_member_count
       FROM team_projects t
       JOIN users u ON t.owner_id = u.id
       WHERE t.id = ?`,
      [req.params.id]
    );

    if (!team) {
      return res.status(404).json({ success: false, message: "Team project not found." });
    }

    const roles = db.all("SELECT * FROM team_roles WHERE team_project_id = ?", [team.id]);

    const members = db.all(
      `SELECT tm.*, u.name, u.email, u.avatar_url, u.skills, u.bio
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_project_id = ?`,
      [team.id]
    );

    const updates = db.all(
      `SELECT pu.*, u.name as author_name, u.avatar_url as author_avatar
       FROM team_progress_updates pu
       JOIN users u ON pu.author_id = u.id
       WHERE pu.team_project_id = ?
       ORDER BY pu.created_at DESC`,
      [team.id]
    );

    return res.status(200).json({
      success: true,
      data: {
        team,
        roles,
        members,
        updates
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/teams/:id
 * Update team project info
 */
router.put("/:id", authenticate(), (req, res, next) => {
  try {
    const team = db.get("SELECT * FROM team_projects WHERE id = ?", [req.params.id]);

    if (!team) {
      return res.status(404).json({ success: false, message: "Team project not found." });
    }

    if (team.owner_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden. Only team owners can edit project details." });
    }

    const { title, description, category, goals, github_url, member_limit, status, progress_description } = req.body || {};

    const updatedTitle = title !== undefined ? title.trim() : team.title;
    const updatedDesc = description !== undefined ? description.trim() : team.description;
    const updatedCategory = category !== undefined ? category : team.category;
    const updatedLimit = member_limit !== undefined ? parseInt(member_limit, 10) : team.member_limit;
    const updatedStatus = status !== undefined ? status : team.status;

    db.run(
      `UPDATE team_projects
       SET title = ?, description = ?, category = ?, goals = ?, github_url = ?,
           member_limit = ?, status = ?, progress_description = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [
        updatedTitle,
        updatedDesc,
        updatedCategory,
        goals !== undefined ? goals : team.goals,
        github_url !== undefined ? github_url : team.github_url,
        updatedLimit,
        updatedStatus,
        progress_description !== undefined ? progress_description : team.progress_description,
        req.params.id
      ]
    );

    const updated = db.get("SELECT * FROM team_projects WHERE id = ?", [req.params.id]);

    return res.status(200).json({
      success: true,
      message: "Team project updated successfully.",
      data: { team: updated }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/teams/:id/roles
 * Add open role to team project
 */
router.post("/:id/roles", authenticate(), (req, res, next) => {
  try {
    const team = db.get("SELECT * FROM team_projects WHERE id = ?", [req.params.id]);

    if (!team) {
      return res.status(404).json({ success: false, message: "Team project not found." });
    }

    if (team.owner_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden. Only the team owner can add roles." });
    }

    const { role_name, description, required_skills, slots_total = 1 } = req.body || {};

    if (!role_name || typeof role_name !== "string" || role_name.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Role name is required." });
    }

    const roleId = uuidv4();
    const slots = parseInt(slots_total, 10) || 1;
    const skillsStr = Array.isArray(required_skills) ? JSON.stringify(required_skills) : (required_skills || null);

    db.run(
      `INSERT INTO team_roles (id, team_project_id, role_name, description, required_skills, slots_total, slots_filled, is_open)
       VALUES (?, ?, ?, ?, ?, ?, 0, 1)`,
      [roleId, team.id, role_name.trim(), description || null, skillsStr, slots]
    );

    const role = db.get("SELECT * FROM team_roles WHERE id = ?", [roleId]);

    return res.status(201).json({ success: true, message: "Role added.", data: { role } });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/teams/:id/apply
 * Apply for open role in team project
 */
router.post("/:id/apply", authenticate(), (req, res, next) => {
  try {
    const team = db.get("SELECT * FROM team_projects WHERE id = ?", [req.params.id]);

    if (!team) {
      return res.status(404).json({ success: false, message: "Team project not found." });
    }

    if (team.owner_id === req.user.id) {
      return res.status(400).json({ success: false, message: "You are the owner of this team project." });
    }

    // Check existing membership
    const isMember = db.get("SELECT id FROM team_members WHERE team_project_id = ? AND user_id = ?", [team.id, req.user.id]);
    if (isMember) {
      return res.status(400).json({ success: false, message: "You are already a member of this team." });
    }

    // Check team capacity limit
    const memberCountRow = db.get("SELECT COUNT(*) as count FROM team_members WHERE team_project_id = ?", [team.id]);
    if (memberCountRow && memberCountRow.count >= team.member_limit) {
      return res.status(400).json({ success: false, message: "This team project has reached its maximum member capacity." });
    }

    const { role_id, introduction, skills } = req.body || {};

    if (!role_id) {
      return res.status(400).json({ success: false, message: "Please select a role to apply for." });
    }

    const role = db.get("SELECT * FROM team_roles WHERE id = ? AND team_project_id = ?", [role_id, team.id]);

    if (!role) {
      return res.status(404).json({ success: false, message: "Selected role not found." });
    }

    if (role.is_open === 0 || role.slots_filled >= role.slots_total) {
      return res.status(400).json({ success: false, message: "This role is no longer open for recruitment." });
    }

    if (!introduction || typeof introduction !== "string" || introduction.trim().length < 15) {
      return res.status(400).json({ success: false, message: "Introduction must be at least 15 characters long." });
    }

    // Check duplicate active application
    const existingApp = db.get(
      "SELECT id FROM team_applications WHERE role_id = ? AND applicant_id = ?",
      [role.id, req.user.id]
    );

    if (existingApp) {
      return res.status(400).json({ success: false, message: "You have already applied for this role." });
    }

    const appId = uuidv4();
    const skillsStr = Array.isArray(skills) ? JSON.stringify(skills) : (skills || null);

    db.run(
      `INSERT INTO team_applications (id, team_project_id, role_id, applicant_id, introduction, skills, status)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
      [appId, team.id, role.id, req.user.id, introduction.trim(), skillsStr]
    );

    const application = db.get("SELECT * FROM team_applications WHERE id = ?", [appId]);

    // Notify team owner
    createNotification({
      userId: team.owner_id,
      type: "team_application",
      title: "New Team Application",
      message: `${req.user.name} applied for "${role.role_name}" in "${team.title}".`,
      link: `/teams/my-teams`
    });

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully.",
      data: { application }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/teams/:id/applications
 * Owner views applications for team project
 */
router.get("/:id/applications", authenticate(), (req, res, next) => {
  try {
    const team = db.get("SELECT * FROM team_projects WHERE id = ?", [req.params.id]);

    if (!team) {
      return res.status(404).json({ success: false, message: "Team project not found." });
    }

    if (team.owner_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden. Only the team owner can view applications." });
    }

    const applications = db.all(
      `SELECT ta.*,
              r.role_name,
              u.name as applicant_name,
              u.email as applicant_email,
              u.avatar_url as applicant_avatar,
              u.skills as applicant_user_skills,
              u.bio as applicant_bio
       FROM team_applications ta
       JOIN team_roles r ON ta.role_id = r.id
       JOIN users u ON ta.applicant_id = u.id
       WHERE ta.team_project_id = ?
       ORDER BY ta.created_at DESC`,
      [team.id]
    );

    return res.status(200).json({ success: true, data: { applications } });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/teams/applications/:id/accept
 * Owner accepts team application (Transaction safety)
 */
router.patch("/applications/:id/accept", authenticate(), (req, res, next) => {
  try {
    const appRecord = db.get("SELECT * FROM team_applications WHERE id = ?", [req.params.id]);

    if (!appRecord) {
      return res.status(404).json({ success: false, message: "Application not found." });
    }

    const team = db.get("SELECT * FROM team_projects WHERE id = ?", [appRecord.team_project_id]);

    if (!team) {
      return res.status(404).json({ success: false, message: "Team project not found." });
    }

    if (team.owner_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden. Only the team owner can accept applications." });
    }

    if (appRecord.status !== "PENDING") {
      return res.status(400).json({ success: false, message: "Application is no longer pending." });
    }

    const role = db.get("SELECT * FROM team_roles WHERE id = ?", [appRecord.role_id]);

    if (!role || role.slots_filled >= role.slots_total) {
      return res.status(400).json({ success: false, message: "No available slots left for this role." });
    }

    const memberCountRow = db.get("SELECT COUNT(*) as count FROM team_members WHERE team_project_id = ?", [team.id]);
    if (memberCountRow && memberCountRow.count >= team.member_limit) {
      return res.status(400).json({ success: false, message: "Team member limit reached." });
    }

    db.transaction(() => {
      // 1. Accept application
      db.run("UPDATE team_applications SET status = 'ACCEPTED', updated_at = datetime('now') WHERE id = ?", [appRecord.id]);

      // 2. Add member
      db.run(
        "INSERT INTO team_members (id, team_project_id, user_id, role_name) VALUES (?, ?, ?, ?)",
        [uuidv4(), team.id, appRecord.applicant_id, role.role_name]
      );

      // 3. Update role filled slots
      const newFilled = role.slots_filled + 1;
      const isOpen = newFilled < role.slots_total ? 1 : 0;

      db.run(
        "UPDATE team_roles SET slots_filled = ?, is_open = ? WHERE id = ?",
        [newFilled, isOpen, role.id]
      );
    });

    createNotification({
      userId: appRecord.applicant_id,
      type: "team_accepted",
      title: "Application Accepted!",
      message: `Congratulations! You were accepted into "${team.title}" as ${role.role_name}.`,
      link: `/teams/my-teams`
    });

    return res.status(200).json({
      success: true,
      message: "Application accepted! Member added to team."
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/teams/applications/:id/reject
 */
router.patch("/applications/:id/reject", authenticate(), (req, res, next) => {
  try {
    const appRecord = db.get("SELECT * FROM team_applications WHERE id = ?", [req.params.id]);

    if (!appRecord) {
      return res.status(404).json({ success: false, message: "Application not found." });
    }

    const team = db.get("SELECT * FROM team_projects WHERE id = ?", [appRecord.team_project_id]);

    if (team.owner_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden." });
    }

    db.run("UPDATE team_applications SET status = 'REJECTED', updated_at = datetime('now') WHERE id = ?", [appRecord.id]);

    createNotification({
      userId: appRecord.applicant_id,
      type: "team_rejected",
      title: "Application Status Update",
      message: `Your application to join "${team.title}" was not selected.`,
      link: `/teams/my-applications`
    });

    return res.status(200).json({ success: true, message: "Application rejected." });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/teams/:id/updates
 * Post progress update to team
 */
router.post("/:id/updates", authenticate(), (req, res, next) => {
  try {
    const team = db.get("SELECT * FROM team_projects WHERE id = ?", [req.params.id]);

    if (!team) {
      return res.status(404).json({ success: false, message: "Team project not found." });
    }

    const isMember = db.get("SELECT id FROM team_members WHERE team_project_id = ? AND user_id = ?", [team.id, req.user.id]);
    if (!isMember && team.owner_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden. Only team members can post updates." });
    }

    const { title, content } = req.body || {};

    if (!title || !content) {
      return res.status(400).json({ success: false, message: "Title and content are required." });
    }

    const upId = uuidv4();
    db.run(
      "INSERT INTO team_progress_updates (id, team_project_id, author_id, title, content) VALUES (?, ?, ?, ?, ?)",
      [upId, team.id, req.user.id, title.trim(), content.trim()]
    );

    const update = db.get(
      `SELECT pu.*, u.name as author_name, u.avatar_url as author_avatar
       FROM team_progress_updates pu
       JOIN users u ON pu.author_id = u.id
       WHERE pu.id = ?`,
      [upId]
    );

    return res.status(201).json({ success: true, data: { update } });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/teams/:id/members/:userId
 * Remove member or leave team
 */
router.delete("/:id/members/:targetUserId", authenticate(), (req, res, next) => {
  try {
    const team = db.get("SELECT * FROM team_projects WHERE id = ?", [req.params.id]);

    if (!team) {
      return res.status(404).json({ success: false, message: "Team project not found." });
    }

    const { targetUserId } = req.params;

    if (targetUserId === team.owner_id) {
      return res.status(400).json({ success: false, message: "Team owner cannot leave the team without transferring ownership or closing the project." });
    }

    const isOwner = team.owner_id === req.user.id;
    const isSelf = targetUserId === req.user.id;

    if (!isOwner && !isSelf) {
      return res.status(403).json({ success: false, message: "Forbidden. You can only leave or be removed by the owner." });
    }

    db.run("DELETE FROM team_members WHERE team_project_id = ? AND user_id = ?", [team.id, targetUserId]);

    return res.status(200).json({ success: true, message: "Member removed from team." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
