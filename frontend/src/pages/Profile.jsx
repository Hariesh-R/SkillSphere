// src/pages/Profile.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile"); // profile | portfolio

  // Profile Form
  const [form, setForm] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
    skills: user?.skills ? (typeof user.skills === "string" ? user.skills : JSON.stringify(user.skills)) : "",
    expertise: user?.expertise || "",
    education: user?.education || "",
    github_url: user?.github_url || "",
    linkedin_url: user?.linkedin_url || "",
    website_url: user?.website_url || ""
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // Portfolio Items
  const [portfolio, setPortfolio] = useState([]);
  const [portLoading, setPortLoading] = useState(false);
  const [showPortModal, setShowPortModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [portForm, setPortForm] = useState({
    title: "",
    description: "",
    technologies: "",
    project_url: "",
    github_url: "",
    image_url: ""
  });

  useEffect(() => {
    if (user?.id) {
      setPortLoading(true);
      api.get(`/users/${user.id}/portfolio`)
        .then(({ data }) => setPortfolio(data.data.portfolio || []))
        .catch(() => {})
        .finally(() => setPortLoading(false));
    }
  }, [user?.id]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setP = (k) => (e) => setPortForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setMsg({ type: "error", text: "Name is required." }); return; }
    setLoading(true);
    setMsg({ type: "", text: "" });
    try {
      const { data } = await api.put("/auth/me", form);
      updateUser(data.data.user);
      setMsg({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to save profile." });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPortModal = (item = null) => {
    if (item) {
      setEditItem(item);
      setPortForm({
        title: item.title || "",
        description: item.description || "",
        technologies: item.technologies || "",
        project_url: item.project_url || "",
        github_url: item.github_url || "",
        image_url: item.image_url || ""
      });
    } else {
      setEditItem(null);
      setPortForm({ title: "", description: "", technologies: "", project_url: "", github_url: "", image_url: "" });
    }
    setShowPortModal(true);
  };

  const handleSavePortfolio = async (e) => {
    e.preventDefault();
    if (!portForm.title.trim()) return;

    try {
      if (editItem) {
        const { data } = await api.put(`/users/portfolio/${editItem.id}`, portForm);
        setPortfolio(portfolio.map(p => p.id === editItem.id ? data.data.item : p));
      } else {
        const { data } = await api.post("/users/portfolio", portForm);
        setPortfolio([data.data.item, ...portfolio]);
      }
      setShowPortModal(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save portfolio item.");
    }
  };

  const handleDeletePortfolio = async (id) => {
    if (!window.confirm("Are you sure you want to delete this portfolio item?")) return;
    try {
      await api.delete(`/users/portfolio/${id}`);
      setPortfolio(portfolio.filter(p => p.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete item.");
    }
  };

  return (
    <div style={{ minHeight: "calc(100vh - var(--nav-height))", background: "var(--gray-50)", padding: "40px 0 80px" }}>
      <div className="container-sm">
        {/* Profile Header Card */}
        <div className="profile-header" style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 20 }}>
          <div className="profile-avatar-large">
            {user?.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <div className="profile-name">{user?.name}</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
              <span className={`badge ${user?.role === "instructor" ? "badge-primary" : "badge-success"}`}>
                {user?.role === "instructor" ? "👨‍🏫 Instructor" : "🎓 Student"}
              </span>
              <span className="badge badge-secondary">⭐ {user?.rating_avg || 0} ({user?.rating_count || 0} reviews)</span>
              <span className="badge badge-info">💼 {user?.completed_projects_count || 0} projects completed</span>
            </div>
            <div className="profile-email" style={{ marginTop: 4 }}>{user?.email}</div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <button
            className={`btn ${activeTab === "profile" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setActiveTab("profile")}
          >
            👤 Edit Profile & Skills
          </button>
          <button
            className={`btn ${activeTab === "portfolio" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setActiveTab("portfolio")}
          >
            🎨 Portfolio Items ({portfolio.length})
          </button>
        </div>

        {activeTab === "profile" && (
          <div className="card">
            <div className="card-body">
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.2rem", marginBottom: 20 }}>
                Personal Information & Socials
              </h2>

              {msg.text && <div className={`alert alert-${msg.type}`} style={{ marginBottom: 16 }}>{msg.text}</div>}

              <form onSubmit={handleSaveProfile}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-input" value={form.name} onChange={set("name")} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email (Immutable)</label>
                    <input className="form-input" value={user?.email || ""} disabled style={{ background: "var(--gray-100)" }} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Bio & Overview</label>
                  <textarea className="form-textarea" rows={3} value={form.bio} onChange={set("bio")} placeholder="Describe your background and expertise..." />
                </div>

                <div className="form-group">
                  <label className="form-label">Skills (Comma-separated)</label>
                  <input className="form-input" value={form.skills} onChange={set("skills")} placeholder="React, Node.js, Python, UI Design, AWS" />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Primary Expertise</label>
                    <input className="form-input" value={form.expertise} onChange={set("expertise")} placeholder="Full-Stack Web Development" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Education / Qualification</label>
                    <input className="form-input" value={form.education} onChange={set("education")} placeholder="B.Tech Computer Science" />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">GitHub URL</label>
                    <input className="form-input" value={form.github_url} onChange={set("github_url")} placeholder="https://github.com/username" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">LinkedIn URL</label>
                    <input className="form-input" value={form.linkedin_url} onChange={set("linkedin_url")} placeholder="https://linkedin.com/in/username" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Personal Website</label>
                    <input className="form-input" value={form.website_url} onChange={set("website_url")} placeholder="https://mywebsite.dev" />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Saving..." : "Save Profile Changes"}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === "portfolio" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.2rem" }}>
                My Portfolio Showcases
              </h2>
              <button className="btn btn-primary btn-sm" onClick={() => handleOpenPortModal()}>
                + Add Portfolio Item
              </button>
            </div>

            {portLoading ? (
              <div className="text-center" style={{ padding: 40 }}>Loading portfolio...</div>
            ) : portfolio.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🎨</div>
                <div className="empty-state-title">No Portfolio Items Yet</div>
                <div className="empty-state-desc">Showcase your completed projects and repositories to potential clients.</div>
                <button className="btn btn-primary btn-sm mt-4" onClick={() => handleOpenPortModal()}>
                  + Add First Item
                </button>
              </div>
            ) : (
              <div className="card-grid">
                {portfolio.map((item) => (
                  <div key={item.id} className="card">
                    <div className="card-body">
                      <h3 style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--gray-900)" }}>{item.title}</h3>
                      <p style={{ fontSize: "0.85rem", color: "var(--gray-600)", margin: "8px 0" }}>{item.description}</p>

                      {item.technologies && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
                          {item.technologies.split(",").map((tech, i) => (
                            <span key={i} className="tag">{tech.trim()}</span>
                          ))}
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 8, fontSize: "0.8rem", marginBottom: 12 }}>
                        {item.project_url && <a href={item.project_url} target="_blank" rel="noreferrer" style={{ color: "var(--brand-primary)" }}>🔗 Demo Link</a>}
                        {item.github_url && <a href={item.github_url} target="_blank" rel="noreferrer" style={{ color: "var(--gray-700)" }}>💻 GitHub Code</a>}
                      </div>

                      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => handleOpenPortModal(item)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeletePortfolio(item.id)}>Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Modal */}
            {showPortModal && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyCenter: "center", zIndex: 1000, padding: 20 }}>
                <div className="card" style={{ maxWidth: 500, width: "100%", background: "#fff", margin: "auto" }}>
                  <div className="card-body">
                    <h3 style={{ fontWeight: 800, marginBottom: 16 }}>{editItem ? "Edit Portfolio Item" : "Add Portfolio Item"}</h3>
                    <form onSubmit={handleSavePortfolio}>
                      <div className="form-group">
                        <label className="form-label">Title</label>
                        <input className="form-input" value={portForm.title} onChange={setP("title")} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea className="form-textarea" rows={3} value={portForm.description} onChange={setP("description")} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Technologies (Comma-separated)</label>
                        <input className="form-input" value={portForm.technologies} onChange={setP("technologies")} placeholder="React, Node.js, MongoDB" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Live Demo URL</label>
                        <input className="form-input" value={portForm.project_url} onChange={setP("project_url")} placeholder="https://myproject.com" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">GitHub Repository URL</label>
                        <input className="form-input" value={portForm.github_url} onChange={setP("github_url")} placeholder="https://github.com/repo" />
                      </div>
                      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                        <button type="button" className="btn btn-outline" onClick={() => setShowPortModal(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Save Item</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
