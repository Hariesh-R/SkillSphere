// src/pages/ClientProjects.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function ClientProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProj, setSelectedProj] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [propLoading, setPropLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get("/freelance/projects?status=ALL")
      .then(({ data }) => {
        setProjects(data.data.projects);
        if (data.data.projects.length > 0) {
          handleSelectProject(data.data.projects[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSelectProject = (proj) => {
    setSelectedProj(proj);
    setPropLoading(true);
    api.get(`/freelance/projects/${proj.id}/proposals`)
      .then(({ data }) => setProposals(data.data.proposals))
      .catch(() => setProposals([]))
      .finally(() => setPropLoading(false));
  };

  const handleAcceptProposal = async (propId) => {
    if (!window.confirm("Are you sure you want to accept this proposal and hire this freelancer?")) return;

    try {
      const { data } = await api.patch(`/freelance/proposals/${propId}/accept`);
      alert("Freelancer hired successfully! Project status updated to IN_PROGRESS.");
      navigate("/messages");
    } catch (err) {
      alert(err.response?.data?.message || "Hiring failed.");
    }
  };

  const handleRejectProposal = async (propId) => {
    try {
      await api.patch(`/freelance/proposals/${propId}/reject`);
      setProposals(proposals.map(p => p.id === propId ? { ...p, status: "REJECTED" } : p));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject proposal.");
    }
  };

  return (
    <div style={{ minHeight: "calc(100vh - var(--nav-height))", background: "var(--gray-50)", padding: "40px 0 80px" }}>
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 className="page-title">My Freelance Projects</h1>
            <p className="page-subtitle">Manage your posted projects, review proposals, and hire top freelancers</p>
          </div>
          <Link to="/freelance/post" className="btn btn-primary">+ Post New Project</Link>
        </div>

        {loading ? (
          <div className="text-center" style={{ padding: 60 }}>Loading your projects...</div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <div className="empty-state-title">No Posted Projects Yet</div>
            <div className="empty-state-desc">You haven't posted any freelance projects. Post one today to start receiving proposals.</div>
            <Link to="/freelance/post" className="btn btn-primary mt-4">+ Post a Project</Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 32 }}>
            {/* Left: Projects list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className={`card ${selectedProj?.id === proj.id ? "active" : ""}`}
                  style={{
                    cursor: "pointer",
                    borderLeft: selectedProj?.id === proj.id ? "4px solid var(--brand-primary)" : "1px solid var(--gray-200)"
                  }}
                  onClick={() => handleSelectProject(proj)}
                >
                  <div className="card-body" style={{ padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span className="badge badge-primary">{proj.category}</span>
                      <span className={`badge ${proj.status === "OPEN" ? "badge-success" : proj.status === "IN_PROGRESS" ? "badge-warning" : "badge-secondary"}`}>
                        {proj.status}
                      </span>
                    </div>
                    <h4 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--gray-900)" }}>{proj.title}</h4>
                    <div style={{ fontSize: "0.8rem", color: "var(--gray-500)", marginTop: 6 }}>
                      💰 ₹{proj.min_budget} • 📩 {proj.proposals_count} proposals
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Selected Project Proposals */}
            {selectedProj && (
              <div>
                <div className="card" style={{ marginBottom: 24 }}>
                  <div className="card-body">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.4rem" }}>{selectedProj.title}</h2>
                        <span className="text-muted">Status: <strong>{selectedProj.status}</strong> • Budget: ₹{selectedProj.min_budget}</span>
                      </div>
                      <Link to={`/freelance/${selectedProj.id}`} className="btn btn-outline btn-sm">View Details Page →</Link>
                    </div>
                  </div>
                </div>

                <h3 style={{ fontWeight: 800, fontSize: "1.2rem", marginBottom: 16 }}>
                  Received Proposals ({proposals.length})
                </h3>

                {propLoading ? (
                  <div className="text-center" style={{ padding: 40 }}>Loading proposals...</div>
                ) : proposals.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📥</div>
                    <div className="empty-state-title">No Proposals Received Yet</div>
                    <div className="empty-state-desc">Freelancers will appear here once proposals are submitted.</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {proposals.map((prop) => (
                      <div key={prop.id} className="card">
                        <div className="card-body">
                          {/* Freelancer Header */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div className="navbar-avatar">
                                {prop.freelancer_name?.[0]?.toUpperCase() || "F"}
                              </div>
                              <div>
                                <Link to={`/users/${prop.freelancer_id}`} style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--brand-primary)" }}>
                                  {prop.freelancer_name} 👤
                                </Link>
                                <div style={{ fontSize: "0.8rem", color: "var(--gray-500)" }}>
                                  ⭐ {prop.freelancer_rating || 0} ({prop.freelancer_rating_count || 0} reviews) • {prop.freelancer_completed_count || 0} completed
                                </div>
                              </div>
                            </div>
                            <span className={`badge ${prop.status === "ACCEPTED" ? "badge-success" : prop.status === "REJECTED" ? "badge-danger" : "badge-warning"}`}>
                              {prop.status}
                            </span>
                          </div>

                          <div style={{ background: "var(--gray-50)", padding: 12, borderRadius: 8, marginBottom: 12, display: "flex", gap: 24, fontSize: "0.9rem" }}>
                            <div><strong>Proposed Price:</strong> ₹{prop.proposed_price}</div>
                            <div><strong>Estimated Delivery:</strong> {prop.estimated_delivery_time}</div>
                          </div>

                          <p style={{ color: "var(--gray-700)", lineHeight: 1.6, whiteSpace: "pre-wrap", marginBottom: 16 }}>
                            {prop.cover_letter}
                          </p>

                          {/* Action Buttons */}
                          {selectedProj.status === "OPEN" && prop.status === "PENDING" && (
                            <div style={{ display: "flex", gap: 12 }}>
                              <button className="btn btn-success" onClick={() => handleAcceptProposal(prop.id)}>
                                ✓ Accept & Hire Freelancer
                              </button>
                              <button className="btn btn-outline" onClick={() => handleRejectProposal(prop.id)}>
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
    </div>
  );
}
