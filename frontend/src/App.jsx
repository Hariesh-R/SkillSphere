// src/App.jsx
import { Routes, Route } from "react-router-dom";
import "./App.css";

import Navbar          from "./components/Navbar";
import ProtectedRoute  from "./components/ProtectedRoute";

import Landing            from "./pages/Landing";
import Login              from "./pages/Login";
import Register           from "./pages/Register";
import Explore            from "./pages/Explore";
import WorkshopDetails    from "./pages/WorkshopDetails";
import Dashboard          from "./pages/Dashboard";
import InstructorDashboard from "./pages/InstructorDashboard";
import Profile            from "./pages/Profile";
import PublicProfile      from "./pages/PublicProfile";

import FreelanceList        from "./pages/FreelanceList";
import FreelanceDetails     from "./pages/FreelanceDetails";
import PostFreelanceProject from "./pages/PostFreelanceProject";
import ClientProjects       from "./pages/ClientProjects";
import MyProposals          from "./pages/MyProposals";

import MessagingInbox       from "./pages/MessagingInbox";
import NotificationsPage    from "./pages/NotificationsPage";

import TeamList             from "./pages/TeamList";
import TeamDetails          from "./pages/TeamDetails";
import PostTeamProject      from "./pages/PostTeamProject";
import MyTeams              from "./pages/MyTeams";

import NotFound             from "./pages/NotFound";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/"              element={<Landing />} />
        <Route path="/login"         element={<Login />} />
        <Route path="/register"      element={<Register />} />
        <Route path="/explore"       element={<Explore />} />
        <Route path="/workshops/:id" element={<WorkshopDetails />} />

        {/* Public Profiles */}
        <Route path="/users/:id"     element={<PublicProfile />} />

        {/* Freelance Marketplace */}
        <Route path="/freelance"          element={<FreelanceList />} />
        <Route path="/freelance/:id"      element={<FreelanceDetails />} />
        <Route
          path="/freelance/post"
          element={<ProtectedRoute><PostFreelanceProject /></ProtectedRoute>}
        />
        <Route
          path="/freelance/my-projects"
          element={<ProtectedRoute><ClientProjects /></ProtectedRoute>}
        />
        <Route
          path="/freelance/my-proposals"
          element={<ProtectedRoute><MyProposals /></ProtectedRoute>}
        />

        {/* Messaging & Notifications */}
        <Route
          path="/messages"
          element={<ProtectedRoute><MessagingInbox /></ProtectedRoute>}
        />
        <Route
          path="/notifications"
          element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>}
        />

        {/* Team Finder */}
        <Route path="/teams"          element={<TeamList />} />
        <Route path="/teams/:id"      element={<TeamDetails />} />
        <Route
          path="/teams/post"
          element={<ProtectedRoute><PostTeamProject /></ProtectedRoute>}
        />
        <Route
          path="/teams/my-teams"
          element={<ProtectedRoute><MyTeams /></ProtectedRoute>}
        />

        {/* Student & Instructor Dashboards */}
        <Route
          path="/student"
          element={<ProtectedRoute role="student"><Dashboard /></ProtectedRoute>}
        />
        <Route
          path="/instructor"
          element={<ProtectedRoute role="instructor"><InstructorDashboard /></ProtectedRoute>}
        />

        {/* Profile */}
        <Route
          path="/profile"
          element={<ProtectedRoute><Profile /></ProtectedRoute>}
        />

        {/* 404 */}
        <Route path="/404"  element={<NotFound />} />
        <Route path="*"     element={<NotFound />} />
      </Routes>
    </>
  );
}
