// src/pages/FreelanceList.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function FreelanceList() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("OPEN");
  const [budgetType, setBudgetType] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");

  const categories = [
    "ALL",
    "Web Development",
    "Mobile Apps",
    "UI/UX Design",
    "Artificial Intelligence",
    "Database & Cloud",
    "Content & Writing"
  ];

  const fetchProjects = (page = 1) => {
    setLoading(true);
    const params = {
      page,
      search: search.trim() || undefined,
      category: category !== "ALL" ? category : undefined,
      status: status !== "ALL" ? status : undefined,
      budget_type: budgetType !== "ALL" ? budgetType : undefined,
      sort_by: sortBy
    };

    api.get("/freelance/projects", { params })
      .then(({ data }) => {
        setProjects(data.data.projects);
        setPagination(data.data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProjects(1);
  }, [category, status, budgetType, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProjects(1);
  };

  return (
    <div style={{ minHeight: "calc(100vh - var(--nav-height))", background: "var(--gray-50)", padding: "40px 0 80px" }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 className="page-title">Freelance Marketplace</h1>
            <p className="page-subtitle">Discover paid freelance opportunities posted by platform clients & students</p>
          </div>
          {user && (
            <Link to="/freelance/post" className="btn btn-primary btn-lg">
              + Post a Project
            </Link>
          )}
        </div>

        {/* Filter Bar */}
        <div className="card" style={{ marginBottom: 32 }}>
          <div className="card-body">
            <form onSubmit={handleSearchSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, alignItems: "end" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Search Keywords</label>
                <input
                  className="form-input"
                  placeholder="e.g. React, Dashboard, Mobile"
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
                <label className="form-label">Status</label>
                <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="OPEN">Open for Proposals</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ALL">All Statuses</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Sort By</label>
                <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="newest">Newest First</option>
                  <option value="budget_desc">Highest Budget</option>
                  <option value="budget_asc">Lowest Budget</option>
                  <option value="deadline">Approaching Deadline</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ height: 42 }}>
                🔍 Search
              </button>
            </form>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center" style={{ padding: 60 }}>Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💼</div>
            <div className="empty-state-title">No Projects Found</div>
            <div className="empty-state-desc">Try adjusting your search criteria or post a project yourself.</div>
          </div>
        ) : (
          <div className="card-grid">
            {projects.map((proj) => (
              <div key={proj.id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div className="card-body">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <span className="badge badge-primary">{proj.category}</span>
                    <span className={`badge ${proj.status === "OPEN" ? "badge-success" : proj.status === "IN_PROGRESS" ? "badge-warning" : "badge-secondary"}`}>
                      {proj.status}
                    </span>
                  </div>

                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.15rem", marginBottom: 8, color: "var(--gray-900)" }}>
                    <Link to={`/freelance/${proj.id}`}>{proj.title}</Link>
                  </h3>

                  <p style={{ fontSize: "0.875rem", color: "var(--gray-600)", marginBottom: 16, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {proj.description}
                  </p>

                  {proj.skills_required && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                      {proj.skills_required.replace(/[[\]"]/g, "").split(",").map((s, i) => (
                        <span key={i} className="tag">{s.trim()}</span>
                      ))}
                    </div>
                  )}

                  <div style={{ borderTop: "1px solid var(--gray-100)", paddingTop: 12, display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--gray-600)" }}>
                    <div>
                      💰 <strong>₹{proj.min_budget}</strong> {proj.max_budget ? `- ₹${proj.max_budget}` : ""} ({proj.budget_type})
                    </div>
                    <div>
                      📩 <strong>{proj.proposals_count}</strong> proposals
                    </div>
                  </div>
                </div>

                <div className="card-footer" style={{ background: "var(--gray-50)", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--gray-500)" }}>
                    By <strong>{proj.client_name}</strong>
                  </div>
                  <Link to={`/freelance/${proj.id}`} className="btn btn-outline btn-sm">
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="pagination">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`page-btn ${p === pagination.page ? "active" : ""}`}
                onClick={() => fetchProjects(p)}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
