// src/pages/Profile.jsx
import { useState, useEffect } from "react";
import {
  User,
  FolderGit2,
  Star,
  Briefcase,
  GraduationCap,
  GitBranch,
  Share2,
  Globe,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  X,
  CheckCircle2,
  AlertCircle,
  Save,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import Footer from "../components/Footer";

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
    website_url: user?.website_url || "",
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
    image_url: "",
  });

  useEffect(() => {
    if (user?.id) {
      setPortLoading(true);
      api
        .get(`/users/${user.id}/portfolio`)
        .then(({ data }) => setPortfolio(data.data.portfolio || []))
        .catch(() => {})
        .finally(() => setPortLoading(false));
    }
  }, [user?.id]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setP = (k) => (e) => setPortForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setMsg({ type: "error", text: "Name is required." });
      return;
    }
    setLoading(true);
    setMsg({ type: "", text: "" });
    try {
      const { data } = await api.put("/auth/me", form);
      updateUser(data.data.user);
      setMsg({ type: "success", text: "Profile details updated successfully!" });
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
        image_url: item.image_url || "",
      });
    } else {
      setEditItem(null);
      setPortForm({
        title: "",
        description: "",
        technologies: "",
        project_url: "",
        github_url: "",
        image_url: "",
      });
    }
    setShowPortModal(true);
  };

  const handleSavePortfolio = async (e) => {
    e.preventDefault();
    if (!portForm.title.trim()) return;

    try {
      if (editItem) {
        const { data } = await api.put(`/users/portfolio/${editItem.id}`, portForm);
        setPortfolio(portfolio.map((p) => (p.id === editItem.id ? data.data.item : p)));
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
      setPortfolio(portfolio.filter((p) => p.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete item.");
    }
  };

  return (
    <>
      <div style={{ minHeight: "calc(100vh - var(--nav-height))", background: "var(--gray-50)", padding: "40px 0 80px" }}>
        <div className="container-sm">
          {/* Profile Header Card */}
          <div className="profile-header">
            <div className="profile-avatar-large">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <div className="profile-name">{user?.name}</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 6 }}>
                <span className={`badge ${user?.role === "instructor" ? "badge-primary" : "badge-success"} flex gap-1`}>
                  {user?.role === "instructor" ? <GraduationCap size={12} /> : <User size={12} />}
                  {user?.role === "instructor" ? "Instructor Account" : "Student Learner"}
                </span>
                <span className="badge badge-secondary flex gap-1">
                  <Star size={11} fill="#f59e0b" color="#f59e0b" />
                  {user?.rating_avg || 0} rating ({user?.rating_count || 0} reviews)
                </span>
                <span className="badge badge-gray flex gap-1">
                  <Briefcase size={11} />
                  {user?.completed_projects_count || 0} projects completed
                </span>
              </div>
              <div className="profile-email">{user?.email}</div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
            <button
              className={`btn ${activeTab === "profile" ? "btn-primary" : "btn-outline"} flex gap-2`}
              onClick={() => setActiveTab("profile")}
            >
              <User size={15} />
              Profile Details & Skills
            </button>
            <button
              className={`btn ${activeTab === "portfolio" ? "btn-primary" : "btn-outline"} flex gap-2`}
              onClick={() => setActiveTab("portfolio")}
            >
              <FolderGit2 size={15} />
              Portfolio Showcase ({portfolio.length})
            </button>
          </div>

          {activeTab === "profile" && (
            <div className="card">
              <div className="card-body" style={{ padding: 32 }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.25rem", marginBottom: 20 }}>
                  Personal Information & Socials
                </h2>

                {msg.text && (
                  <div className={`alert alert-${msg.type}`} style={{ marginBottom: 20 }}>
                    {msg.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{msg.text}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile}>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input className="form-input" value={form.name} onChange={set("name")} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email (Immutable)</label>
                      <input
                        className="form-input"
                        value={user?.email || ""}
                        disabled
                        style={{ background: "var(--gray-100)", color: "var(--gray-500)" }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Bio & Overview</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      value={form.bio}
                      onChange={set("bio")}
                      placeholder="Describe your background, skills, and areas of passion..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Key Skills (Comma-separated)</label>
                    <input
                      className="form-input"
                      value={form.skills}
                      onChange={set("skills")}
                      placeholder="React, Node.js, Python, UI Design, AWS, Docker"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Primary Expertise</label>
                      <input
                        className="form-input"
                        value={form.expertise}
                        onChange={set("expertise")}
                        placeholder="Full-Stack Web Development"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Education / Degree</label>
                      <input
                        className="form-input"
                        value={form.education}
                        onChange={set("education")}
                        placeholder="B.Tech Computer Science"
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label">GitHub URL</label>
                      <input
                        className="form-input"
                        value={form.github_url}
                        onChange={set("github_url")}
                        placeholder="https://github.com/username"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">LinkedIn URL</label>
                      <input
                        className="form-input"
                        value={form.linkedin_url}
                        onChange={set("linkedin_url")}
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Personal Website</label>
                      <input
                        className="form-input"
                        value={form.website_url}
                        onChange={set("website_url")}
                        placeholder="https://myportfolio.dev"
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary flex gap-2" disabled={loading} style={{ marginTop: 8 }}>
                    <Save size={16} />
                    {loading ? "Saving Details…" : "Save Profile Changes"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === "portfolio" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.25rem" }}>
                  My Portfolio Showcases
                </h2>
                <button className="btn btn-primary btn-sm flex gap-1" onClick={() => handleOpenPortModal()}>
                  <Plus size={14} />
                  Add Portfolio Item
                </button>
              </div>

              {portLoading ? (
                <div className="spinner-wrap" style={{ minHeight: 200 }}>
                  <div className="spinner" />
                </div>
              ) : portfolio.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <FolderGit2 size={24} />
                  </div>
                  <h3 className="empty-state-title">No Portfolio Items Yet</h3>
                  <p className="empty-state-desc">
                    Showcase completed projects, applications, and GitHub repositories to potential clients and teammates.
                  </p>
                  <button className="btn btn-primary btn-sm mt-4 flex gap-1" onClick={() => handleOpenPortModal()} style={{ margin: "16px auto 0" }}>
                    <Plus size={14} />
                    Add First Project
                  </button>
                </div>
              ) : (
                <div className="card-grid">
                  {portfolio.map((item) => (
                    <div key={item.id} className="card">
                      <div className="card-body">
                        <h3 style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--gray-900)" }}>
                          {item.title}
                        </h3>
                        <p style={{ fontSize: "0.85rem", color: "var(--gray-600)", margin: "8px 0 12px", lineHeight: 1.6 }}>
                          {item.description}
                        </p>

                        {item.technologies && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 16 }}>
                            {item.technologies.split(",").map((tech, i) => (
                              <span key={i} className="tag">
                                {tech.trim()}
                              </span>
                            ))}
                          </div>
                        )}

                        <div style={{ display: "flex", gap: 12, fontSize: "0.8rem", marginBottom: 16, flexWrap: "wrap" }}>
                          {item.project_url && (
                            <a
                              href={item.project_url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex gap-1"
                              style={{ color: "var(--brand-primary)", fontWeight: 600, alignItems: "center" }}
                            >
                              <ExternalLink size={13} />
                              Live Demo
                            </a>
                          )}
                          {item.github_url && (
                            <a
                              href={item.github_url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex gap-1"
                              style={{ color: "var(--gray-700)", fontWeight: 600, alignItems: "center" }}
                            >
                              <GitBranch size={13} />
                              Source Code
                            </a>
                          )}
                        </div>

                        <div style={{ display: "flex", gap: 8, marginTop: 12, borderTop: "1px solid var(--gray-100)", paddingTop: 12 }}>
                          <button className="btn btn-outline btn-xs flex gap-1" onClick={() => handleOpenPortModal(item)}>
                            <Edit3 size={12} />
                            Edit
                          </button>
                          <button
                            className="btn btn-xs flex gap-1"
                            style={{ background: "var(--error-light)", color: "var(--error)", border: "1px solid var(--error-border)" }}
                            onClick={() => handleDeletePortfolio(item.id)}
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Portfolio Modal */}
              {showPortModal && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowPortModal(false)}>
                  <div className="modal" style={{ maxWidth: 500 }}>
                    <div className="modal-header">
                      <div className="modal-title">
                        {editItem ? "Edit Portfolio Item" : "Add Portfolio Showcase"}
                      </div>
                      <button className="modal-close" onClick={() => setShowPortModal(false)}>
                        <X size={18} />
                      </button>
                    </div>
                    <div className="modal-body">
                      <form id="port-form" onSubmit={handleSavePortfolio}>
                        <div className="form-group">
                          <label className="form-label">Project Title *</label>
                          <input
                            className="form-input"
                            value={portForm.title}
                            onChange={setP("title")}
                            placeholder="e.g. Distributed Task Orchestrator"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Project Summary</label>
                          <textarea
                            className="form-textarea"
                            rows={3}
                            value={portForm.description}
                            onChange={setP("description")}
                            placeholder="Briefly explain what you built and the challenges solved…"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Technologies Used</label>
                          <input
                            className="form-input"
                            value={portForm.technologies}
                            onChange={setP("technologies")}
                            placeholder="React, TypeScript, GraphQL, Docker"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Live Deployment URL</label>
                          <input
                            className="form-input"
                            value={portForm.project_url}
                            onChange={setP("project_url")}
                            placeholder="https://myproject.dev"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">GitHub Repository URL</label>
                          <input
                            className="form-input"
                            value={portForm.github_url}
                            onChange={setP("github_url")}
                            placeholder="https://github.com/username/project"
                          />
                        </div>
                      </form>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-outline" onClick={() => setShowPortModal(false)}>
                        Cancel
                      </button>
                      <button type="submit" form="port-form" className="btn btn-primary">
                        Save Item
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
