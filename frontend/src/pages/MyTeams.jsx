// src/pages/MyTeams.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

export default function MyTeams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [applications, setApplications] = useState([]);
  const [appLoading, setAppLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get("/teams/my-teams")
      .then(({ data }) => {
        setTeams(data.data.teams);
        if (data.data.teams.length > 0) {
          handleSelectTeam(data.data.teams[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSelectTeam = (t) => {
    setSelectedTeam(t);
    if (t.is_owner) {
      setAppLoading(true);
      api.get(`/teams/${t.id}/applications`)
        .then(({ data }) => setApplications(data.data.applications))
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
      setApplications(applications.map(a => a.id === appId ? { ...a, status: "REJECTED" } : a));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject application.");
    }
  };

  return (
    <div style={{ minHeight: "calc(100vh - var(--nav-height))", background: "var(--gray-50)", padding: "40px 0 80px" }}>
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 className="page-title">My Teams Dashboard</h1>
            <p className="page-subtitle">Manage collaborative projects you own or belong to as a member</p>
          </div>
          <Link to="/teams/post" className="btn btn-primary">+ Create Team Project</Link>
        </div>

        {loading ? (
          <div className="text-center" style={{ padding: 60 }}>Loading your teams...</div>
        ) : teams.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🚀</div>
            <div className="empty-state-title">No Teams Yet</div>
            <div className="empty-state-desc">You are not currently part of any team projects. Apply to open roles or create your own team.</div>
            <Link to="/teams" className="btn btn-primary mt-4">Find a Team</Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 32 }}>
            {/* Left: Teams Sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {teams.map((t) => (
                <div
                  key={t.id}
                  className="card"
                  style={{
                    cursor: "pointer",
                    borderLeft: selectedTeam?.id === t.id ? "4px solid var(--brand-primary)" : "1px solid var(--gray-200)"
                  }}
                  onClick={() => handleSelectTeam(t)}
                >
                  <div className="card-body" style={{ padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span className="badge badge-primary">{t.category}</span>
                      {t.is_owner && <span className="badge badge-secondary">Team Lead</span>}
                    </div>
                    <h4 style={{ fontWeight: 700, fontSize: "1rem" }}>{t.title}</h4>
                    <div style={{ fontSize: "0.8rem", color: "var(--gray-500)", marginTop: 6 }}>
                      👥 {t.current_member_count} / {t.member_limit} members
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Team Details & Application Management */}
            {selectedTeam && (
              <div>
                <div className="card" style={{ marginBottom: 24 }}>
                  <div className="card-body">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.4rem" }}>{selectedTeam.title}</h2>
                        <span className="text-muted">Lead: <strong>{selectedTeam.owner_name}</strong> • Category: {selectedTeam.category}</span>
                      </div>
                      <Link to={`/teams/${selectedTeam.id}`} className="btn btn-outline btn-sm">
                        View Team Page →
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Team Members List */}
                <div className="card" style={{ marginBottom: 24 }}>
                  <div className="card-body">
                    <h3 style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: 12 }}>Current Team Roster</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                      {selectedTeam.members?.map((m) => (
                        <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--gray-50)", padding: 10, borderRadius: 8 }}>
                          <div className="navbar-avatar">{m.name?.[0]?.toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{m.name}</div>
                            <span className="tag" style={{ fontSize: "0.7rem" }}>{m.role_name}</span>
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
                      Role Applications ({applications.length})
                    </h3>

                    {appLoading ? (
                      <div className="text-center" style={{ padding: 40 }}>Loading applications...</div>
                    ) : applications.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-state-icon">📥</div>
                        <div className="empty-state-title">No Applications Received Yet</div>
                        <div className="empty-state-desc">Applicants for your open roles will appear here.</div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {applications.map((app) => (
                          <div key={app.id} className="card">
                            <div className="card-body">
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                                <div>
                                  <span className="badge badge-secondary">{app.role_name}</span>
                                  <h4 style={{ fontWeight: 700, marginTop: 4 }}>Applicant: {app.applicant_name}</h4>
                                </div>
                                <span className={`badge ${app.status === "ACCEPTED" ? "badge-success" : app.status === "REJECTED" ? "badge-danger" : "badge-warning"}`}>
                                  {app.status}
                                </span>
                              </div>

                              <p style={{ color: "var(--gray-700)", fontSize: "0.9rem", margin: "8px 0" }}>{app.introduction}</p>

                              {app.skills && (
                                <div style={{ marginBottom: 12 }}>
                                  <span className="tag">Skills: {app.skills.replace(/[[\]"]/g, "")}</span>
                                </div>
                              )}

                              {app.status === "PENDING" && (
                                <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                                  <button className="btn btn-success btn-sm" onClick={() => handleAcceptApplication(app.id)}>
                                    ✓ Accept into Team
                                  </button>
                                  <button className="btn btn-outline btn-sm" onClick={() => handleRejectApplication(app.id)}>
                                    ✕ Decline
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
  );
}
