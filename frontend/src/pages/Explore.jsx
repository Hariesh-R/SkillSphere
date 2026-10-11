// src/pages/Explore.jsx
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  Globe,
  MapPin,
  X,
  BookOpen,
} from "lucide-react";
import api from "../api/axios";
import WorkshopCard from "../components/WorkshopCard";
import Footer from "../components/Footer";

const CATEGORIES = [
  "Programming",
  "Design",
  "Business",
  "Marketing",
  "Music",
  "Photography",
  "Health",
  "Cooking",
  "Language",
  "Finance",
  "Science",
  "Art",
];

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Controlled filter state
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [mode, setMode] = useState(searchParams.get("mode") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [page, setPage] = useState(1);

  const [workshops, setWorkshops] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchWorkshops = useCallback(
    async (overrides = {}) => {
      setLoading(true);
      const activeSearch = overrides.search !== undefined ? overrides.search : search;
      const activeCategory = overrides.category !== undefined ? overrides.category : category;
      const activeMode = overrides.mode !== undefined ? overrides.mode : mode;
      const activeMin = overrides.minPrice !== undefined ? overrides.minPrice : minPrice;
      const activeMax = overrides.maxPrice !== undefined ? overrides.maxPrice : maxPrice;
      const activeSort = overrides.sort !== undefined ? overrides.sort : sort;
      const activePage = overrides.page !== undefined ? overrides.page : page;

      const params = new URLSearchParams({
        search: activeSearch,
        category: activeCategory,
        mode: activeMode,
        minPrice: activeMin,
        maxPrice: activeMax,
        sort: activeSort,
        page: activePage,
        limit: 12,
      });

      // Remove empty params
      [...params.keys()].forEach((k) => {
        if (!params.get(k)) params.delete(k);
      });

      try {
        const { data } = await api.get(`/workshops?${params}`);
        const rawItems = data.data.items || [];
        // Deduplicate events by title so identical events show only once
        const seen = new Set();
        const uniqueItems = [];
        for (const item of rawItems) {
          const key = (item.title || "").trim().toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            uniqueItems.push(item);
          }
        }
        setWorkshops(uniqueItems);
        setTotal(data.data.total || 0);
        setPages(data.data.pages || 1);
      } catch {
        setWorkshops([]);
        setTotal(0);
        setPages(1);
      } finally {
        setLoading(false);
      }
    },
    [search, category, mode, minPrice, maxPrice, sort, page]
  );

  useEffect(() => {
    fetchWorkshops();
  }, [page, sort]);

  // Sync from URL params on mount
  useEffect(() => {
    const s = searchParams.get("search") || "";
    const c = searchParams.get("category") || "";
    if (s) setSearch(s);
    if (c) setCategory(c);
    fetchWorkshops({ search: s, category: c });
  }, []);

  const handleApply = (e) => {
    if (e) e.preventDefault();
    setPage(1);
    fetchWorkshops({ page: 1 });
    setSearchParams({
      ...(search && { search }),
      ...(category && { category }),
      ...(mode && { mode }),
      ...(minPrice && { minPrice }),
      ...(maxPrice && { maxPrice }),
      sort,
    });
  };

  const handleClear = () => {
    setSearch("");
    setCategory("");
    setMode("");
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
    setPage(1);
    fetchWorkshops({
      search: "",
      category: "",
      mode: "",
      minPrice: "",
      maxPrice: "",
      sort: "newest",
      page: 1,
    });
    setSearchParams({});
  };

  const handleSortChange = (e) => {
    const val = e.target.value;
    setSort(val);
    setPage(1);
    fetchWorkshops({ sort: val, page: 1 });
  };

  const hasActiveFilters = Boolean(search || category || mode || minPrice || maxPrice);

  return (
    <>
      <div style={{ minHeight: "calc(100vh - var(--nav-height))", background: "var(--gray-50)" }}>
        {/* Page Header */}
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div className="container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
              <div>
                <h1 className="page-title">Explore Workshops</h1>
                <p className="page-subtitle">
                  Discover live sessions taught by verified community instructors
                </p>
              </div>

              {/* Sort Selector */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "0.85rem", color: "var(--gray-500)", fontWeight: 500 }}>
                  Sort by:
                </span>
                <select
                  className="form-select"
                  value={sort}
                  onChange={handleSortChange}
                  style={{ width: "auto", minWidth: 160 }}
                >
                  <option value="newest">Newest First</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
          <div className="explore-layout">
            {/* ── Filter Sidebar ──────────────────────── */}
            <aside className="filter-sidebar" aria-label="Filters">
              <div className="filter-title">
                <span className="flex gap-2" style={{ alignItems: "center" }}>
                  <SlidersHorizontal size={17} color="var(--brand-primary)" />
                  Filter Options
                </span>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="btn btn-ghost btn-xs flex gap-1"
                    style={{ color: "var(--gray-500)" }}
                  >
                    <RotateCcw size={12} />
                    Reset
                  </button>
                )}
              </div>

              <form onSubmit={handleApply}>
                {/* Search Input */}
                <div className="filter-section">
                  <div className="filter-section-title">Search Keywords</div>
                  <div style={{ position: "relative" }}>
                    <input
                      className="form-input"
                      placeholder="e.g. React, UX, Python…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        style={{
                          position: "absolute",
                          right: 10,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "var(--gray-400)",
                        }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Category Dropdown */}
                <div className="filter-section">
                  <div className="filter-section-title">Category</div>
                  <select
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mode (Online / Offline) */}
                <div className="filter-section">
                  <div className="filter-section-title">Delivery Mode</div>
                  {[
                    { value: "", label: "Any Mode" },
                    { value: "online", label: "Online Session", icon: Globe },
                    { value: "offline", label: "In-Person", icon: MapPin },
                  ].map((m) => {
                    const IconComp = m.icon;
                    return (
                      <label key={m.value} className="filter-option">
                        <input
                          type="radio"
                          name="mode"
                          value={m.value}
                          checked={mode === m.value}
                          onChange={() => setMode(m.value)}
                        />
                        <span className="flex gap-2" style={{ alignItems: "center" }}>
                          {IconComp && <IconComp size={14} color="var(--gray-500)" />}
                          {m.label}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {/* Price Range */}
                <div className="filter-section">
                  <div className="filter-section-title">Price Range (₹)</div>
                  <div className="price-inputs">
                    <input
                      className="price-input"
                      type="number"
                      placeholder="Min"
                      min="0"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                    <input
                      className="price-input"
                      type="number"
                      placeholder="Max"
                      min="0"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                  <button type="submit" className="btn btn-primary btn-full">
                    Apply Filters
                  </button>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      className="btn btn-outline btn-full btn-sm"
                      onClick={handleClear}
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </form>
            </aside>

            {/* ── Main Workshop Listings ───────────────── */}
            <main>
              {/* Active Filter Chips & Results Count */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div style={{ fontSize: "0.875rem", color: "var(--gray-600)" }}>
                  Showing <strong>{workshops.length}</strong> of <strong>{total}</strong> workshops
                </div>

                {hasActiveFilters && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {search && (
                      <span className="chip">
                        Keyword: "{search}"
                        <X
                          size={12}
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            setSearch("");
                            fetchWorkshops({ search: "" });
                          }}
                        />
                      </span>
                    )}
                    {category && (
                      <span className="chip">
                        {category}
                        <X
                          size={12}
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            setCategory("");
                            fetchWorkshops({ category: "" });
                          }}
                        />
                      </span>
                    )}
                    {mode && (
                      <span className="chip">
                        Mode: {mode}
                        <X
                          size={12}
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            setMode("");
                            fetchWorkshops({ mode: "" });
                          }}
                        />
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Workshop Cards Grid */}
              {loading ? (
                <div className="spinner-wrap" style={{ minHeight: 360 }}>
                  <div className="spinner" />
                </div>
              ) : workshops.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <BookOpen size={24} />
                  </div>
                  <h2 className="empty-state-title">No workshops matched your criteria</h2>
                  <p className="empty-state-desc">
                    Try clearing or widening your filters to see more available community workshops.
                  </p>
                  <button type="button" className="btn btn-outline btn-sm mt-4" onClick={handleClear}>
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="grid-3">
                  {workshops.map((w) => (
                    <WorkshopCard key={w.id} workshop={w} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pages > 1 && (
                <div className="pagination">
                  {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`page-btn ${p === page ? "active" : ""}`}
                      onClick={() => setPage(p)}
                      aria-label={`Go to page ${p}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
