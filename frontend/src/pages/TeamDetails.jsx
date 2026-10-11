// src/pages/TeamDetails.jsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Users,
  Target,
  GitBranch,
  MessageSquare,
  ArrowLeft,
  Calendar,
  Send,
  X,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  UserCheck,
} from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";

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
    api
      .get(`/teams/${id}`)
      .then(({ data }) => setData(data.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load team project."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTeamDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="spinner-wrap" style={{ minHeight: "60vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container" style={{ padding: "80px 0", textAlign: "center" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 800 }}>Team Project Not Found</h2>
        <p className="text-muted mt-4">{error}</p>
        <Link to="/teams" className="btn btn-primary mt-4">
          Back to Team Finder
        </Link>
      </div>
    );
  }

  const { team, roles, members, updates } = data;
  const isOwner = user && user.id === team.owner_id;
  const isMember = user && members.some((m) => m.user_id === user.id);

  const handleApplyRole = async (e) => {
    e.preventDefault();
    if (!selectedRole) return;
    setAppLoading(true);
    setAppMsg({ type: "", text: "" });

    try {
      await api.post(`/teams/${team.id}/apply`, {
        role_id: selectedRole.id,
        introduction: appIntro,
        skills: appSkills,
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
        content: updateContent,
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
    <>
      <div style={{ minHeight: "calc(100vh - var(--nav-height))", background: "var(--gray-50)", padding: "40px 0 80px" }}>
        <div className="container">
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "var(--gray-500)", marginBottom: 24 }}>
            <Link to="/teams" style={{ color: "var(--brand-primary)", display: "inline-flex", alignItems: "center", gap: 4 }}>
              <ArrowLeft size={14} />
              Team Finder
            </Link>
            <span>/</span>
            <span style={{ color: "var(--gray-700)", fontWeight: 600 }}>{team.title}</span>
          </div>

          {/* Main Layout Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 32, alignItems: "start" }}>
            {/* Left Column */}
            <div>
              <div className="card" style={{ marginBottom: 32 }}>
                <div className="card-body">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <span className="badge badge-primary">{team.category}</span>
                    <span className="badge badge-success flex gap-1">
                      <Users size={12} />
                      {members.length} / {team.member_limit} members joined
                    </span>
                  </div>

                  <h1
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 800,
                      fontSize: "1.85rem",
                      marginBottom: 14,
                      color: "var(--gray-900)",
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {team.title}
                  </h1>

                  <p style={{ color: "var(--gray-700)", lineHeight: 1.75, marginBottom: 20, fontSize: "0.95rem" }}>
                    {team.description}
                  </p>

                  {team.goals && (
                    <div
                      style={{
                        background: "var(--brand-primary-subtle)",
                        border: "1px solid var(--brand-primary-border)",
                        padding: "16px 20px",
                        borderRadius: "var(--radius-md)",
                        marginBottom: 20,
                      }}
                    >
                      <div className="flex gap-2" style={{ alignItems: "center", marginBottom: 6 }}>
                        <Target size={16} color="var(--brand-primary)" />
                        <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--brand-primary)" }}>
                          Project Goals & Milestones
                        </h4>
                      </div>
                      <p style={{ fontSize: "0.9rem", color: "var(--gray-700)", lineHeight: 1.6 }}>{team.goals}</p>
                    </div>
                  )}

                  {team.github_url && (
                    <a
                      href={team.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline btn-sm flex gap-2"
                      style={{ width: "fit-content" }}
                    >
                      <GitBranch size={15} />
                      View Project GitHub Repository
                    </a>
                  )}
                </div>
              </div>

              {/* Open Recruitment Roles */}
              <div className="card" style={{ marginBottom: 32 }}>
                <div className="card-body">
                  <h3 style={{ fontWeight: 800, fontSize: "1.2rem", marginBottom: 16 }}>
                    Open Recruitment Roles
                  </h3>

                  {roles.filter((r) => r.is_open === 1).length === 0 ? (
                    <p className="text-muted">All positions for this team have been filled.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {roles
                        .filter((r) => r.is_open === 1)
                        .map((r) => (
                          <div
                            key={r.id}
                            style={{
                              border: "1px solid var(--gray-200)",
                              padding: 18,
                              borderRadius: "var(--radius-md)",
                              background: "var(--gray-25)",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <strong style={{ fontSize: "1.05rem", color: "var(--gray-900)" }}>
                                {r.role_name}
                              </strong>
                              <span className="badge badge-primary">
                                {r.slots_total - r.slots_filled} available slot(s)
                              </span>
                            </div>
                            {r.description && (
                              <p style={{ fontSize: "0.875rem", color: "var(--gray-600)", margin: "8px 0" }}>
                                {r.description}
                              </p>
                            )}
                            {r.required_skills && (
                              <div style={{ marginTop: 8 }}>
                                <span className="tag">
                                  Skills: {r.required_skills.replace(/[[\]"]/g, "")}
                                </span>
                              </div>
                            )}

                            {user && !isOwner && !isMember && (
                              <button
                                className="btn btn-primary btn-sm mt-4 flex gap-1"
                                onClick={() => {
                                  setSelectedRole(r);
                                  setAppMsg({ type: "", text: "" });
                                }}
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
                  <h3 style={{ fontWeight: 800, fontSize: "1.2rem", marginBottom: 16 }}>
                    Team Progress Feed
                  </h3>

                  {(isOwner || isMember) && (
                    <form
                      onSubmit={handlePostUpdate}
                      style={{
                        marginBottom: 24,
                        paddingBottom: 22,
                        borderBottom: "1px solid var(--gray-100)",
                      }}
                    >
                      <div className="form-group">
                        <label className="form-label">Update Title</label>
                        <input
                          className="form-input"
                          placeholder="e.g. Completed Sprint 1 Backend Setup"
                          value={updateTitle}
                          onChange={(e) => setUpdateTitle(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Progress Details & Commits</label>
                        <textarea
                          className="form-textarea"
                          rows={3}
                          placeholder="Share milestone progress, repository updates, or task accomplishments..."
                          value={updateContent}
                          onChange={(e) => setUpdateContent(e.target.value)}
                          required
                        />
                      </div>
                      <button type="submit" className="btn btn-primary btn-sm flex gap-1" disabled={updateLoading}>
                        <Send size={14} />
                        {updateLoading ? "Posting…" : "Post Team Update"}
                      </button>
                    </form>
                  )}

                  {updates?.length === 0 ? (
                    <p className="text-muted" style={{ fontSize: "0.875rem" }}>
                      No progress updates posted yet.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {updates.map((up) => (
                        <div
                          key={up.id}
                          style={{
                            borderLeft: "3px solid var(--brand-primary)",
                            paddingLeft: 16,
                          }}
                        >
                          <div style={{ fontWeight: 700, color: "var(--gray-900)" }}>{up.title}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--gray-400)", marginTop: 2 }}>
                            By {up.author_name} • {new Date(up.created_at).toLocaleDateString()}
                          </div>
                          <p style={{ fontSize: "0.9rem", color: "var(--gray-700)", marginTop: 6, lineHeight: 1.6 }}>
                            {up.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Sidebar: Members & Lead */}
            <aside>
              <div className="card">
                <div className="card-body">
                  {/* Team Lead */}
                  <h4 style={{ fontWeight: 800, fontSize: "0.95rem", marginBottom: 14 }}>Team Lead</h4>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 20,
                      paddingBottom: 16,
                      borderBottom: "1px solid var(--gray-100)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div className="navbar-avatar">
                        {team.owner_name?.[0]?.toUpperCase() || "L"}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--gray-900)" }}>
                          {team.owner_name}
                        </div>
                        <span className="badge badge-primary" style={{ fontSize: "0.68rem" }}>
                          Lead Creator
                        </span>
                      </div>
                    </div>
                    {user && team.owner_id && user.id !== team.owner_id && (
                      <Link
                        to={`/messages?userId=${team.owner_id}`}
                        className="btn btn-outline btn-sm flex gap-1"
                        style={{ fontSize: "0.78rem" }}
                      >
                        <MessageSquare size={13} />
                        Chat
                      </Link>
                    )}
                  </div>

                  <h4 style={{ fontWeight: 800, fontSize: "0.95rem", marginBottom: 14 }}>
                    Team Members ({members.length})
                  </h4>

                  {members.length === 0 ? (
                    <p className="text-muted" style={{ fontSize: "0.85rem" }}>
                      No team members joined yet.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {members.map((m) => (
                        <div
                          key={m.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 10,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div className="navbar-avatar" style={{ width: 32, height: 32, fontSize: "0.75rem" }}>
                              {m.name?.[0]?.toUpperCase() || "M"}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--gray-900)" }}>
                                {m.name}
                              </div>
                              <span className="tag" style={{ fontSize: "0.7rem" }}>
                                {m.role_name}
                              </span>
                            </div>
                          </div>
                          {user && m.user_id && user.id !== m.user_id && (
                            <Link
                              to={`/messages?userId=${m.user_id}`}
                              className="btn btn-ghost btn-xs"
                              aria-label={`Message ${m.name}`}
                            >
                              <MessageSquare size={14} />
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {isOwner && (
                    <Link to="/teams/my-teams" className="btn btn-primary btn-sm btn-full mt-4 flex gap-2">
                      <UserCheck size={14} />
                      Manage Team Applications
                    </Link>
                  )}
                </div>
              </div>
            </aside>
          </div>

          {/* Role Application Modal */}
          {selectedRole && (
            <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedRole(null)}>
              <div className="modal">
                <div className="modal-header">
                  <div className="modal-title">Apply for {selectedRole.role_name}</div>
                  <button className="modal-close" onClick={() => setSelectedRole(null)}>
                    <X size={18} />
                  </button>
                </div>
                <div className="modal-body">
                  <p className="text-muted text-sm mb-4">
                    Send a note to team lead <strong>{team.owner_name}</strong> to introduce your skill set and interest.
                  </p>

                  {appMsg.text && (
                    <div className={`alert alert-${appMsg.type}`} style={{ marginBottom: 16 }}>
                      {appMsg.text}
                    </div>
                  )}

                  <form onSubmit={handleApplyRole}>
                    <div className="form-group">
                      <label className="form-label">Short Introduction & Interest *</label>
                      <textarea
                        className="form-textarea"
                        rows={4}
                        placeholder="Why would you like to join this project team? Mention your background and availability..."
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
                      <button type="button" className="btn btn-outline" onClick={() => setSelectedRole(null)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={appLoading}>
                        {appLoading ? "Submitting…" : "Submit Application"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
