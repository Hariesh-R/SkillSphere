// src/pages/PublicProfile.jsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";

export default function PublicProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/users/${id}`)
      .then(({ data }) => setProfile(data.data))
      .catch((err) => setError(err.response?.data?.message || "User profile not found."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="container" style={{ padding: "80px 0", textAlign: "center" }}>Loading freelancer profile...</div>;
  }

  if (error || !profile) {
    return (
      <div className="container" style={{ padding: "80px 0", textAlign: "center" }}>
        <h2>User Profile Not Found</h2>
        <p className="text-muted mt-4">{error}</p>
        <Link to="/freelance" className="btn btn-primary mt-4">Back to Freelance Marketplace</Link>
      </div>
    );
  }

  const { user, portfolio, completedProjects, reviews } = profile;
  const skillsList = user.skills ? (typeof user.skills === "string" ? user.skills.split(",") : user.skills) : [];

  return (
    <div style={{ minHeight: "calc(100vh - var(--nav-height))", background: "var(--gray-50)", padding: "40px 0 80px" }}>
      <div className="container">
        {/* Profile Card */}
        <div className="card" style={{ marginBottom: 32 }}>
          <div className="card-body" style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
            <div className="profile-avatar-large">
              {user.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.6rem" }}>{user.name}</h1>
                <span className={`badge ${user.role === "instructor" ? "badge-primary" : "badge-success"}`}>
                  {user.role}
                </span>
              </div>

              {user.expertise && <p style={{ fontWeight: 600, color: "var(--brand-primary)", marginTop: 4 }}>{user.expertise}</p>}
              {user.bio && <p style={{ color: "var(--gray-600)", marginTop: 8 }}>{user.bio}</p>}

              <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap", fontSize: "0.9rem" }}>
                <span>⭐ <strong>{user.rating_avg || 0}</strong> ({user.rating_count || 0} reviews)</span>
                <span>💼 <strong>{user.completed_projects_count || 0}</strong> Completed Projects</span>
                {user.education && <span>🎓 {user.education}</span>}
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                {user.github_url && <a href={user.github_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">💻 GitHub</a>}
                {user.linkedin_url && <a href={user.linkedin_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">🔗 LinkedIn</a>}
                {user.website_url && <a href={user.website_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">🌐 Website</a>}
              </div>
            </div>
          </div>
        </div>

        {/* Skills */}
        {skillsList.length > 0 && (
          <div className="card" style={{ marginBottom: 32 }}>
            <div className="card-body">
              <h3 style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 12 }}>Skills & Technologies</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {skillsList.map((sk, i) => (
                  <span key={i} className="chip">{sk.trim()}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Portfolio Showcase */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.3rem", marginBottom: 16 }}>
            Portfolio Showcase ({portfolio?.length || 0})
          </h2>

          {portfolio?.length === 0 ? (
            <p className="text-muted">No portfolio items added yet.</p>
          ) : (
            <div className="card-grid">
              {portfolio.map((item) => (
                <div key={item.id} className="card">
                  <div className="card-body">
                    <h3 style={{ fontWeight: 700, fontSize: "1.05rem" }}>{item.title}</h3>
                    <p style={{ fontSize: "0.85rem", color: "var(--gray-600)", margin: "8px 0" }}>{item.description}</p>
                    {item.technologies && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
                        {item.technologies.split(",").map((tech, i) => (
                          <span key={i} className="tag">{tech.trim()}</span>
                        ))}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 12, fontSize: "0.85rem" }}>
                      {item.project_url && <a href={item.project_url} target="_blank" rel="noreferrer" style={{ color: "var(--brand-primary)" }}>Demo Link 🔗</a>}
                      {item.github_url && <a href={item.github_url} target="_blank" rel="noreferrer" style={{ color: "var(--gray-700)" }}>GitHub Code 💻</a>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Verified Reviews */}
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.3rem", marginBottom: 16 }}>
            Client Reviews ({reviews?.length || 0})
          </h2>

          {reviews?.length === 0 ? (
            <p className="text-muted">No reviews received yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {reviews.map((rev) => (
                <div key={rev.id} className="card">
                  <div className="card-body">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 700 }}>{rev.reviewer_name}</span>
                      <span style={{ color: "var(--warning)", fontWeight: 700 }}>{"★".repeat(rev.rating)}</span>
                    </div>
                    {rev.comment && <p style={{ fontSize: "0.9rem", color: "var(--gray-700)", marginTop: 8 }}>"{rev.comment}"</p>}
                    <span style={{ fontSize: "0.75rem", color: "var(--gray-400)", display: "block", marginTop: 8 }}>{new Date(rev.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
