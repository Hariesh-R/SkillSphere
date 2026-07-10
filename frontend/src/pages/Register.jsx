// src/pages/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [role, setRole] = useState("student");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email || !form.password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        role,
      });
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <h1 className="auth-left-title">
          Start Learning on<br /><em>SkillSphere</em>
        </h1>
        <p className="auth-left-subtitle">
          Create your free account and get instant access to hundreds of
          workshops taught by real experts in your community.
        </p>
        <div className="auth-features">
          {[
            ["✅", "Free to sign up — no credit card required"],
            ["🎯", "Learn skills that matter for your career"],
            ["💬", "Interactive sessions with live instructors"],
            ["📜", "Get certified after completing workshops"],
          ].map(([icon, text]) => (
            <div key={text} className="auth-feature">
              <div className="auth-feature-icon">{icon}</div>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join thousands of learners and instructors</p>

          {/* Role Toggle */}
          <div className="role-toggle">
            <div
              className={`role-btn${role === "student" ? " active" : ""}`}
              onClick={() => setRole("student")}
            >
              <div className="role-btn-icon">🎓</div>
              <div className="role-btn-label">Student</div>
              <div style={{ fontSize: "0.7rem", color: "var(--gray-400)", marginTop: 2 }}>I want to learn</div>
            </div>
            <div
              className={`role-btn${role === "instructor" ? " active" : ""}`}
              onClick={() => setRole("instructor")}
            >
              <div className="role-btn-icon">👨‍🏫</div>
              <div className="role-btn-label">Instructor</div>
              <div style={{ fontSize: "0.7rem", color: "var(--gray-400)", marginTop: 2 }}>I want to teach</div>
            </div>
          </div>

          {error && <div className="alert alert-error">⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Jane Doe"
                value={form.name}
                onChange={set("name")}
                autoComplete="name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={set("email")}
                autoComplete="email"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={set("password")}
                  autoComplete="new-password"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Repeat password"
                  value={form.confirm}
                  onChange={set("confirm")}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
            >
              {loading ? (
                <><div className="spinner spinner-sm" style={{ borderTopColor: "#fff" }} /> Creating Account…</>
              ) : `Create ${role === "student" ? "Student" : "Instructor"} Account`}
            </button>
          </form>

          <p className="auth-footer-text">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
