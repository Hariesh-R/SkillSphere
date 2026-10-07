/**
 * backend/db/init.js
 *
 * Database Initializer – SkillSphere
 * ====================================
 * Runs once at server startup. Creates all application tables and indexes
 * if they do not already exist.
 */

"use strict";

const db = require("../config/db");

// ─────────────────────────────────────────────────────────────────
//  TABLE DEFINITIONS
// ─────────────────────────────────────────────────────────────────

const CREATE_USERS = `
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT    PRIMARY KEY,                         -- UUID v4
    name        TEXT    NOT NULL,
    email       TEXT    NOT NULL UNIQUE,
    password    TEXT    NOT NULL,                            -- bcrypt hash
    role        TEXT    NOT NULL DEFAULT 'student'
                        CHECK (role IN ('student', 'instructor')),
    avatar_url  TEXT,
    bio         TEXT,
    skills      TEXT,
    expertise   TEXT,
    education   TEXT,
    github_url  TEXT,
    linkedin_url TEXT,
    website_url TEXT,
    rating_avg  REAL    NOT NULL DEFAULT 0,
    rating_count INTEGER NOT NULL DEFAULT 0,
    completed_projects_count INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`;

const CREATE_WORKSHOPS = `
  CREATE TABLE IF NOT EXISTS workshops (
    id           TEXT    PRIMARY KEY,                        -- UUID v4
    instructor_id TEXT   NOT NULL
                         REFERENCES users(id) ON DELETE CASCADE,
    title        TEXT    NOT NULL,
    description  TEXT,
    category     TEXT    NOT NULL,
    skill_level  TEXT    NOT NULL DEFAULT 'beginner'
                         CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
    price        REAL    NOT NULL DEFAULT 0
                         CHECK (price >= 0),
    max_seats    INTEGER NOT NULL DEFAULT 20
                         CHECK (max_seats > 0),
    location     TEXT,
    is_online    INTEGER NOT NULL DEFAULT 1                  -- 0 = false, 1 = true
                         CHECK (is_online IN (0, 1)),
    status       TEXT    NOT NULL DEFAULT 'draft'
                         CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
    scheduled_at TEXT,
    meet_link    TEXT,
    cover_url    TEXT,
    created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`;

const CREATE_BOOKINGS = `
  CREATE TABLE IF NOT EXISTS bookings (
    id           TEXT    PRIMARY KEY,                        -- UUID v4
    workshop_id  TEXT    NOT NULL
                         REFERENCES workshops(id) ON DELETE CASCADE,
    student_id   TEXT    NOT NULL
                         REFERENCES users(id) ON DELETE CASCADE,
    status       TEXT    NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'confirmed', 'cancelled', 'attended')),
    paid_amount  REAL    NOT NULL DEFAULT 0
                         CHECK (paid_amount >= 0),
    booked_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE (workshop_id, student_id)
  )
`;

const CREATE_REVIEWS = `
  CREATE TABLE IF NOT EXISTS reviews (
    id           TEXT    PRIMARY KEY,                        -- UUID v4
    workshop_id  TEXT    NOT NULL
                         REFERENCES workshops(id) ON DELETE CASCADE,
    reviewer_id  TEXT    NOT NULL
                         REFERENCES users(id) ON DELETE CASCADE,
    rating       INTEGER NOT NULL
                         CHECK (rating BETWEEN 1 AND 5),
    comment      TEXT,
    created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE (workshop_id, reviewer_id)
  )
`;

// Portfolio items
const CREATE_PORTFOLIO_ITEMS = `
  CREATE TABLE IF NOT EXISTS portfolio_items (
    id           TEXT    PRIMARY KEY,
    user_id      TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title        TEXT    NOT NULL,
    description  TEXT,
    technologies TEXT,
    project_url  TEXT,
    github_url   TEXT,
    image_url    TEXT,
    created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`;

