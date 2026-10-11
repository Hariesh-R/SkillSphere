// src/pages/MyTeams.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Plus,
  ExternalLink,
  Check,
  X,
  UserCheck,
  Inbox,
  ArrowRight,
} from "lucide-react";
import api from "../api/axios";
import Footer from "../components/Footer";

export default function MyTeams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [applications, setApplications] = useState([]);
  const [appLoading, setAppLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get("/teams/my-teams")
      .then(({ data }) => {
        const list = data.data.teams || [];
        setTeams(list);
        if (list.length > 0) {
          handleSelectTeam(list[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSelectTeam = (t) => {
    setSelectedTeam(t);
    if (t.is_owner) {
      setAppLoading(true);
      api
        .get(`/teams/${t.id}/applications`)
        .then(({ data }) => setApplications(data.data.applications || []))
        .catch(() => setApplications([]))
        .finally(() => setAppLoading(false));
    }
  };

  const handleAcceptApplication = async (appId) => {
    try {
      await api.patch(`/teams/applications/${appId}/accept`);
      alert("Application accepted! Member added to your team.");
      handleSelectTeam(selectedTeam);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to accept application.");
    }
  };

  const handleRejectApplication = async (appId) => {
    try {
      await api.patch(`/teams/applications/${appId}/reject`);
      setApplications(applications.map((a) => (a.id === appId ? { ...a, status: "REJECTED" } : a)));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject application.");
    }
  };

  return (
    <>
      <div style={{ minHeight: "calc(100vh - var(--nav-height))", background: "var(--gray-50)", padding: "40px 0 80px" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
            <div>
              <div className="badge badge-primary mb-2">Team Management</div>
              <h1 className="page-title">My Teams Dashboard</h1>
              <p className="page-subtitle">
                Manage collaborative ventures you lead or contribute to as an active member
              </p>
            </div>
            <Link to="/teams/post" className="btn btn-primary flex gap-2">
              <Plus size={16} />
              Create Team Project
            </Link>
          </div>

          {loading ? (
            <div className="spinner-wrap" style={{ minHeight: 280 }}>
              <div className="spinner" />
            </div>
          ) : teams.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Users size={24} />
              </div>
              <h2 className="empty-state-title">No Teams Yet</h2>
              <p className="empty-state-desc">
                You are not currently part of any team projects. Apply to open roles or create your own team project.
              </p>
              <Link to="/teams" className="btn btn-primary btn-sm mt-4">
                Find Teams
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 28, alignItems: "start" }}>
              {/* Left: Teams Sidebar */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {teams.map((t) => {
                  const isSelected = selectedTeam?.id === t.id;
                  return (
                    <div
                      key={t.id}
                      className="card"
                      style={{
                        cursor: "pointer",
                        borderLeft: isSelected ? "4px solid var(--brand-primary)" : "1px solid var(--gray-200)",
                        background: isSelected ? "var(--brand-primary-subtle)" : "#ffffff",
                        transition: "all var(--transition-fast)",
                      }}
                      onClick={() => handleSelectTeam(t)}
                    >
                      <div className="card-body" style={{ padding: 18 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <span className="badge badge-primary">{t.category}</span>
                          {t.is_owner && <span className="badge badge-violet">Team Lead</span>}
                        </div>
                        <h4 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--gray-900)", marginBottom: 8 }}>
                          {t.title}
                        </h4>
                        <div className="flex gap-1" style={{ alignItems: "center", fontSize: "0.8125rem", color: "var(--gray-500)" }}>
                          <Users size={13} />
                          <span>
                            {t.current_member_count} / {t.member_limit} members
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right: Selected Team Management */}
              {selectedTeam && (
                <div>
                  <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-body">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                        <div>
                          <div className="flex gap-2 mb-2" style={{ alignItems: "center" }}>
                            <span className="badge badge-primary">{selectedTeam.category}</span>
                            {selectedTeam.is_owner && <span className="badge badge-violet">You are Team Lead</span>}
                          </div>
                          <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--gray-900)" }}>
                            {selectedTeam.title}
                          </h2>
                          <div style={{ fontSize: "0.85rem", color: "var(--gray-500)", marginTop: 4 }}>
                            Created by <strong>{selectedTeam.owner_name}</strong> • {selectedTeam.current_member_count} / {selectedTeam.member_limit} members
                          </div>
                        </div>
                        <Link to={`/teams/${selectedTeam.id}`} className="btn btn-outline btn-sm flex gap-1">
                          View Team Page
                          <ExternalLink size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Team Members List */}
                  <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-body">
                      <h3 style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: 14 }}>
                        Current Team Roster
                      </h3>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                        {selectedTeam.members?.map((m) => (
                          <div
                            key={m.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              background: "var(--gray-50)",
                              padding: "10px 14px",
                              borderRadius: "var(--radius-md)",
                              border: "1px solid var(--gray-200)",
                            }}
                          >
                            <div className="navbar-avatar" style={{ width: 34, height: 34, fontSize: "0.8rem" }}>
                              {m.name?.[0]?.toUpperCase()}
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
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Owner Application Management */}
                  {selectedTeam.is_owner && (
                    <div>
                      <h3 style={{ fontWeight: 800, fontSize: "1.2rem", marginBottom: 16 }}>
                        Candidate Applications ({applications.length})
                      </h3>

                      {appLoading ? (
                        <div className="spinner-wrap" style={{ minHeight: 180 }}>
                          <div className="spinner" />
                        </div>
                      ) : applications.length === 0 ? (
                        <div className="empty-state">
                          <div className="empty-state-icon">
                            <Inbox size={24} />
                          </div>
                          <h4 className="empty-state-title">No Applications Received Yet</h4>
                          <p className="empty-state-desc">
                            When peers apply to open recruitment roles on this team, their applications will show up here.
                          </p>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          {applications.map((app) => (
                            <div key={app.id} className="card">
                              <div className="card-body">
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                                  <div>
                                    <span className="badge badge-primary">{app.role_name}</span>
                                    <h4 style={{ fontWeight: 700, marginTop: 6, fontSize: "1rem" }}>
                                      Applicant: {app.applicant_name}
                                    </h4>
                                  </div>
                                  <span
                                    className={`badge ${
                                      app.status === "ACCEPTED"
                                        ? "badge-success"
                                        : app.status === "REJECTED"
                                        ? "badge-danger"
                                        : "badge-warning"
                                    }`}
                                  >
                                    {app.status}
                                  </span>
                                </div>

                                <p style={{ color: "var(--gray-700)", fontSize: "0.9rem", lineHeight: 1.6, margin: "10px 0" }}>
                                  {app.introduction}
                                </p>

                                {app.skills && (
                                  <div style={{ marginBottom: 14 }}>
                                    <span className="tag">Skills: {app.skills.replace(/[[\]"]/g, "")}</span>
                                  </div>
                                )}

                                {app.status === "PENDING" && (
                                  <div style={{ display: "flex", gap: 10 }}>
                                    <button
                                      className="btn btn-success btn-sm flex gap-1"
                                      onClick={() => handleAcceptApplication(app.id)}
                                    >
                                      <Check size={14} />
                                      Accept into Team
                                    </button>
                                    <button
                                      className="btn btn-outline btn-sm flex gap-1"
                                      onClick={() => handleRejectApplication(app.id)}
                                    >
                                      <X size={14} />
                                      Decline
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
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
