// src/pages/PostFreelanceProject.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Briefcase, Plus, Send, AlertCircle } from "lucide-react";
import api from "../api/axios";
import Footer from "../components/Footer";

const CATEGORIES = [
  "Web Development",
  "Mobile Apps",
  "UI/UX Design",
  "Artificial Intelligence",
  "Database & Cloud",
  "Content & Writing",
];

export default function PostFreelanceProject() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Web Development",
    budget_type: "fixed",
    min_budget: "",
    max_budget: "",
    currency: "INR",
    deadline: "",
    estimated_duration: "1 to 3 months",
    experience_level: "intermediate",
    skills_required: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.title.trim().length < 5) {
      setError("Title must be at least 5 characters.");
      return;
    }
    if (form.description.trim().length < 20) {
      setError("Description must be at least 20 characters.");
      return;
    }
    if (!form.min_budget || parseFloat(form.min_budget) < 0) {
      setError("Please enter a valid minimum budget.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        ...form,
        min_budget: parseFloat(form.min_budget),
        max_budget: form.max_budget ? parseFloat(form.max_budget) : null,
        skills_required: form.skills_required
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const { data } = await api.post("/freelance/projects", payload);
      navigate(`/freelance/${data.data.project.id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post project.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ minHeight: "calc(100vh - var(--nav-height))", background: "var(--gray-50)", padding: "40px 0 80px" }}>
        <div className="container-sm">
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "var(--gray-500)", marginBottom: 20 }}>
            <Link to="/freelance" style={{ color: "var(--brand-primary)", display: "inline-flex", alignItems: "center", gap: 4 }}>
              <ArrowLeft size={14} />
              Freelance Marketplace
            </Link>
            <span>/</span>
            <span style={{ color: "var(--gray-700)", fontWeight: 600 }}>Post Project</span>
          </div>

          <div style={{ marginBottom: 28 }}>
            <h1 className="page-title">Post a Freelance Project</h1>
            <p className="page-subtitle">
              Publish project requirements and hire verified talent from the SkillSphere community
            </p>
          </div>

          <div className="card">
            <div className="card-body" style={{ padding: 32 }}>
              {error && (
                <div className="alert alert-error" style={{ marginBottom: 24 }}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Project Title *</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Build a Responsive E-Commerce Mobile App in React Native"
                    value={form.title}
                    onChange={set("title")}
                    required
                  />
                  <span className="form-hint">A concise, descriptive summary of the deliverable</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Detailed Project Scope *</label>
                  <textarea
                    className="form-textarea"
                    rows={6}
                    placeholder="Outline project objectives, key features, technical stack, deadlines, and deliverables..."
                    value={form.description}
                    onChange={set("description")}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Project Category *</label>
                    <select className="form-select" value={form.category} onChange={set("category")}>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Target Experience Level</label>
                    <select className="form-select" value={form.experience_level} onChange={set("experience_level")}>
                      <option value="entry">Entry Level</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Budget Type</label>
                    <select className="form-select" value={form.budget_type} onChange={set("budget_type")}>
                      <option value="fixed">Fixed Price</option>
                      <option value="hourly">Hourly Rate</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Min Budget (₹) *</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="10000"
                      min="0"
                      value={form.min_budget}
                      onChange={set("min_budget")}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Budget (₹)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="25000"
                      min="0"
                      value={form.max_budget}
                      onChange={set("max_budget")}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Application Deadline</label>
                    <input
                      type="date"
                      className="form-input"
                      value={form.deadline}
                      onChange={set("deadline")}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estimated Duration</label>
                    <select className="form-select" value={form.estimated_duration} onChange={set("estimated_duration")}>
                      <option value="Less than 1 month">Less than 1 month</option>
                      <option value="1 to 3 months">1 to 3 months</option>
                      <option value="3 to 6 months">3 to 6 months</option>
                      <option value="More than 6 months">More than 6 months</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Required Skills (Comma-separated)</label>
                  <input
                    className="form-input"
                    placeholder="React, Node.js, TypeScript, PostgreSQL"
                    value={form.skills_required}
                    onChange={set("skills_required")}
                  />
                  <span className="form-hint">Separate skills with commas to create filter tags</span>
                </div>

                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 28 }}>
                  <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                    <Send size={16} />
                    {loading ? "Publishing Project…" : "Publish Freelance Project"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
