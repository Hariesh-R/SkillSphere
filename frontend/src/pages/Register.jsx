// src/pages/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  BookOpen,
  Users,
  Award,
  Sparkles,
  AlertCircle,
  ArrowRight,
  User,
} from "lucide-react";
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
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/register", {
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
        <div style={{ maxWidth: 480 }}>
          <div className="flex gap-2 mb-4" style={{ alignItems: "center" }}>
            <div className="navbar-brand-mark">
              <GraduationCap size={20} strokeWidth={2.2} />
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.2rem", color: "#ffffff" }}>
              SkillSphere
            </span>
          </div>

          <h1 className="auth-left-title">
            Join the Next Era of<br /><em>Community Learning</em>
          </h1>
          <p className="auth-left-subtitle">
            Create your free account today. Attend workshops, recruit team project members, or start teaching your craft.
          </p>

          <div className="auth-features">
            {[
              { icon: BookOpen, text: "Free account setup — no credit card required" },
              { icon: Users, text: "Direct access to real industry peers and mentors" },
              { icon: Award, text: "Build a verified community portfolio and earn ratings" },
              { icon: Sparkles, text: "Live interactive classrooms with screen share" },
            ].map(({ icon: IconComp, text }) => (
              <div key={text} className="auth-feature">
                <div className="auth-feature-icon">
                  <IconComp size={18} />
                </div>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join as a student learner or community instructor</p>

          {/* Role Toggle */}
          <div className="role-toggle">
            <button
              type="button"
              className={`role-btn${role === "student" ? " active" : ""}`}
              onClick={() => setRole("student")}
            >
              <div className="role-btn-icon">
                <User size={22} />
              </div>
              <div className="role-btn-label">Student Learner</div>
              <div style={{ fontSize: "0.72rem", color: "var(--gray-400)", marginTop: 2 }}>
                Attend workshops & teams
              </div>
            </button>

            <button
              type="button"
              className={`role-btn${role === "instructor" ? " active" : ""}`}
              onClick={() => setRole("instructor")}
            >
              <div className="role-btn-icon">
                <GraduationCap size={22} />
              </div>
              <div className="role-btn-label">Instructor</div>
              <div style={{ fontSize: "0.72rem", color: "var(--gray-400)", marginTop: 2 }}>
                Host & monetize workshops
              </div>
            </button>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 20 }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

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
                required
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
                required
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
                  required
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
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg flex gap-2"
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              {loading ? (
                <>
                  <div className="spinner spinner-sm" style={{ borderTopColor: "#fff" }} />
                  <span>Creating Account…</span>
                </>
              ) : (
                <>
                  <span>Create {role === "student" ? "Student" : "Instructor"} Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="auth-footer-text">
            Already have an account?{" "}
            <Link to="/login" style={{ fontWeight: 600, color: "var(--brand-primary)" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
