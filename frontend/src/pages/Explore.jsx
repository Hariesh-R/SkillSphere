// src/pages/Explore.jsx
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import WorkshopCard from "../components/WorkshopCard";

const CATEGORIES = [
  "Programming","Design","Business","Marketing","Music",
  "Photography","Health","Cooking","Language","Finance","Science","Art",
];

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Controlled filter state from URL
  const [search,    setSearch]    = useState(searchParams.get("search")   || "");
  const [category,  setCategory]  = useState(searchParams.get("category") || "");
  const [mode,      setMode]      = useState(searchParams.get("mode")     || "");
  const [minPrice,  setMinPrice]  = useState(searchParams.get("minPrice") || "");
  const [maxPrice,  setMaxPrice]  = useState(searchParams.get("maxPrice") || "");
  const [sort,      setSort]      = useState(searchParams.get("sort")     || "newest");
  const [page,      setPage]      = useState(1);

  const [workshops, setWorkshops] = useState([]);
  const [total,     setTotal]     = useState(0);
  const [pages,     setPages]     = useState(1);
  const [loading,   setLoading]   = useState(true);

  const fetchWorkshops = useCallback(async (overrides = {}) => {
    setLoading(true);
    const params = new URLSearchParams({
      search:   overrides.search   ?? search,
      category: overrides.category ?? category,
      mode:     overrides.mode     ?? mode,
      minPrice: overrides.minPrice ?? minPrice,
      maxPrice: overrides.maxPrice ?? maxPrice,
      sort:     overrides.sort     ?? sort,
      page:     overrides.page     ?? page,
      limit:    12,
    });
    // Remove empty params
    [...params.keys()].forEach((k) => { if (!params.get(k)) params.delete(k); });
    try {
      const { data } = await api.get(`/workshops?${params}`);
      setWorkshops(data.data.items);
      setTotal(data.data.total);
      setPages(data.data.pages);
    } catch {
      setWorkshops([]);
    } finally {
      setLoading(false);
    }
  }, [search, category, mode, minPrice, maxPrice, sort, page]);

  useEffect(() => {
    fetchWorkshops();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sort]);

  // Sync from URL params on mount
  useEffect(() => {
    const s = searchParams.get("search") || "";
    const c = searchParams.get("category") || "";
    if (s) setSearch(s);
    if (c) setCategory(c);
    fetchWorkshops({ search: s || search, category: c || category });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApply = () => {
    setPage(1);
    fetchWorkshops({ page: 1 });
    setSearchParams({
      ...(search   && { search }),
      ...(category && { category }),
      ...(mode     && { mode }),
      ...(minPrice && { minPrice }),
      ...(maxPrice && { maxPrice }),
      sort,
    });
  };

  const handleClear = () => {
    setSearch(""); setCategory(""); setMode(""); setMinPrice(""); setMaxPrice(""); setSort("newest"); setPage(1);
    fetchWorkshops({ search:"", category:"", mode:"", minPrice:"", maxPrice:"", sort:"newest", page:1 });
    setSearchParams({});
  };

  const handleSortChange = (e) => {
    setSort(e.target.value);
    setPage(1);
    fetchWorkshops({ sort: e.target.value, page: 1 });
  };

  return (
    <div style={{ minHeight: "calc(100vh - var(--nav-height))", background: "var(--gray-50)" }}>
      <div className="page-header" style={{ background: "#fff" }}>
        <div className="container">
          <h1 className="page-title">Explore Workshops</h1>
          <p className="page-subtitle">Find the perfect workshop to elevate your skills</p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <div className="explore-layout">

          {/* ── Sidebar Filters ─────────────────────── */}
          <aside className="filter-sidebar">
            <div className="filter-title">🔧 Filters</div>

            <div className="filter-section">
              <div className="filter-section-title">Search</div>
              <input
                className="form-input"
                placeholder="Search workshops…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApply()}
              />
            </div>

            <div className="filter-section">
              <div className="filter-section-title">Category</div>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="filter-section">
              <div className="filter-section-title">Mode</div>
              {["", "online", "offline"].map((m) => (
                <label key={m} className="filter-option">
                  <input
                    type="radio" name="mode" value={m}
                    checked={mode === m}
                    onChange={() => setMode(m)}
                  />
                  <label>{m === "" ? "Any" : m === "online" ? "🌐 Online" : "📍 Offline"}</label>
                </label>
              ))}
            </div>

            <div className="filter-section">
              <div className="filter-section-title">Price Range</div>
              <div className="price-inputs">
                <input
                  className="price-input"
                  placeholder="Min ₹"
                  type="number" min="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <input
                  className="price-input"
                  placeholder="Max ₹"
                  type="number" min="0"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="filter-actions">
              <button className="btn btn-primary" onClick={handleApply}>
                Apply Filters
              </button>
              <button className="btn btn-outline" onClick={handleClear}>
                Clear All
              </button>
            </div>
          </aside>

          {/* ── Results ─────────────────────────────── */}
          <div>
            <div className="sort-row">
              <div className="results-count">
                {loading ? "Loading…" : `${total} workshop${total !== 1 ? "s" : ""} found`}
              </div>
              <select
                className="form-select"
                style={{ width: "auto", fontSize: "0.875rem" }}
                value={sort}
                onChange={handleSortChange}
              >
                <option value="newest">Newest First</option>
                <option value="rating">Top Rated</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="title">Title A–Z</option>
              </select>
            </div>

            {loading ? (
              <div className="spinner-wrap"><div className="spinner" /></div>
            ) : workshops.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <div className="empty-state-title">No workshops found</div>
                <div className="empty-state-desc">Try adjusting your filters or search term.</div>
              </div>
            ) : (
              <div className="grid-3">
                {workshops.map((w) => <WorkshopCard key={w.id} workshop={w} />)}
              </div>
            )}

            {/* Pagination */}
            {pages > 1 && (
              <div className="pagination">
                <button
                  className="page-btn"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >‹</button>
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`page-btn${p === page ? " active" : ""}`}
                    onClick={() => setPage(p)}
                  >{p}</button>
                ))}
                <button
                  className="page-btn"
                  disabled={page >= pages}
                  onClick={() => setPage((p) => p + 1)}
                >›</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
