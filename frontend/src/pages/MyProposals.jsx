// src/pages/MyProposals.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Briefcase,
  Banknote,
  Clock,
  MessageSquare,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import api from "../api/axios";
import Footer from "../components/Footer";

export default function MyProposals() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get("/freelance/proposals/my")
      .then(({ data }) => setProposals(data.data.proposals || []))
      .catch(() => setProposals([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div style={{ minHeight: "calc(100vh - var(--nav-height))", background: "var(--gray-50)", padding: "40px 0 80px" }}>
        <div className="container-sm">
          <div style={{ marginBottom: 32 }}>
            <div className="badge badge-primary mb-2">Freelancer Dashboard</div>
            <h1 className="page-title">My Submitted Proposals</h1>
            <p className="page-subtitle">
              Track your freelance bids, client responses, and accepted contracts
            </p>
          </div>

          {loading ? (
            <div className="spinner-wrap" style={{ minHeight: 240 }}>
              <div className="spinner" />
            </div>
          ) : proposals.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <FileText size={24} />
              </div>
              <h2 className="empty-state-title">No Proposals Submitted Yet</h2>
              <p className="empty-state-desc">
                You haven't bid on any freelance projects. Explore open projects in the marketplace to pitch your skills.
              </p>
              <Link to="/freelance" className="btn btn-primary btn-sm mt-4">
                Browse Marketplace
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {proposals.map((prop) => (
                <div key={prop.id} className="card">
                  <div className="card-body">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <span className="badge badge-primary mb-2">{prop.project_category}</span>
                        <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "6px 0", color: "var(--gray-900)" }}>
                          <Link to={`/freelance/${prop.project_id}`} style={{ transition: "color 150ms ease" }}>
                            {prop.project_title}
                          </Link>
                        </h3>
                        <div style={{ fontSize: "0.8125rem", color: "var(--gray-500)" }}>
                          Client: <strong>{prop.client_name}</strong> • Submitted on{" "}
                          {new Date(prop.created_at).toLocaleDateString()}
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
                        padding: "12px 18px",
                        borderRadius: "var(--radius-md)",
                        margin: "14px 0",
                        display: "flex",
                        gap: 24,
                        fontSize: "0.875rem",
                      }}
                    >
                      <div className="flex gap-1" style={{ alignItems: "center" }}>
                        <Banknote size={15} color="var(--brand-primary)" />
                        <span>
                          Proposed Bid: <strong>₹{Number(prop.proposed_price).toLocaleString()}</strong>
                        </span>
                      </div>
                      <div className="flex gap-1" style={{ alignItems: "center" }}>
                        <Clock size={14} color="var(--gray-500)" />
                        <span>
                          Est. Delivery: <strong>{prop.estimated_delivery_time}</strong>
                        </span>
                      </div>
                    </div>

                    <p style={{ color: "var(--gray-600)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: 18 }}>
                      {prop.cover_letter}
                    </p>

                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <Link to={`/freelance/${prop.project_id}`} className="btn btn-outline btn-sm flex gap-1">
                        View Project
                        <ExternalLink size={13} />
                      </Link>
                      {prop.status === "ACCEPTED" && (
                        <Link to="/messages" className="btn btn-primary btn-sm flex gap-1">
                          <MessageSquare size={14} />
                          Open Direct Chat with Client
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
