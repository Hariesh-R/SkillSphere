# SkillSphere

SkillSphere is a community-driven skill-sharing platform where individuals can become instructors to host workshops (online or offline), and students can discover, book, and review these sessions to level up their skills.

## 🚀 Architecture

The application is split into two halves:
1. **Backend**: Node.js + Express.js API interacting with an abstraction layer for DB (SQLite) and Storage (Local disk), making it ready for a drop-in replacement with Azure SQL and Azure Blob Storage.
2. **Frontend**: A modern React Single Page Application (SPA) built using Vite, React Router, and Axios, connected seamlessly to the backend.

---

## 📂 Folder Structure

```text
/Users/apple/Community Based Skill Sharing/
├── backend/
│   ├── data/                 # SQLite database file (skillsphere.db)
│   ├── uploads/              # Local image uploads directory
│   ├── config/
│   │   ├── db.js             # DB abstraction (SQLite implementation)
│   │   └── storage.js        # File storage abstraction (Local fs implementation)
│   ├── middleware/
│   │   └── auth.js           # JWT verification and Role-Based Access Control
│   ├── routes/
│   │   ├── auth.js           # Login, Register, Me endpoints
│   │   ├── workshops.js      # CRUD for workshops, image upload, public listings
│   │   ├── bookings.js       # Student booking and cancellation endpoints
│   │   └── reviews.js        # Sub-resource for rating and reviewing workshops
│   ├── server.js             # Express app setup and middleware mounting
│   └── package.json          # Node backend dependencies
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── axios.js      # Global API client with JWT attach / 401 interceptor
    │   ├── context/
    │   │   └── AuthContext.jsx # Global auth state (localStorage)
    │   ├── components/       # Reusable UI (Navbar, Footer, WorkshopCard, etc.)
    │   ├── pages/            # React Router page components
    │   │   ├── Landing.jsx
    │   │   ├── Explore.jsx
    │   │   ├── WorkshopDetails.jsx
    │   │   ├── Dashboard.jsx (Student)
    │   │   ├── InstructorDashboard.jsx
    │   │   ├── Profile.jsx
    │   │   └── NotFound.jsx
    │   ├── App.jsx           # App routing with Private Route guards
    │   ├── index.css         # Complete design system + styling rules
    │   └── main.jsx          # Entrypoint
    ├── vite.config.js        # Vite config with Dev API proxy
    └── package.json          # Frontend dependencies
```

---

## 🔑 Demo Accounts

The database has been seeded with demo accounts.

**Students:**
- `sam@example.com` / `password123`
- `sue@example.com` / `password123`

**Instructors:**
- `alice@example.com` / `password123`
- `bob@example.com` / `password123`

---

## 📚 API Documentation

### Auth `/api/auth`
- `POST /register` — Register a new user (`name`, `email`, `password`, `role`)
- `POST /login` — Login user with `email` and `password`
- `GET /me` — Get the current authenticated user

### Workshops `/api/workshops`
- `GET /` — Public paginated listing with query filters (`search`, `category`, `mode`, `minPrice`, `maxPrice`, `sort`, `page`)
- `POST /` — (Instructor only) Create a new workshop
- `GET /:id` — Public workshop details
- `PUT /:id` — (Instructor only) Update own workshop
- `DELETE /:id` — (Instructor only) Delete own workshop
- `GET /:id/students` — (Instructor only) View enrolled students for own workshop

### Bookings `/api/bookings`
- `POST /` — (Student only) Book a workshop by `workshop_id`. Enforces seat capacity.
- `GET /my` — (Student only) View all personal bookings with full workshop details.
- `DELETE /:bookingId` — (Student only) Cancel a booking.

### Reviews `/api/workshops/:workshopId/reviews`
- `POST /` — (Student only) Leave a `rating` (1-5) and `comment`. Requires the student to have booked the workshop.
- `GET /` — Public listing of reviews for a given workshop.

---

## 🏃‍♂️ Getting Started

**Start the Backend:**
```bash
cd backend
npm install
npm run dev
# Server starts on http://localhost:5000
```

**Start the Frontend:**
```bash
cd frontend
npm install
npm run dev
# Server starts on http://localhost:5173
```
