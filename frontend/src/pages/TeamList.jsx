// src/pages/TeamList.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Search,
  Plus,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";

const CATEGORIES = [
  "ALL",
  "Artificial Intelligence",
  "Web Development",
  "Mobile Apps",
  "Game Development",
  "Cybersecurity",
  "Design & Creative",
];

export default function TeamList() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [skill, setSkill] = useState("");

  const fetchTeams = () => {
    setLoading(true);
    const params = {
      search: search.trim() || undefined,
      category: category !== "ALL" ? category : undefined,
      skill: skill.trim() || undefined,
    };

    api
      .get("/teams", { params })
      .then(({ data }) => setTeams(data.data.teams || []))
      .catch(() => setTeams([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTeams();
  }, [category]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTeams();
  };

  return (
    <>
      <div style={{ minHeight: "calc(100vh - var(--nav-height))", background: "var(--gray-50)", padding: "40px 0 80px" }}>
        <div className="container">
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
            <div>
              <div className="badge badge-primary mb-2">Team Finder</div>
              <h1 className="page-title">Collaborative Team Projects</h1>
              <p className="page-subtitle">
                Build real-world projects with fellow student developers, designers, and engineers
              </p>
            </div>
            {user && (
              <Link to="/teams/post" className="btn btn-primary btn-lg flex gap-2">
                <Plus size={18} />
                Create Team Project
              </Link>
            )}
          </div>

          {/* Filter Bar */}
          <div className="card" style={{ marginBottom: 32 }}>
            <div className="card-body">
              <form
                onSubmit={handleSearchSubmit}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 16,
                  alignItems: "end",
                }}
              >
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Search Projects</label>
                  <input
                    className="form-input"
                    placeholder="e.g. AI Study Tool, Mobile Game"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Role or Skill Required</label>
                  <input
                    className="form-input"
                    placeholder="e.g. React, Python, UI Designer"
                    value={skill}
                    onChange={(e) => setSkill(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ height: 42 }}>
                  <Search size={16} />
                  Filter Teams
                </button>
              </form>
            </div>
          </div>

          {/* Teams Grid */}
          {loading ? (
            <div className="spinner-wrap" style={{ minHeight: 280 }}>
              <div className="spinner" />
            </div>
          ) : teams.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Users size={24} />
              </div>
              <h2 className="empty-state-title">No Team Projects Found</h2>
              <p className="empty-state-desc">
                Try clearing your search filters or start your own collaborative team project to recruit peers.
              </p>
              {user && (
                <Link to="/teams/post" className="btn btn-primary btn-sm mt-4">
                  Create Team Project
                </Link>
              )}
            </div>
          ) : (
            <div className="card-grid">
              {teams.map((t) => {
                const fillPercent = Math.min(
                  100,
                  Math.round(((t.current_member_count || 1) / (t.member_limit || 5)) * 100)
                );

                return (
                  <article
                    key={t.id}
                    className="card card-hoverable"
                    style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}
                  >
                    <div className="card-body">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span className="badge badge-primary">{t.category}</span>
                        <span className="badge badge-success flex gap-1">
                          <Users size={12} />
                          {t.current_member_count} / {t.member_limit} members
                        </span>
                      </div>

                      <div style={{ width: "100%", height: 4, background: "var(--gray-100)", borderRadius: 999, overflow: "hidden", marginBottom: 12 }}>
                        <div style={{ width: `${fillPercent}%`, height: "100%", background: fillPercent >= 100 ? "var(--warning-500)" : "var(--primary-500)", borderRadius: 999, transition: "width 0.3s ease" }} />
                      </div>

                      <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 8, color: "var(--gray-900)" }}>
                        <Link to={`/teams/${t.id}`} style={{ transition: "color 150ms ease" }}>
                          {t.title}
                        </Link>
                      </h3>

                      <p
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--gray-600)",
                          lineHeight: 1.6,
                          marginBottom: 16,
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {t.description}
                      </p>

                      {/* Open Recruitment Roles */}
                      {t.open_roles?.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <div
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              color: "var(--gray-500)",
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                              marginBottom: 8,
                            }}
                          >
                            Open Recruitment Roles
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {t.open_roles.map((r) => (
                              <span key={r.id} className="chip">
                                {r.role_name} ({r.slots_total - r.slots_filled} slot)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div
                      className="card-footer"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div className="flex gap-2" style={{ alignItems: "center", fontSize: "0.8125rem", color: "var(--gray-500)" }}>
                        <UserCheck size={14} color="var(--gray-400)" />
                        <span>Lead: <strong>{t.owner_name}</strong></span>
                      </div>
                      <Link to={`/teams/${t.id}`} className="btn btn-primary btn-sm flex gap-1">
                        View & Apply
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
