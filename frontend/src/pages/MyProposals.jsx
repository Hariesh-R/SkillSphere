// src/pages/MyProposals.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

export default function MyProposals() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get("/freelance/proposals/my")
      .then(({ data }) => setProposals(data.data.proposals))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: "calc(100vh - var(--nav-height))", background: "var(--gray-50)", padding: "40px 0 80px" }}>
      <div className="container-sm">
        <h1 className="page-title mb-4">My Submitted Proposals</h1>
        <p className="page-subtitle mb-8">Track your freelance proposals, client acceptance status, and active jobs</p>

        {loading ? (
          <div className="text-center" style={{ padding: 60 }}>Loading proposals...</div>
        ) : proposals.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <div className="empty-state-title">No Proposals Submitted</div>
            <div className="empty-state-desc">You haven't applied to any freelance projects yet. Browse open projects to get hired.</div>
            <Link to="/freelance" className="btn btn-primary mt-4">Browse Projects</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {proposals.map((prop) => (
              <div key={prop.id} className="card">
                <div className="card-body">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <span className="badge badge-primary">{prop.project_category}</span>
                      <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.2rem", margin: "6px 0" }}>
                        <Link to={`/freelance/${prop.project_id}`}>{prop.project_title}</Link>
                      </h3>
                      <div style={{ fontSize: "0.85rem", color: "var(--gray-500)" }}>
                        Client: <strong>{prop.client_name}</strong> • Submitted {new Date(prop.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`badge ${prop.status === "ACCEPTED" ? "badge-success" : prop.status === "REJECTED" ? "badge-danger" : "badge-warning"}`}>
                      {prop.status}
                    </span>
                  </div>

                  <div style={{ background: "var(--gray-50)", padding: 12, borderRadius: 8, margin: "12px 0", display: "flex", gap: 24, fontSize: "0.875rem" }}>
                    <div>Proposed Bid: <strong>₹{prop.proposed_price}</strong></div>
                    <div>Est. Delivery: <strong>{prop.estimated_delivery_time}</strong></div>
                  </div>

                  <p style={{ color: "var(--gray-600)", fontSize: "0.9rem", lineHeight: 1.5, marginBottom: 16 }}>
                    {prop.cover_letter}
                  </p>

                  <div style={{ display: "flex", gap: 12 }}>
                    <Link to={`/freelance/${prop.project_id}`} className="btn btn-outline btn-sm">
                      View Project
                    </Link>
                    {prop.status === "ACCEPTED" && (
                      <Link to="/messages" className="btn btn-primary btn-sm">
                        💬 Open Chat with Client
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
  );
}
