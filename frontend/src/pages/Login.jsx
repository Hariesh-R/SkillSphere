// src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
      setError("Please fill in all fields.");
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
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <h1 className="auth-left-title">
          Welcome back to<br /><em>SkillSphere</em>
        </h1>
        <p className="auth-left-subtitle">
          Continue your learning journey. Your next breakthrough is just one
          workshop away.
        </p>
        <div className="auth-features">
          {[
            ["🎓", "Access 500+ expert-led workshops"],
            ["📅", "Learn at your own pace, anytime"],
            ["🏆", "Earn certificates for completed courses"],
            ["🌐", "Join a global community of learners"],
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
          <h2 className="auth-title">Log In</h2>
          <p className="auth-subtitle">Sign in to your SkillSphere account</p>

          {error && <div className="alert alert-error">⚠️ {error}</div>}

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
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
            >
              {loading ? (
                <><div className="spinner spinner-sm" style={{ borderTopColor: "#fff" }} /> Signing In…</>
              ) : "Log In"}
            </button>
          </form>

          <p className="auth-footer-text">
            Don't have an account? <Link to="/register">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