// Freelance projects
const CREATE_FREELANCE_PROJECTS = `
  CREATE TABLE IF NOT EXISTS freelance_projects (
    id                 TEXT PRIMARY KEY,
    client_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title              TEXT NOT NULL,
    description        TEXT NOT NULL,
    category           TEXT NOT NULL,
    budget_type        TEXT NOT NULL DEFAULT 'fixed' CHECK (budget_type IN ('fixed', 'hourly')),
    min_budget         REAL NOT NULL DEFAULT 0 CHECK (min_budget >= 0),
    max_budget         REAL CHECK (max_budget IS NULL OR max_budget >= min_budget),
    currency           TEXT NOT NULL DEFAULT 'INR',
    deadline           TEXT,
    estimated_duration TEXT,
    experience_level   TEXT NOT NULL DEFAULT 'intermediate' CHECK (experience_level IN ('entry', 'intermediate', 'expert')),
    status             TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'CANCELLED')),
    freelancer_id      TEXT REFERENCES users(id) ON DELETE SET NULL,
    skills_required    TEXT,
    attachments        TEXT,
    created_at         TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
  )
`;

// Proposals
const CREATE_PROPOSALS = `
  CREATE TABLE IF NOT EXISTS proposals (
    id                      TEXT PRIMARY KEY,
    project_id             TEXT NOT NULL REFERENCES freelance_projects(id) ON DELETE CASCADE,
    freelancer_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cover_letter           TEXT NOT NULL,
    proposed_price         REAL NOT NULL CHECK (proposed_price >= 0),
    estimated_delivery_time TEXT NOT NULL,
    portfolio_items        TEXT,
    status                 TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN')),
    created_at             TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at             TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (project_id, freelancer_id)
  )
`;

// Submissions
const CREATE_PROJECT_SUBMISSIONS = `
  CREATE TABLE IF NOT EXISTS project_submissions (
    id            TEXT PRIMARY KEY,
    project_id    TEXT NOT NULL REFERENCES freelance_projects(id) ON DELETE CASCADE,
    freelancer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description   TEXT NOT NULL,
    attachments   TEXT,
    status        TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'ACCEPTED', 'REVISION_REQUESTED')),
    feedback      TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
  )
`;

// Freelance Project Reviews
const CREATE_FREELANCE_REVIEWS = `
  CREATE TABLE IF NOT EXISTS freelance_reviews (
    id          TEXT PRIMARY KEY,
    project_id  TEXT NOT NULL REFERENCES freelance_projects(id) ON DELETE CASCADE,
    reviewer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (project_id, reviewer_id)
  )
`;

// Team Projects
const CREATE_TEAM_PROJECTS = `
  CREATE TABLE IF NOT EXISTS team_projects (
    id                   TEXT PRIMARY KEY,
    owner_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title                TEXT NOT NULL,
    description          TEXT NOT NULL,
    category             TEXT NOT NULL,
    goals                TEXT,
    github_url           TEXT,
    member_limit         INTEGER NOT NULL DEFAULT 5 CHECK (member_limit > 0),
    status               TEXT NOT NULL DEFAULT 'RECRUITING' CHECK (status IN ('RECRUITING', 'IN_PROGRESS', 'COMPLETED', 'CLOSED')),
    progress_description TEXT,
    created_at           TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at           TEXT NOT NULL DEFAULT (datetime('now'))
  )
`;

// Team Roles
const CREATE_TEAM_ROLES = `
  CREATE TABLE IF NOT EXISTS team_roles (
    id              TEXT PRIMARY KEY,
    team_project_id TEXT NOT NULL REFERENCES team_projects(id) ON DELETE CASCADE,
    role_name       TEXT NOT NULL,
    description     TEXT,
    required_skills TEXT,
    slots_total     INTEGER NOT NULL DEFAULT 1 CHECK (slots_total > 0),
    slots_filled    INTEGER NOT NULL DEFAULT 0 CHECK (slots_filled >= 0),
    is_open         INTEGER NOT NULL DEFAULT 1 CHECK (is_open IN (0, 1)),
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
  )
`;

// Team Applications
const CREATE_TEAM_APPLICATIONS = `
  CREATE TABLE IF NOT EXISTS team_applications (
    id              TEXT PRIMARY KEY,
    team_project_id TEXT NOT NULL REFERENCES team_projects(id) ON DELETE CASCADE,
    role_id         TEXT NOT NULL REFERENCES team_roles(id) ON DELETE CASCADE,
    applicant_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    introduction    TEXT NOT NULL,
    skills          TEXT,
    status          TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN')),
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (role_id, applicant_id)
  )
`;

