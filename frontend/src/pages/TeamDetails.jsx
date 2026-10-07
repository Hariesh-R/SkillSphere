// src/pages/TeamDetails.jsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function TeamDetails() {
  const { id } = useParams();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Application Modal
  const [selectedRole, setSelectedRole] = useState(null);
  const [appIntro, setAppIntro] = useState("");
  const [appSkills, setAppSkills] = useState("");
  const [appLoading, setAppLoading] = useState(false);
  const [appMsg, setAppMsg] = useState({ type: "", text: "" });

  // Progress Update Form
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateContent, setUpdateContent] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);

  const fetchTeamDetails = () => {
    setLoading(true);
    api.get(`/teams/${id}`)
      .then(({ data }) => setData(data.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load team project."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTeamDetails();
  }, [id]);

  if (loading) {
    return <div className="container" style={{ padding: "80px 0", textAlign: "center" }}>Loading team details...</div>;
  }

  if (error || !data) {
    return (
      <div className="container" style={{ padding: "80px 0", textAlign: "center" }}>
        <h2>Team Project Not Found</h2>
        <p className="text-muted mt-4">{error}</p>
        <Link to="/teams" className="btn btn-primary mt-4">Back to Team Finder</Link>
      </div>
    );
  }

  const { team, roles, members, updates } = data;
  const isOwner = user && user.id === team.owner_id;
  const isMember = user && members.some(m => m.user_id === user.id);

  const handleApplyRole = async (e) => {
    e.preventDefault();
    if (!selectedRole) return;
    setAppLoading(true);
    setAppMsg({ type: "", text: "" });

    try {
      await api.post(`/teams/${team.id}/apply`, {
        role_id: selectedRole.id,
        introduction: appIntro,
        skills: appSkills
      });
      setAppMsg({ type: "success", text: "Application submitted to team lead!" });
      setTimeout(() => setSelectedRole(null), 1500);
    } catch (err) {
      setAppMsg({ type: "error", text: err.response?.data?.message || "Application failed." });
    } finally {
      setAppLoading(false);
    }
  };

  const handlePostUpdate = async (e) => {
    e.preventDefault();
    if (!updateTitle || !updateContent) return;
    setUpdateLoading(true);

    try {
      await api.post(`/teams/${team.id}/updates`, {
        title: updateTitle,
        content: updateContent
      });
      setUpdateTitle("");
      setUpdateContent("");
      fetchTeamDetails();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to post update.");
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "calc(100vh - var(--nav-height))", background: "var(--gray-50)", padding: "40px 0 80px" }}>
      <div className="container">
        {/* Main Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 32 }}>
          {/* Left Column */}
          <div>
            <div className="card" style={{ marginBottom: 32 }}>
              <div className="card-body">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span className="badge badge-primary">{team.category}</span>
                  <span className="badge badge-success">👥 {members.length} / {team.member_limit} members</span>
                </div>

                <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.8rem", marginBottom: 12 }}>
                  {team.title}
                </h1>

                <p style={{ color: "var(--gray-700)", lineHeight: 1.7, marginBottom: 20 }}>
                  {team.description}
                </p>

                {team.goals && (
                  <div style={{ background: "var(--gray-50)", padding: 16, borderRadius: 8, marginBottom: 20 }}>
                    <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 4 }}>🎯 Project Goals</h4>
                    <p style={{ fontSize: "0.9rem", color: "var(--gray-700)" }}>{team.goals}</p>
                  </div>
                )}

                {team.github_url && (
                  <a href={team.github_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                    💻 View GitHub Repository 🔗
                  </a>
                )}
              </div>
            </div>

            {/* Open Recruitment Roles */}
            <div className="card" style={{ marginBottom: 32 }}>
              <div className="card-body">
                <h3 style={{ fontWeight: 800, fontSize: "1.2rem", marginBottom: 16 }}>Open Recruitment Roles</h3>

                {roles.filter(r => r.is_open === 1).length === 0 ? (
                  <p className="text-muted">All positions for this team have been filled.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {roles.filter(r => r.is_open === 1).map((r) => (
                      <div key={r.id} style={{ border: "1px solid var(--gray-200)", padding: 16, borderRadius: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong style={{ fontSize: "1.05rem" }}>{r.role_name}</strong>
                          <span className="badge badge-secondary">{r.slots_total - r.slots_filled} available slot(s)</span>
                        </div>
                        {r.description && <p style={{ fontSize: "0.875rem", color: "var(--gray-600)", margin: "6px 0" }}>{r.description}</p>}
                        {r.required_skills && (
                          <div style={{ marginTop: 8 }}>
                            <span className="tag">Skills: {r.required_skills.replace(/[[\]"]/g, "")}</span>
                          </div>
                        )}

                        {user && !isOwner && !isMember && (
                          <button
                            className="btn btn-primary btn-sm mt-4"
                            onClick={() => { setSelectedRole(r); setAppMsg({ type: "", text: "" }); }}
                          >
                            Apply for this Role
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Progress Updates Feed */}
            <div className="card">
              <div className="card-body">
                <h3 style={{ fontWeight: 800, fontSize: "1.2rem", marginBottom: 16 }}>Team Progress Feed</h3>

                {(isOwner || isMember) && (
                  <form onSubmit={handlePostUpdate} style={{ marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid var(--gray-200)" }}>
                    <div className="form-group">
                      <input
                        className="form-input"
                        placeholder="Update Title (e.g. Completed Sprint 1 Backend Setup)"
                        value={updateTitle}
                        onChange={(e) => setUpdateTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <textarea
                        className="form-textarea"
                        rows={3}
                        placeholder="Share progress updates, code milestones, or task completion..."
                        value={updateContent}
                        onChange={(e) => setUpdateContent(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={updateLoading}>
                      Post Team Update
                    </button>
                  </form>
                )}

                {updates?.length === 0 ? (
                  <p className="text-muted">No progress updates posted yet.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {updates.map((up) => (
                      <div key={up.id} style={{ borderLeft: "3px solid var(--brand-primary)", paddingLeft: 16 }}>
                        <div style={{ fontWeight: 700 }}>{up.title}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--gray-500)" }}>
                          By {up.author_name} • {new Date(up.created_at).toLocaleDateString()}
                        </div>
                        <p style={{ fontSize: "0.9rem", color: "var(--gray-700)", marginTop: 6 }}>{up.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Members & Lead */}
          <div>
            <div className="card">
              <div className="card-body">
                <h4 style={{ fontWeight: 800, fontSize: "1rem", marginBottom: 16 }}>Team Members ({members.length})</h4>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {members.map((m) => (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="navbar-avatar">
                        {m.name?.[0]?.toUpperCase() || "M"}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{m.name}</div>
                        <span className="tag" style={{ fontSize: "0.7rem" }}>{m.role_name}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {isOwner && (
                  <Link to="/teams/my-teams" className="btn btn-primary btn-sm btn-full mt-4">
                    Manage Applications 📥
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Role Application Modal */}
        {selectedRole && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
            <div className="card" style={{ maxWidth: 500, width: "100%", background: "#fff", margin: "auto" }}>
              <div className="card-body">
                <h3 style={{ fontWeight: 800, marginBottom: 8 }}>Apply for {selectedRole.role_name}</h3>
                <p className="text-muted text-sm mb-4">Introduce yourself to team lead {team.owner_name}</p>

                {appMsg.text && <div className={`alert alert-${appMsg.type}`} style={{ marginBottom: 16 }}>{appMsg.text}</div>}

                <form onSubmit={handleApplyRole}>
                  <div className="form-group">
                    <label className="form-label">Short Introduction & Interest *</label>
                    <textarea
                      className="form-textarea"
                      rows={4}
                      placeholder="Why would you like to join this project team? Mention your background..."
                      value={appIntro}
                      onChange={(e) => setAppIntro(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Relevant Skills & Experience</label>
                    <input
                      className="form-input"
                      placeholder="e.g. React, Node.js, Git, Figma"
                      value={appSkills}
                      onChange={(e) => setAppSkills(e.target.value)}
                    />
                  </div>

                  <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                    <button type="button" className="btn btn-outline" onClick={() => setSelectedRole(null)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={appLoading}>
                      {appLoading ? "Submitting..." : "Submit Application"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
