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
import NotFound           from "./pages/NotFound";

// Auth pages don't show the Navbar
const AUTH_ROUTES = ["/login", "/register"];

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

        {/* Student only */}
        <Route
          path="/student"
          element={
            <ProtectedRoute role="student">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Instructor only */}
        <Route
          path="/instructor"
          element={
            <ProtectedRoute role="instructor">
              <InstructorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Any authenticated user */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="/404"  element={<NotFound />} />
        <Route path="*"     element={<NotFound />} />
      </Routes>
    </>
  );
}