// Team Members
const CREATE_TEAM_MEMBERS = `
  CREATE TABLE IF NOT EXISTS team_members (
    id              TEXT PRIMARY KEY,
    team_project_id TEXT NOT NULL REFERENCES team_projects(id) ON DELETE CASCADE,
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_name       TEXT NOT NULL,
    joined_at       TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (team_project_id, user_id)
  )
`;

// Team Progress Updates
const CREATE_TEAM_PROGRESS_UPDATES = `
  CREATE TABLE IF NOT EXISTS team_progress_updates (
    id              TEXT PRIMARY KEY,
    team_project_id TEXT NOT NULL REFERENCES team_projects(id) ON DELETE CASCADE,
    author_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    content         TEXT NOT NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
  )
`;

// Conversations
const CREATE_CONVERSATIONS = `
  CREATE TABLE IF NOT EXISTS conversations (
    id              TEXT PRIMARY KEY,
    project_id      TEXT REFERENCES freelance_projects(id) ON DELETE SET NULL,
    team_project_id TEXT REFERENCES team_projects(id) ON DELETE SET NULL,
    type            TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'project', 'team')),
    title           TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
  )
`;

// Conversation Participants
const CREATE_CONVERSATION_PARTICIPANTS = `
  CREATE TABLE IF NOT EXISTS conversation_participants (
    id              TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at       TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (conversation_id, user_id)
  )
`;

// Messages
const CREATE_MESSAGES = `
  CREATE TABLE IF NOT EXISTS messages (
    id              TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text            TEXT NOT NULL,
    attachments     TEXT,
    is_read         INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
  )
`;

// Notifications
const CREATE_NOTIFICATIONS = `
  CREATE TABLE IF NOT EXISTS notifications (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       TEXT NOT NULL,
    title      TEXT NOT NULL,
    message    TEXT NOT NULL,
    link       TEXT,
    is_read    INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`;

// ─────────────────────────────────────────────────────────────────
//  INDEX DEFINITIONS
// ─────────────────────────────────────────────────────────────────

const INDEXES = [
  // users
  "CREATE INDEX IF NOT EXISTS idx_users_email              ON users(email)",
  "CREATE INDEX IF NOT EXISTS idx_users_role               ON users(role)",

  // workshops
  "CREATE INDEX IF NOT EXISTS idx_workshops_instructor     ON workshops(instructor_id)",
  "CREATE INDEX IF NOT EXISTS idx_workshops_status         ON workshops(status)",
  "CREATE INDEX IF NOT EXISTS idx_workshops_category       ON workshops(category)",

  // bookings
  "CREATE INDEX IF NOT EXISTS idx_bookings_workshop        ON bookings(workshop_id)",
  "CREATE INDEX IF NOT EXISTS idx_bookings_student         ON bookings(student_id)",
  "CREATE INDEX IF NOT EXISTS idx_bookings_status          ON bookings(status)",

  // reviews
  "CREATE INDEX IF NOT EXISTS idx_reviews_workshop         ON reviews(workshop_id)",
  "CREATE INDEX IF NOT EXISTS idx_reviews_reviewer         ON reviews(reviewer_id)",

  // portfolio
  "CREATE INDEX IF NOT EXISTS idx_portfolio_user           ON portfolio_items(user_id)",

  // freelance projects
  "CREATE INDEX IF NOT EXISTS idx_fp_client                ON freelance_projects(client_id)",
  "CREATE INDEX IF NOT EXISTS idx_fp_status                ON freelance_projects(status)",
  "CREATE INDEX IF NOT EXISTS idx_fp_category              ON freelance_projects(category)",
  "CREATE INDEX IF NOT EXISTS idx_fp_freelancer            ON freelance_projects(freelancer_id)",

  // proposals
  "CREATE INDEX IF NOT EXISTS idx_proposals_project        ON proposals(project_id)",
  "CREATE INDEX IF NOT EXISTS idx_proposals_freelancer     ON proposals(freelancer_id)",
  "CREATE INDEX IF NOT EXISTS idx_proposals_status         ON proposals(status)",

  // submissions
  "CREATE INDEX IF NOT EXISTS idx_submissions_project      ON project_submissions(project_id)",
  "CREATE INDEX IF NOT EXISTS idx_submissions_freelancer   ON project_submissions(freelancer_id)",

  // team projects & roles & apps
  "CREATE INDEX IF NOT EXISTS idx_tp_owner                 ON team_projects(owner_id)",
  "CREATE INDEX IF NOT EXISTS idx_tp_status                ON team_projects(status)",
  "CREATE INDEX IF NOT EXISTS idx_tr_team                  ON team_roles(team_project_id)",
  "CREATE INDEX IF NOT EXISTS idx_ta_team                  ON team_applications(team_project_id)",
  "CREATE INDEX IF NOT EXISTS idx_ta_applicant             ON team_applications(applicant_id)",
  "CREATE INDEX IF NOT EXISTS idx_tm_team                  ON team_members(team_project_id)",
  "CREATE INDEX IF NOT EXISTS idx_tm_user                  ON team_members(user_id)",

  // conversations & messages & notifications
  "CREATE INDEX IF NOT EXISTS idx_cp_user                  ON conversation_participants(user_id)",
  "CREATE INDEX IF NOT EXISTS idx_cp_conv                  ON conversation_participants(conversation_id)",
  "CREATE INDEX IF NOT EXISTS idx_msg_conv                 ON messages(conversation_id)",
  "CREATE INDEX IF NOT EXISTS idx_notifications_user       ON notifications(user_id)",
  "CREATE INDEX IF NOT EXISTS idx_notifications_read       ON notifications(user_id, is_read)"
];

