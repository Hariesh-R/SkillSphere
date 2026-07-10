// src/pages/Landing.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import api from "../api/axios";
import WorkshopCard from "../components/WorkshopCard";
import Footer from "../components/Footer";

const CATEGORIES = [
  { label: "Programming", emoji: "💻" },
  { label: "Design", emoji: "🎨" },
  { label: "Business", emoji: "💼" },
  { label: "Marketing", emoji: "📣" },
  { label: "Music", emoji: "🎵" },
  { label: "Photography", emoji: "📷" },
  { label: "Health", emoji: "🏃" },
  { label: "Cooking", emoji: "🍳" },
];

const STATS = [
  { value: "10K+", label: "Students" },
  { value: "500+", label: "Workshops" },
  { value: "200+", label: "Instructors" },
  { value: "4.8★", label: "Avg Rating" },
];

const HOW_IT_WORKS = [
  {
    icon: "🔍",
    title: "Discover Workshops",
    desc: "Browse hundreds of live workshops in any skill you want to master.",
  },
  {
    icon: "📅",
    title: "Book Your Spot",
    desc: "Reserve your seat instantly. Flexible schedule, online or offline.",
  },
  {
    icon: "🚀",
    title: "Learn & Grow",
    desc: "Attend live sessions, interact with instructors, and level up your skills.",
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [featured, setFeatured] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    api
      .get("/workshops?limit=8&sort=rating")
      .then((r) => setFeatured(r.data.data.items || []))
      .catch(() => setFeatured([]))
      .finally(() => setLoadingFeatured(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/explore?search=${encodeURIComponent(search)}`);
  };

  const handleCategory = (cat) => {
    navigate(`/explore?category=${encodeURIComponent(cat)}`);
  };

  return (
    <>
      {/* ── Hero ───────────────────────────────────────── */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-eyebrow">
              ✨ Community-powered learning
            </div>
            <h1 className="hero-title">
              Learn Any Skill From <em>Real Experts</em> in Your Community
            </h1>
            <p className="hero-subtitle">
              Join live workshops taught by passionate instructors. Learn
              programming, design, business, and more — online or in person.
            </p>

            <form className="hero-search" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="What do you want to learn today?"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit">Search</button>
            </form>

            <div className="hero-stats">
              {STATS.map((s) => (
                <div key={s.label}>
                  <div className="hero-stat-value">{s.value}</div>
                  <div className="hero-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ─────────────────────────────────── */}
      <section className="categories-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Browse by Category</h2>
            <p className="section-subtitle">Find workshops in the topics you care about most.</p>
          </div>
          <div className="category-pills">
            {CATEGORIES.map((c) => (
              <button
                key={c.label}
                className="category-pill"
                onClick={() => handleCategory(c.label)}
              >
                <span className="category-pill-emoji">{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Workshops ─────────────────────────── */}
      <section className="section" style={{ background: "var(--gray-50)" }}>
        <div className="container">
          <div className="section-header-row">
            <div>
              <h2 className="section-title">Featured Workshops</h2>
              <p className="section-subtitle">Top-rated workshops loved by our community.</p>
            </div>
            <Link to="/explore" className="btn btn-secondary">
              View All →
            </Link>
          </div>

          {loadingFeatured ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : featured.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔭</div>
              <div className="empty-state-title">No workshops yet</div>
              <div className="empty-state-desc">Be the first to create a workshop!</div>
            </div>
          ) : (
            <div className="grid-4">
              {featured.map((w) => (
                <WorkshopCard key={w.id} workshop={w} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── How it Works ───────────────────────────────── */}
      <section className="section how-it-works">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title">How SkillSphere Works</h2>
            <p className="section-subtitle" style={{ margin: "0 auto" }}>
              Getting started is simple. Three steps to your next skill.
            </p>
          </div>
          <div className="steps">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="step">
                <div className="step-number">{i + 1}</div>
                <div className="step-icon">{step.icon}</div>
                <div className="step-title">{step.title}</div>
                <div className="step-desc">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────── */}
      <section className="section" style={{ background: "linear-gradient(135deg,#1a0533,#6c47ff)", textAlign:"center" }}>
        <div className="container">
          <h2 style={{ fontFamily:"var(--font-display)", fontSize:"2rem", fontWeight:900, color:"#fff", marginBottom:12 }}>
            Ready to Start Learning?
          </h2>
          <p style={{ color:"rgba(255,255,255,.7)", marginBottom:32, fontSize:"1.05rem" }}>
            Join thousands of students already growing with SkillSphere.
          </p>
          <div style={{ display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap" }}>
            <Link to="/register" className="btn btn-lg" style={{ background:"#fff", color:"var(--brand-primary)", fontWeight:800 }}>
              Get Started Free
            </Link>
            <Link to="/explore" className="btn btn-lg btn-ghost">
              Browse Workshops
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
