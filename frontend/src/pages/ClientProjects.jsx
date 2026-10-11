// src/pages/ClientProjects.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Briefcase,
  Plus,
  FileText,
  User,
  Star,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import api from "../api/axios";
import Footer from "../components/Footer";

export default function ClientProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProj, setSelectedProj] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [propLoading, setPropLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get("/freelance/projects?status=ALL")
      .then(({ data }) => {
        const list = data.data.projects || [];
        setProjects(list);
        if (list.length > 0) {
          handleSelectProject(list[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSelectProject = (proj) => {
    setSelectedProj(proj);
    setPropLoading(true);
    api
      .get(`/freelance/projects/${proj.id}/proposals`)
      .then(({ data }) => setProposals(data.data.proposals || []))
      .catch(() => setProposals([]))
      .finally(() => setPropLoading(false));
  };

  const handleAcceptProposal = async (propId) => {
    if (!window.confirm("Are you sure you want to accept this proposal and hire this freelancer?")) return;

    try {
      await api.patch(`/freelance/proposals/${propId}/accept`);
      alert("Freelancer hired successfully! Project status updated to IN_PROGRESS.");
      navigate("/messages");
    } catch (err) {
      alert(err.response?.data?.message || "Hiring failed.");
    }
  };

  const handleRejectProposal = async (propId) => {
    try {
      await api.patch(`/freelance/proposals/${propId}/reject`);
      setProposals(proposals.map((p) => (p.id === propId ? { ...p, status: "REJECTED" } : p)));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject proposal.");
    }
  };

  return (
    <>
      <div style={{ minHeight: "calc(100vh - var(--nav-height))", background: "var(--gray-50)", padding: "40px 0 80px" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
            <div>
              <div className="badge badge-primary mb-2">Client Portal</div>
              <h1 className="page-title">My Posted Freelance Projects</h1>
              <p className="page-subtitle">
                Review submitted proposals, inspect candidate profiles, and hire freelancers
              </p>
            </div>
            <Link to="/freelance/post" className="btn btn-primary flex gap-2">
              <Plus size={16} />
              Post New Project
            </Link>
          </div>

          {loading ? (
            <div className="spinner-wrap" style={{ minHeight: 280 }}>
              <div className="spinner" />
            </div>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Briefcase size={24} />
              </div>
              <h2 className="empty-state-title">No Projects Posted Yet</h2>
              <p className="empty-state-desc">
                You haven't posted any freelance listings. Post a project today to receive competitive bids from community developers and designers.
              </p>
              <Link to="/freelance/post" className="btn btn-primary btn-sm mt-4">
                Post Project
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 28, alignItems: "start" }}>
              {/* Left Column: Project Selector */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {projects.map((proj) => {
                  const isSelected = selectedProj?.id === proj.id;
                  return (
                    <div
                      key={proj.id}
                      className="card"
                      style={{
                        cursor: "pointer",
                        borderLeft: isSelected ? "4px solid var(--brand-primary)" : "1px solid var(--gray-200)",
                        background: isSelected ? "var(--brand-primary-subtle)" : "#ffffff",
                        transition: "all var(--transition-fast)",
                      }}
                      onClick={() => handleSelectProject(proj)}
                    >
                      <div className="card-body" style={{ padding: 18 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <span className="badge badge-primary">{proj.category}</span>
                          <span
                            className={`badge ${
                              proj.status === "OPEN"
                                ? "badge-success"
                                : proj.status === "IN_PROGRESS"
                                ? "badge-warning"
                                : "badge-gray"
                            }`}
                          >
                            {proj.status.replace("_", " ")}
                          </span>
                        </div>
                        <h4 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--gray-900)", marginBottom: 8 }}>
                          {proj.title}
                        </h4>
                        <div style={{ fontSize: "0.8125rem", color: "var(--gray-500)", display: "flex", gap: 12 }}>
                          <span>₹{Number(proj.min_budget).toLocaleString()}</span>
                          <span>•</span>
                          <span>{proj.proposals_count || 0} proposals</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Selected Project Proposals */}
              {selectedProj && (
                <div>
                  <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-body">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                        <div>
                          <div className="flex gap-2 mb-2" style={{ alignItems: "center" }}>
                            <span className="badge badge-primary">{selectedProj.category}</span>
                            <span className="badge badge-gray">{selectedProj.status.replace("_", " ")}</span>
                          </div>
                          <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--gray-900)" }}>
                            {selectedProj.title}
                          </h2>
                          <div style={{ fontSize: "0.85rem", color: "var(--gray-500)", marginTop: 4 }}>
                            Budget: ₹{Number(selectedProj.min_budget).toLocaleString()} ({selectedProj.budget_type})
                          </div>
                        </div>
                        <Link to={`/freelance/${selectedProj.id}`} className="btn btn-outline btn-sm flex gap-1">
                          View Project
                          <ExternalLink size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>

                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: 16, color: "var(--gray-900)" }}>
                    Received Proposals ({proposals.length})
                  </h3>

                  {propLoading ? (
                    <div className="spinner-wrap" style={{ minHeight: 180 }}>
                      <div className="spinner" />
                    </div>
                  ) : proposals.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <FileText size={24} />
                      </div>
                      <h4 className="empty-state-title">No Proposals Received Yet</h4>
                      <p className="empty-state-desc">
                        Freelancers are reviewing your listing. When they submit a proposal, it will appear here.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {proposals.map((prop) => (
                        <div key={prop.id} className="card">
                          <div className="card-body">
                            {/* Candidate Header */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div className="navbar-avatar">
                                  {prop.freelancer_name?.[0]?.toUpperCase() || "F"}
                                </div>
                                <div>
                                  <Link
                                    to={`/users/${prop.freelancer_id}`}
                                    style={{ fontWeight: 700, fontSize: "1rem", color: "var(--brand-primary)" }}
                                  >
                                    {prop.freelancer_name}
                                  </Link>
                                  <div className="flex gap-2" style={{ alignItems: "center", fontSize: "0.8rem", color: "var(--gray-500)", marginTop: 2 }}>
                                    <Star size={12} fill="#f59e0b" color="#f59e0b" />
                                    <span>{prop.freelancer_rating || 0} rating</span>
                                    <span>•</span>
                                    <span>{prop.freelancer_completed_count || 0} completed</span>
                                  </div>
                                </div>
                              </div>
                              <span
                                className={`badge ${
                                  prop.status === "ACCEPTED"
                                    ? "badge-success"
                                    : prop.status === "REJECTED"
                                    ? "badge-danger"
                                    : "badge-warning"
                                }`}
                              >
                                {prop.status}
                              </span>
                            </div>

                            <div
                              style={{
                                background: "var(--gray-50)",
                                padding: "12px 16px",
                                borderRadius: "var(--radius-md)",
                                marginBottom: 14,
                                display: "flex",
                                gap: 24,
                                fontSize: "0.875rem",
                              }}
                            >
                              <div>
                                Proposed Bid: <strong>₹{Number(prop.proposed_price).toLocaleString()}</strong>
                              </div>
                              <div>
                                Est. Delivery: <strong>{prop.estimated_delivery_time}</strong>
                              </div>
                            </div>

                            <p style={{ color: "var(--gray-700)", lineHeight: 1.65, fontSize: "0.9rem", whiteSpace: "pre-wrap", marginBottom: 18 }}>
                              {prop.cover_letter}
                            </p>

                            {/* Actions */}
                            {selectedProj.status === "OPEN" && prop.status === "PENDING" && (
                              <div style={{ display: "flex", gap: 10 }}>
                                <button className="btn btn-success btn-sm flex gap-1" onClick={() => handleAcceptProposal(prop.id)}>
                                  <Check size={14} />
                                  Accept & Hire Candidate
                                </button>
                                <button className="btn btn-outline btn-sm flex gap-1" onClick={() => handleRejectProposal(prop.id)}>
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
      </div>
      <Footer />
    </>
  );
}
