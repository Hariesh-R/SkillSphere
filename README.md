# SkillSphere — Full-Stack Platform

SkillSphere is a complete skill-sharing, freelancing marketplace, real-time messaging, and team-building platform built with Node.js, Express, SQLite, React, and Socket.IO.

---

## 🌟 Integrated Platform Systems

1. **Community Skill Sharing & Workshops**: Instructor workshop creation, student seat booking, search & filters, and student workshop reviews.
2. **Freelancing Marketplace**: Paid project listings, proposal submissions, client hiring workflows (transactional proposal acceptance & auto-rejection), work submission, revision management, project completion, and verified client/freelancer ratings.
3. **Real-Time Messaging & Notifications**: Socket.IO WebSockets paired with persistent SQLite storage for direct & project-specific chat, read receipts, and live notification delivery.
4. **Freelancer Profiles & Portfolios**: Expanded user profiles (bio, skills, areas of expertise, GitHub/LinkedIn links, completed project count) and portfolio showcases CRUD.
5. **Team Finder & Collaborative Projects**: Student team project recruitment, open roles management, role application review, member capacity checks, and team progress updates feed.

---

## 🚀 Technology Stack

- **Backend**: Node.js + Express.js API + Socket.IO
- **Database**: SQLite powered by `better-sqlite3` (driver-agnostic DB abstraction layer ready for AWS RDS PostgreSQL or Azure SQL)
- **Authentication**: JWT token authorization with bcrypt password hashing
- **Frontend**: React (Vite) + React Router + Axios + Socket.IO Client
- **Styling**: Modern Vanilla CSS with CSS variables, rich dark gradients, glassmorphism, responsive grid layouts, and custom badges.

---

## 🔑 Demo Accounts

The database can be seeded using `npm run seed` in the `backend/` directory.

- **Instructor Account:** `alice@example.com` / `password123`
- **Student / Freelancer Account:** `bob@example.com` / `password123`
- **Student / AI Engineer Account:** `sam@example.com` / `password123`

---

## 🧪 Testing & Verification

Automated backend unit & integration test suite using Node's native runner:

```bash
cd backend
npm test
```

Tests cover:
- Health check endpoint
- Registration & login authentication
- Profile persistence & public freelancer profile retrieval
- Portfolio CRUD operations
- Freelance project posting, searching, proposal submission, and transactional hiring
- Work submission, revision requests, and project completion
- Real-time messaging history & notification API
- Team project creation, open roles, application submission, capacity enforcement, and acceptance
- Regression verification for workshops & seat bookings

---

## 🏃‍♂️ Getting Started

### 1. Start the Backend API & Socket Server
```bash
cd backend
npm install
npm run seed      # Populates initial demo users, projects, and workshops
npm run dev       # Starts server on http://localhost:5000
```

### 2. Start the Frontend Application
```bash
cd frontend
npm install
npm run dev       # Starts Vite dev server on http://localhost:5173
```

---

## ☁️ AWS Readiness

The application is structured for easy deployment to AWS:

- **Frontend Hosting**: Amazon S3 + CloudFront or AWS Amplify Hosting.
- **Backend Hosting**: AWS App Runner or ECS (Fargate).
- **Database**: Database calls are encapsulated in `backend/config/db.js` abstraction helper, simplifying migration to Amazon RDS for PostgreSQL.
- **File Storage**: Local uploads served from `/uploads`, abstracted in `backend/config/storage.js` for drop-in migration to AWS S3.
- **Environment Configuration**: Secrets and configuration are managed via standard environment variables defined in `.env.example`.
