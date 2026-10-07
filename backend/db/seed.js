/**
 * backend/db/seed.js
 * Comprehensive Seeder script for SkillSphere
 */

"use strict";

require("dotenv").config();
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const { initDatabase } = require("./init");

async function seed() {
  console.log("[Seed] Initializing DB schema...");
  initDatabase();

  const pwHash = await bcrypt.hash("password123", 12);

  db.transaction(() => {
    // 1. Users
    const users = [
      {
        id: "u-alice-111",
        name: "Alice Designer",
        email: "alice@example.com",
        role: "instructor",
        bio: "Senior UI/UX Designer & Product Specialist with 7+ years experience.",
        skills: JSON.stringify(["UI/UX", "Figma", "User Research", "Prototyping"]),
        expertise: "UI/UX & Product Design",
        github_url: "https://github.com/alicedesign",
        rating_avg: 4.9,
        rating_count: 8,
        completed_projects_count: 5
      },
      {
        id: "u-bob-222",
        name: "Bob FullStack",
        email: "bob@example.com",
        role: "student",
        bio: "Passionate Full-Stack Developer specializing in React, Node.js, and SQLite/PostgreSQL.",
        skills: JSON.stringify(["React", "Node.js", "Express", "SQLite", "Python"]),
        expertise: "Full-Stack Web Development",
        github_url: "https://github.com/bobfullstack",
        linkedin_url: "https://linkedin.com/in/bobfullstack",
        rating_avg: 4.8,
        rating_count: 12,
        completed_projects_count: 9
      },
      {
        id: "u-sam-333",
        name: "Sam AI Engineer",
        email: "sam@example.com",
        role: "student",
        bio: "AI/ML student researcher working on LLM agents, PyTorch, and NLP.",
        skills: JSON.stringify(["Python", "PyTorch", "NLP", "Scikit-Learn", "FastAPI"]),
        expertise: "AI & Machine Learning",
        github_url: "https://github.com/samai",
        rating_avg: 5.0,
        rating_count: 4,
        completed_projects_count: 3
      }
    ];

    for (const u of users) {
      db.run(
        `INSERT OR REPLACE INTO users (id, name, email, password, role, bio, skills, expertise, github_url, linkedin_url, rating_avg, rating_count, completed_projects_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [u.id, u.name, u.email, pwHash, u.role, u.bio, u.skills, u.expertise, u.github_url || null, u.linkedin_url || null, u.rating_avg, u.rating_count, u.completed_projects_count]
      );
    }

    // 2. Portfolio Items
    const portfolio = [
      {
        id: "p-1",
        user_id: "u-bob-222",
        title: "SkillSphere Platform",
        description: "Community-based skill sharing & freelancing platform",
        technologies: "React, Node.js, Express, SQLite, Socket.IO",
        github_url: "https://github.com/bobfullstack/skillsphere"
      },
      {
        id: "p-2",
        user_id: "u-alice-111",
        title: "FinTech Mobile App UI Kit",
        description: "Modern glassmorphism mobile UI design system in Figma",
        project_url: "https://figma.com/@alicedesign"
      }
    ];

    for (const p of portfolio) {
      db.run(
        `INSERT OR REPLACE INTO portfolio_items (id, user_id, title, description, technologies, github_url, project_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [p.id, p.user_id, p.title, p.description, p.technologies || null, p.github_url || null, p.project_url || null]
      );
    }

    // 3. Workshops
    db.run(
      `INSERT OR REPLACE INTO workshops (id, instructor_id, title, description, category, skill_level, price, max_seats, is_online, status, scheduled_at)
       VALUES ('w-101', 'u-alice-111', 'Mastering Figma & Modern UI Systems', 'Complete hands-on guide to building scalable design systems in Figma.', 'UI/UX Design', 'intermediate', 1499, 30, 1, 'published', '2026-11-15T10:00:00Z')`
    );

    // 4. Freelance Projects
    const projects = [
      {
        id: "fp-101",
        client_id: "u-alice-111",
        title: "Develop Real-Time Dashboard UI in React",
        description: "Looking for an experienced frontend freelancer to build a clean, dark-mode analytics dashboard with chart visualisations.",
        category: "Web Development",
        budget_type: "fixed",
        min_budget: 15000,
        max_budget: 25000,
        currency: "INR",
        deadline: "2026-11-30",
        estimated_duration: "1 to 3 months",
        experience_level: "intermediate",
        status: "OPEN",
        skills_required: JSON.stringify(["React", "Chart.js", "CSS"])
      },
      {
        id: "fp-102",
        client_id: "u-sam-333",
        title: "Build REST API & Database Schema for EdTech App",
        description: "We need a Node.js / Express backend developer to construct clean REST endpoints and SQLite database migrations.",
        category: "Database & Cloud",
        budget_type: "fixed",
        min_budget: 20000,
        max_budget: 35000,
        currency: "INR",
        deadline: "2026-12-15",
        estimated_duration: "Less than 1 month",
        experience_level: "expert",
        status: "IN_PROGRESS",
        freelancer_id: "u-bob-222",
        skills_required: JSON.stringify(["Node.js", "Express", "SQLite", "JWT"])
      }
    ];

    for (const fp of projects) {
      db.run(
        `INSERT OR REPLACE INTO freelance_projects (id, client_id, title, description, category, budget_type, min_budget, max_budget, currency, deadline, estimated_duration, experience_level, status, freelancer_id, skills_required)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [fp.id, fp.client_id, fp.title, fp.description, fp.category, fp.budget_type, fp.min_budget, fp.max_budget, fp.currency, fp.deadline, fp.estimated_duration, fp.experience_level, fp.status, fp.freelancer_id || null, fp.skills_required]
      );
    }

    // 5. Proposals
    db.run(
      `INSERT OR REPLACE INTO proposals (id, project_id, freelancer_id, cover_letter, proposed_price, estimated_delivery_time, status)
       VALUES ('pr-1', 'fp-101', 'u-bob-222', 'I have built over 10 responsive React dashboards with dark mode and smooth animations. Excited to work on this!', 22000, '2 Weeks', 'PENDING')`
    );

    // 6. Team Projects
    const teamProjects = [
      {
        id: "tp-1",
        owner_id: "u-sam-333",
        title: "AI Study Buddy & Automated Quiz Generator",
        description: "Building an open-source web platform that parses lecture notes and automatically generates flashcards and interactive quizzes using LLM APIs.",
        category: "Artificial Intelligence",
        goals: "Build MVP within 4 weeks and release on GitHub",
        member_limit: 5,
        status: "RECRUITING"
      }
    ];

    for (const tp of teamProjects) {
      db.run(
        `INSERT OR REPLACE INTO team_projects (id, owner_id, title, description, category, goals, member_limit, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [tp.id, tp.owner_id, tp.title, tp.description, tp.category, tp.goals, tp.member_limit, tp.status]
      );

      db.run(
        `INSERT OR REPLACE INTO team_members (id, team_project_id, user_id, role_name)
         VALUES (?, ?, ?, 'Project Owner / AI Engineer')`,
        [uuidv4(), tp.id, tp.owner_id]
      );

      db.run(
        `INSERT OR REPLACE INTO team_roles (id, team_project_id, role_name, description, required_skills, slots_total, slots_filled, is_open)
         VALUES
         ('tr-1', ?, 'Frontend Developer', 'Build React dashboard UI', 'React, CSS', 1, 0, 1),
         ('tr-2', ?, 'UI/UX Designer', 'Design Figma prototypes', 'Figma, UI Design', 1, 0, 1)`,
        [tp.id, tp.id]
      );
    }
  });

  console.log("✅ [Seed] Database seeded successfully with demonstration data!");
  console.log("---------------------------------------------------------");
  console.log("Demo credentials:");
  console.log("Instructor: alice@example.com / password123");
  console.log("Student:    bob@example.com   / password123");
  console.log("Student:    sam@example.com   / password123");
}

seed().catch(console.error);
