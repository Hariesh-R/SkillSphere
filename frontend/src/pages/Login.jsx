// src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  GraduationCap,
  BookOpen,
  Users,
  Award,
  Sparkles,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const from = location.state?.from?.pathname || "/";

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password) {
      setError("Please fill in both email and password.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      login(data.data.user, data.data.token);
      // Redirect based on role
      const role = data.data.user.role;
      if (from !== "/") {
        navigate(from, { replace: true });
      } else {
        navigate(role === "instructor" ? "/instructor" : "/student", { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please verify your credentials.");
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
            Welcome Back to<br /><em>Community Learning</em>
          </h1>
          <p className="auth-left-subtitle">
            Sign in to access your workshops, active freelance contracts, team projects, and community chats.
          </p>

          <div className="auth-features">
            {[
              { icon: BookOpen, text: "Live interactive workshops with community experts" },
              { icon: Users, text: "Freelance contracts and collaborative team finder" },
              { icon: Award, text: "Verified reviews, portfolio showcases, and skill milestones" },
              { icon: Sparkles, text: "Real-time direct and group messaging" },
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
          <h2 className="auth-title">Sign In</h2>
          <p className="auth-subtitle">Enter your SkillSphere credentials to continue</p>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 20 }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
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

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={set("password")}
                autoComplete="current-password"
                required
              />
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
                  <span>Signing In…</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="auth-footer-text">
            Don't have an account yet?{" "}
            <Link to="/register" style={{ fontWeight: 600, color: "var(--brand-primary)" }}>
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
