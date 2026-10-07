// src/pages/TeamList.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function TeamList() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [skill, setSkill] = useState("");

  const categories = [
    "ALL",
    "Artificial Intelligence",
    "Web Development",
    "Mobile Apps",
    "Game Development",
    "Cybersecurity",
    "Design & Creative"
  ];

  const fetchTeams = () => {
    setLoading(true);
    const params = {
      search: search.trim() || undefined,
      category: category !== "ALL" ? category : undefined,
      skill: skill.trim() || undefined
    };

    api.get("/teams", { params })
      .then(({ data }) => setTeams(data.data.teams))
      .catch(() => {})
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
    <div style={{ minHeight: "calc(100vh - var(--nav-height))", background: "var(--gray-50)", padding: "40px 0 80px" }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 className="page-title">Team Finder & Collaborative Projects</h1>
            <p className="page-subtitle">Build collaborative projects with fellow student developers, designers & engineers</p>
          </div>
          {user && (
            <Link to="/teams/post" className="btn btn-primary btn-lg">
              + Create Team Project
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: 32 }}>
          <div className="card-body">
            <form onSubmit={handleSearchSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, alignItems: "end" }}>
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
                <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Role / Skill Filter</label>
                <input
                  className="form-input"
                  placeholder="e.g. React, Python, Designer"
                  value={skill}
                  onChange={(e) => setSkill(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ height: 42 }}>
                🔍 Search Teams
              </button>
            </form>
          </div>
        </div>

        {/* Team Projects Grid */}
        {loading ? (
          <div className="text-center" style={{ padding: 60 }}>Loading team projects...</div>
        ) : teams.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🚀</div>
            <div className="empty-state-title">No Teams Found</div>
            <div className="empty-state-desc">Try clearing your filters or create a new team project to recruit members.</div>
          </div>
        ) : (
          <div className="card-grid">
            {teams.map((t) => (
              <div key={t.id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div className="card-body">
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span className="badge badge-primary">{t.category}</span>
                    <span className="badge badge-success">👥 {t.current_member_count} / {t.member_limit} members</span>
                  </div>

                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.2rem", marginBottom: 8 }}>
                    <Link to={`/teams/${t.id}`}>{t.title}</Link>
                  </h3>

                  <p style={{ fontSize: "0.875rem", color: "var(--gray-600)", marginBottom: 16, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {t.description}
                  </p>

                  {t.open_roles?.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--gray-500)", marginBottom: 6 }}>OPEN RECRUITMENT ROLES</div>
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

                <div className="card-footer" style={{ background: "var(--gray-50)", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--gray-500)" }}>
                    Lead: <strong>{t.owner_name}</strong>
                  </div>
                  <Link to={`/teams/${t.id}`} className="btn btn-primary btn-sm">
                    View & Apply →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
