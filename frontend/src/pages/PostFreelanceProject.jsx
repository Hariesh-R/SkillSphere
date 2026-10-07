// src/pages/PostFreelanceProject.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

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
    skills_required: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const categories = [
    "Web Development",
    "Mobile Apps",
    "UI/UX Design",
    "Artificial Intelligence",
    "Database & Cloud",
    "Content & Writing"
  ];

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.title.trim().length < 5) { setError("Title must be at least 5 characters."); return; }
    if (form.description.trim().length < 20) { setError("Description must be at least 20 characters."); return; }
    if (!form.min_budget || parseFloat(form.min_budget) < 0) { setError("Please enter a valid minimum budget."); return; }

    setLoading(true);
    setError("");

    try {
      const payload = {
        ...form,
        min_budget: parseFloat(form.min_budget),
        max_budget: form.max_budget ? parseFloat(form.max_budget) : null,
        skills_required: form.skills_required.split(",").map(s => s.trim()).filter(Boolean)
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
    <div style={{ minHeight: "calc(100vh - var(--nav-height))", background: "var(--gray-50)", padding: "40px 0 80px" }}>
      <div className="container-sm">
        <h1 className="page-title mb-4">Post a Freelance Project</h1>
        <p className="page-subtitle mb-8">Publish your project requirements and hire top student freelancers</p>

        <div className="card">
          <div className="card-body">
            {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

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
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Description *</label>
                <textarea
                  className="form-textarea"
                  rows={6}
                  placeholder="Outline project goals, required deliverables, features, tech stack, and scope..."
                  value={form.description}
                  onChange={set("description")}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Project Category *</label>
                  <select className="form-select" value={form.category} onChange={set("category")}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Experience Level</label>
                  <select className="form-select" value={form.experience_level} onChange={set("experience_level")}>
                    <option value="entry">Entry Level</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
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
                    value={form.max_budget}
                    onChange={set("max_budget")}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24 }}>
                <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                  {loading ? "Publishing..." : "Publish Freelance Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