/**
 * Safely add missing columns to existing users table if migrating on existing DB
 */
function migrateExistingTables() {
  const columnsToAdd = [
    { col: "skills", type: "TEXT" },
    { col: "expertise", type: "TEXT" },
    { col: "education", type: "TEXT" },
    { col: "github_url", type: "TEXT" },
    { col: "linkedin_url", type: "TEXT" },
    { col: "website_url", type: "TEXT" },
    { col: "rating_avg", type: "REAL NOT NULL DEFAULT 0" },
    { col: "rating_count", type: "INTEGER NOT NULL DEFAULT 0" },
    { col: "completed_projects_count", type: "INTEGER NOT NULL DEFAULT 0" }
  ];

  try {
    const tableInfo = db.all("PRAGMA table_info(users)");
    const existingCols = new Set(tableInfo.map((c) => c.name));
    for (const item of columnsToAdd) {
      if (!existingCols.has(item.col)) {
        db.run(`ALTER TABLE users ADD COLUMN ${item.col} ${item.type}`);
      }
    }
  } catch (err) {
    console.error("[DB Init] Column migration check failed:", err.message);
  }
}

// ─────────────────────────────────────────────────────────────────
//  INITIALIZER
// ─────────────────────────────────────────────────────────────────

function initDatabase() {
  console.log("[DB Init] Running database initialization…");

  db.transaction(() => {
    // Tables
    db.run(CREATE_USERS);
    db.run(CREATE_WORKSHOPS);
    db.run(CREATE_BOOKINGS);
    db.run(CREATE_REVIEWS);
    db.run(CREATE_PORTFOLIO_ITEMS);
    db.run(CREATE_FREELANCE_PROJECTS);
    db.run(CREATE_PROPOSALS);
    db.run(CREATE_PROJECT_SUBMISSIONS);
    db.run(CREATE_FREELANCE_REVIEWS);
    db.run(CREATE_TEAM_PROJECTS);
    db.run(CREATE_TEAM_ROLES);
    db.run(CREATE_TEAM_APPLICATIONS);
    db.run(CREATE_TEAM_MEMBERS);
    db.run(CREATE_TEAM_PROGRESS_UPDATES);
    db.run(CREATE_CONVERSATIONS);
    db.run(CREATE_CONVERSATION_PARTICIPANTS);
    db.run(CREATE_MESSAGES);
    db.run(CREATE_NOTIFICATIONS);

    // Dynamic column additions for users
    migrateExistingTables();

    // Indexes
    for (const indexSql of INDEXES) {
      db.run(indexSql);
    }
  });

  console.log("[DB Init] ✓ All tables and indexes initialized successfully");
}

module.exports = { initDatabase };

