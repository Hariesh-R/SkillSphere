// src/pages/PublicProfile.jsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  User,
  Star,
  Briefcase,
  GraduationCap,
  MessageSquare,
  GitBranch,
  Share2,
  Globe,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";

export default function PublicProfile() {
  const { user: currentUser } = useAuth();
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/users/${id}`)
      .then(({ data }) => setProfile(data.data))
      .catch((err) => setError(err.response?.data?.message || "User profile not found."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="spinner-wrap" style={{ minHeight: "60vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container" style={{ padding: "80px 0", textAlign: "center" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 800 }}>User Profile Not Found</h2>
        <p className="text-muted mt-4">{error}</p>
        <Link to="/freelance" className="btn btn-primary mt-4">
          Back to Freelance Marketplace
        </Link>
      </div>
    );
  }

  const { user, portfolio, completedProjects, reviews } = profile;
  const skillsList = user.skills
    ? typeof user.skills === "string"
      ? user.skills.split(",")
      : user.skills
    : [];

  return (
    <>
      <div style={{ minHeight: "calc(100vh - var(--nav-height))", background: "var(--gray-50)", padding: "40px 0 80px" }}>
        <div className="container">
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "var(--gray-500)", marginBottom: 24 }}>
            <Link to="/explore" style={{ color: "var(--brand-primary)", display: "inline-flex", alignItems: "center", gap: 4 }}>
              <ArrowLeft size={14} />
              Community
            </Link>
            <span>/</span>
            <span style={{ color: "var(--gray-700)", fontWeight: 600 }}>{user.name}</span>
          </div>

          {/* Profile Card */}
          <div className="card" style={{ marginBottom: 32 }}>
            <div className="card-body" style={{ display: "flex", gap: 28, flexWrap: "wrap", alignItems: "center" }}>
              <div className="profile-avatar-large">
                {user.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.8rem", color: "var(--gray-900)" }}>
                    {user.name}
                  </h1>
                  <span className={`badge ${user.role === "instructor" ? "badge-primary" : "badge-success"} flex gap-1`}>
                    {user.role === "instructor" ? <GraduationCap size={12} /> : <User size={12} />}
                    {user.role}
                  </span>
                </div>

                {user.expertise && (
                  <p style={{ fontWeight: 600, color: "var(--brand-primary)", marginTop: 6, fontSize: "1rem" }}>
                    {user.expertise}
                  </p>
                )}
                {user.bio && (
                  <p style={{ color: "var(--gray-600)", marginTop: 8, lineHeight: 1.65, fontSize: "0.95rem" }}>
                    {user.bio}
                  </p>
                )}

                <div style={{ display: "flex", gap: 20, marginTop: 16, flexWrap: "wrap", fontSize: "0.875rem", color: "var(--gray-600)" }}>
                  <div className="flex gap-1" style={{ alignItems: "center" }}>
                    <Star size={14} fill="#f59e0b" color="#f59e0b" />
                    <strong>{user.rating_avg || 0}</strong> ({user.rating_count || 0} reviews)
                  </div>
                  <div className="flex gap-1" style={{ alignItems: "center" }}>
                    <Briefcase size={14} color="var(--brand-primary)" />
                    <strong>{user.completed_projects_count || completedProjects?.length || 0}</strong> Completed Projects
                  </div>
                  {user.education && (
                    <div className="flex gap-1" style={{ alignItems: "center" }}>
                      <GraduationCap size={14} color="var(--gray-500)" />
                      <span>{user.education}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap", alignItems: "center" }}>
                  {currentUser && currentUser.id !== user.id && (
                    <Link
                      to={`/messages?userId=${user.id}`}
                      className="btn btn-primary btn-sm flex gap-2"
                    >
                      <MessageSquare size={14} />
                      Message {user.name}
                    </Link>
                  )}
                  {user.github_url && (
                    <a href={user.github_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm flex gap-1">
                      <GitBranch size={14} />
                      GitHub
                    </a>
                  )}
                  {user.linkedin_url && (
                    <a href={user.linkedin_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm flex gap-1">
                      <Share2 size={14} />
                      LinkedIn
                    </a>
                  )}
                  {user.website_url && (
                    <a href={user.website_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm flex gap-1">
                      <Globe size={14} />
                      Website
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Skills */}
          {skillsList.length > 0 && (
            <div className="card" style={{ marginBottom: 32 }}>
              <div className="card-body">
                <h3 style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: 14 }}>
                  Skills & Core Competencies
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {skillsList.map((sk, i) => (
                    <span key={i} className="chip">
                      {sk.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Portfolio Showcase */}
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.35rem", marginBottom: 18 }}>
              Portfolio Showcases ({portfolio?.length || 0})
            </h2>

            {portfolio?.length === 0 ? (
              <p className="text-muted" style={{ fontSize: "0.9rem" }}>No portfolio items showcased yet.</p>
            ) : (
              <div className="card-grid">
                {portfolio.map((item) => (
                  <div key={item.id} className="card card-hoverable">
                    <div className="card-body">
                      <h3 style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--gray-900)" }}>
                        {item.title}
                      </h3>
                      <p style={{ fontSize: "0.85rem", color: "var(--gray-600)", margin: "8px 0 12px", lineHeight: 1.6 }}>
                        {item.description}
                      </p>
                      {item.technologies && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 14 }}>
                          {item.technologies.split(",").map((tech, i) => (
                            <span key={i} className="tag">
                              {tech.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 14, fontSize: "0.85rem" }}>
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
                            Code
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Verified Reviews */}
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.35rem", marginBottom: 18 }}>
              Client & Peer Reviews ({reviews?.length || 0})
            </h2>

            {reviews?.length === 0 ? (
              <p className="text-muted" style={{ fontSize: "0.9rem" }}>No reviews received yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {reviews.map((rev) => (
                  <div key={rev.id} className="card">
                    <div className="card-body">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 700, color: "var(--gray-900)" }}>
                          {rev.reviewer_name}
                        </span>
                        <div className="flex gap-1" style={{ alignItems: "center" }}>
                          {[1, 2, 3, 4, 5].map((st) => (
                            <Star
                              key={st}
                              size={14}
                              fill={st <= rev.rating ? "#f59e0b" : "none"}
                              color={st <= rev.rating ? "#f59e0b" : "var(--gray-300)"}
                            />
                          ))}
                        </div>
                      </div>
                      {rev.comment && (
                        <p style={{ fontSize: "0.9rem", color: "var(--gray-700)", marginTop: 8, lineHeight: 1.6 }}>
                          "{rev.comment}"
                        </p>
                      )}
                      <span style={{ fontSize: "0.75rem", color: "var(--gray-400)", display: "block", marginTop: 8 }}>
                        {new Date(rev.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
