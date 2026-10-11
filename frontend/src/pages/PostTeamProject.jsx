// src/pages/PostTeamProject.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Users, Plus, Trash2, Send, AlertCircle } from "lucide-react";
import api from "../api/axios";
import Footer from "../components/Footer";

export default function PostTeamProject() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Artificial Intelligence",
    goals: "",
    github_url: "",
    member_limit: 5,
  });

  const [roles, setRoles] = useState([
    { role_name: "Frontend Developer", description: "UI component development", required_skills: "React, CSS", slots_total: 1 },
    { role_name: "Backend Developer", description: "API design and DB schema", required_skills: "Node.js, SQLite", slots_total: 1 },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const categories = [
    "Artificial Intelligence",
    "Web Development",
    "Mobile Apps",
    "Game Development",
    "Cybersecurity",
    "Design & Creative",
  ];

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleAddRole = () => {
    setRoles([...roles, { role_name: "", description: "", required_skills: "", slots_total: 1 }]);
  };

  const handleRemoveRole = (index) => {
    setRoles(roles.filter((_, i) => i !== index));
  };

  const handleRoleChange = (index, field, value) => {
    const updated = [...roles];
    updated[index][field] = value;
    setRoles(updated);
  };

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

    setLoading(true);
    setError("");

    try {
      const payload = {
        ...form,
        member_limit: parseInt(form.member_limit, 10),
        roles: roles.filter((r) => r.role_name.trim()),
      };

      const { data } = await api.post("/teams", payload);
      navigate(`/teams/${data.data.team.id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create team project.");
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
            <Link to="/teams" style={{ color: "var(--brand-primary)", display: "inline-flex", alignItems: "center", gap: 4 }}>
              <ArrowLeft size={14} />
              Team Finder
            </Link>
            <span>/</span>
            <span style={{ color: "var(--gray-700)", fontWeight: 600 }}>Create Team</span>
          </div>

          <div style={{ marginBottom: 28 }}>
            <h1 className="page-title">Start a Collaborative Team Project</h1>
            <p className="page-subtitle">
              Publish your project vision and recruit peer developers, designers, and contributors
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
                  <label className="form-label">Team Project Title *</label>
                  <input
                    className="form-input"
                    placeholder="e.g. AI-Powered Student Task Manager & Study Companion"
                    value={form.title}
                    onChange={set("title")}
                    required
                  />
                  <span className="form-hint">A catchy, descriptive name for your collaborative venture</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Project Description & Architecture *</label>
                  <textarea
                    className="form-textarea"
                    rows={5}
                    placeholder="Explain what the product solves, the proposed tech stack, and what team members will learn..."
                    value={form.description}
                    onChange={set("description")}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select className="form-select" value={form.category} onChange={set("category")}>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total Team Member Limit</label>
                    <input
                      type="number"
                      className="form-input"
                      value={form.member_limit}
                      onChange={set("member_limit")}
                      min={2}
                      max={20}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Project Goals & Target Milestones</label>
                  <input
                    className="form-input"
                    placeholder="e.g. MVP release by end of month, open-source launch"
                    value={form.goals}
                    onChange={set("goals")}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">GitHub Repository Link (Optional)</label>
                  <input
                    className="form-input"
                    placeholder="https://github.com/organization/repo"
                    value={form.github_url}
                    onChange={set("github_url")}
                  />
                </div>

                {/* Open Recruitment Roles */}
                <div style={{ marginTop: 28, marginBottom: 24, paddingTop: 20, borderTop: "1px solid var(--gray-100)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--gray-900)" }}>
                        Recruitment Roles Needed
                      </h3>
                      <p style={{ fontSize: "0.8125rem", color: "var(--gray-500)", marginTop: 2 }}>
                        Specify the open roles and skills you are seeking
                      </p>
                    </div>
                    <button type="button" className="btn btn-outline btn-sm flex gap-1" onClick={handleAddRole}>
                      <Plus size={14} />
                      Add Role
                    </button>
                  </div>

                  {roles.map((r, i) => (
                    <div
                      key={i}
                      style={{
                        background: "var(--gray-50)",
                        padding: 18,
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--gray-200)",
                        marginBottom: 14,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <strong style={{ fontSize: "0.875rem", color: "var(--gray-800)" }}>
                          Role #{i + 1}
                        </strong>
                        {roles.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs flex gap-1"
                            style={{ color: "var(--error)" }}
                            onClick={() => handleRemoveRole(i)}
                          >
                            <Trash2 size={13} />
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="form-row">
                        <input
                          className="form-input"
                          placeholder="Role Title (e.g. UI/UX Designer)"
                          value={r.role_name}
                          onChange={(e) => handleRoleChange(i, "role_name", e.target.value)}
                          required
                        />
                        <input
                          className="form-input"
                          placeholder="Key Skills (e.g. Figma, Tailwind, React)"
                          value={r.required_skills}
                          onChange={(e) => handleRoleChange(i, "required_skills", e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 28 }}>
                  <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-lg flex gap-2" disabled={loading}>
                    <Send size={16} />
                    {loading ? "Creating Team…" : "Create Team Project"}
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
