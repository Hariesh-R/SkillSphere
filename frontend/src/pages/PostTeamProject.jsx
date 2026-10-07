// src/pages/PostTeamProject.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function PostTeamProject() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Artificial Intelligence",
    goals: "",
    github_url: "",
    member_limit: 5
  });

  const [roles, setRoles] = useState([
    { role_name: "Frontend Developer", description: "UI component development", required_skills: "React, CSS", slots_total: 1 },
    { role_name: "Backend Developer", description: "API design and DB schema", required_skills: "Node.js, SQLite", slots_total: 1 }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const categories = [
    "Artificial Intelligence",
    "Web Development",
    "Mobile Apps",
    "Game Development",
    "Cybersecurity",
    "Design & Creative"
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
    if (form.title.trim().length < 5) { setError("Title must be at least 5 characters."); return; }
    if (form.description.trim().length < 20) { setError("Description must be at least 20 characters."); return; }

    setLoading(true);
    setError("");

    try {
      const payload = {
        ...form,
        member_limit: parseInt(form.member_limit, 10),
        roles: roles.filter(r => r.role_name.trim())
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
    <div style={{ minHeight: "calc(100vh - var(--nav-height))", background: "var(--gray-50)", padding: "40px 0 80px" }}>
      <div className="container-sm">
        <h1 className="page-title mb-4">Create Team Recruitment Project</h1>
        <p className="page-subtitle mb-8">Publish your team project idea and recruit teammates with matching skills</p>

        <div className="card">
          <div className="card-body">
            {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Team Project Title *</label>
                <input
                  className="form-input"
                  placeholder="e.g. AI-Powered Student Task Manager & Quiz Generator"
                  value={form.title}
                  onChange={set("title")}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Project Description *</label>
                <textarea
                  className="form-textarea"
                  rows={5}
                  placeholder="Explain what your team will build, technical stack, architecture, and expected timeline..."
                  value={form.description}
                  onChange={set("description")}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select className="form-select" value={form.category} onChange={set("category")}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
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
                <label className="form-label">Project Goals & Milestones</label>
                <input
                  className="form-input"
                  placeholder="e.g. Complete MVP by end of month, submit to Hackathon"
                  value={form.goals}
                  onChange={set("goals")}
                />
              </div>

              <div className="form-group">
                <label className="form-label">GitHub Repository Link (Optional)</label>
                <input
                  className="form-input"
                  placeholder="https://github.com/username/project-repo"
                  value={form.github_url}
                  onChange={set("github_url")}
                />
              </div>

              {/* Dynamic Open Roles */}
              <div style={{ marginTop: 24, marginBottom: 24, paddingTop: 16, borderTop: "1px solid var(--gray-200)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ fontWeight: 800, fontSize: "1.1rem" }}>Open Recruitment Roles</h3>
                  <button type="button" className="btn btn-outline btn-sm" onClick={handleAddRole}>
                    + Add Open Role
                  </button>
                </div>

                {roles.map((r, i) => (
                  <div key={i} style={{ background: "var(--gray-50)", padding: 16, borderRadius: 10, marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <strong style={{ fontSize: "0.9rem" }}>Role #{i + 1}</strong>
                      {roles.length > 1 && (
                        <button type="button" style={{ color: "var(--error)", fontSize: "0.8rem" }} onClick={() => handleRemoveRole(i)}>
                          Remove Role
                        </button>
                      )}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <input
                        className="form-input"
                        placeholder="Role Title (e.g. UI/UX Designer)"
                        value={r.role_name}
                        onChange={(e) => handleRoleChange(i, "role_name", e.target.value)}
                        required
                      />
                      <input
                        className="form-input"
                        placeholder="Required Skills (e.g. Figma, CSS)"
                        value={r.required_skills}
                        onChange={(e) => handleRoleChange(i, "required_skills", e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                  {loading ? "Creating Team..." : "Create Team Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
