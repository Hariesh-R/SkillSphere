// src/pages/Landing.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  ArrowRight,
  Sparkles,
  Code,
  Palette,
  Briefcase,
  TrendingUp,
  Music,
  Camera,
  Activity,
  Utensils,
  BookOpen,
  Users,
  MessageSquare,
  Rocket,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import api from "../api/axios";
import WorkshopCard from "../components/WorkshopCard";
import Footer from "../components/Footer";

const CATEGORIES = [
  { label: "Programming", icon: Code, desc: "Web, AI & Software" },
  { label: "Design", icon: Palette, desc: "UI/UX, 3D & Brand" },
  { label: "Business", icon: Briefcase, desc: "Growth & Management" },
  { label: "Marketing", icon: TrendingUp, desc: "SEO, Ads & Content" },
  { label: "Music", icon: Music, desc: "Production & Instruments" },
  { label: "Photography", icon: Camera, desc: "Photo & Video Editing" },
  { label: "Health", icon: Activity, desc: "Fitness & Nutrition" },
  { label: "Cooking", icon: Utensils, desc: "Culinary & Baking" },
];

const PLATFORM_PILLARS = [
  {
    title: "Live Interactive Workshops",
    desc: "Attend instructor-led sessions with screen sharing, real-time Q&A, and hands-on guidance.",
    icon: BookOpen,
    link: "/explore",
    cta: "Explore Workshops",
    badge: "Skill Sharing",
  },
  {
    title: "Freelance Marketplace",
    desc: "Monetize your skills with real client projects, custom proposals, and secure milestone submissions.",
    icon: Briefcase,
    link: "/freelance",
    cta: "Browse Projects",
    badge: "Paid Gigs",
  },
  {
    title: "Team Project Finder",
    desc: "Recruit student developers, designers, and engineers to build open-source products together.",
    icon: Users,
    link: "/teams",
    cta: "Find a Team",
    badge: "Collaboration",
  },
  {
    title: "Direct Peer Messaging",
    desc: "Chat directly with workshop instructors, project clients, and team members in real-time.",
    icon: MessageSquare,
    link: "/messages",
    cta: "Open Messages",
    badge: "Real-time",
  },
];

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Discover Your Next Skill",
    desc: "Browse workshops taught by verified community instructors or find open team roles matching your passion.",
    icon: Search,
  },
  {
    step: "02",
    title: "Book or Apply in Seconds",
    desc: "Reserve a workshop seat instantly, pitch for freelance contracts, or apply to join active project teams.",
    icon: Calendar,
  },
  {
    step: "03",
    title: "Collaborate, Learn & Level Up",
    desc: "Engage in live sessions, exchange direct feedback, build real portfolio items, and leave reviews.",
    icon: Rocket,
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [featured, setFeatured] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [stats, setStats] = useState({
    workshops: 0,
    projects: 0,
    teams: 0,
  });

  useEffect(() => {
    // Fetch top rated workshops
    api
      .get("/workshops?limit=8&sort=rating")
      .then((r) => {
        const items = r.data.data.items || [];
        const seen = new Set();
        const uniqueItems = [];
        for (const item of items) {
          const key = (item.title || "").trim().toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            uniqueItems.push(item);
          }
        }
        setFeatured(uniqueItems);
        setStats((prev) => ({ ...prev, workshops: r.data.data.total || uniqueItems.length }));
      })
      .catch(() => setFeatured([]))
      .finally(() => setLoadingFeatured(false));

    // Fetch live counts for freelance projects and teams
    api
      .get("/freelance/projects?limit=1")
      .then((r) => {
        setStats((prev) => ({
          ...prev,
          projects: r.data.data.pagination?.total || r.data.data.projects?.length || 0,
        }));
      })
      .catch(() => {});

    api
      .get("/teams")
      .then((r) => {
        const list = r.data.data.teams || [];
        setStats((prev) => ({ ...prev, teams: list.length }));
      })
      .catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/explore?search=${encodeURIComponent(search.trim())}`);
    } else {
      navigate("/explore");
    }
  };

  const handleCategoryClick = (categoryLabel) => {
    navigate(`/explore?category=${encodeURIComponent(categoryLabel)}`);
  };

  return (
    <>
      {/* ── Hero Section ─────────────────────────────────── */}
      <section className="hero">
        <div className="container">
          <div style={{ maxWidth: 760 }}>
            <div className="hero-eyebrow">
              <Sparkles size={14} />
              <span>Community-Powered Skill Sharing Platform</span>
            </div>

            <h1 className="hero-title">
              Master New Skills Through <em>Live Community Workshops</em> & Collaboration
            </h1>

            <p className="hero-subtitle">
              Learn programming, design, and business directly from community experts.
              Participate in live workshops, take on freelance projects, or build team projects together.
            </p>

            {/* Interactive Search Bar */}
            <form className="hero-search" onSubmit={handleSearch}>
              <Search size={18} color="var(--gray-400)" />
              <input
                type="text"
                placeholder="What skill do you want to learn today? (e.g. React, UI/UX, Python)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search workshops"
              />
              <button type="submit" className="btn btn-primary">
                Search
              </button>
            </form>

            {/* Platform Stats Display */}
            <div className="hero-stats">
              <div>
                <div className="hero-stat-value">{stats.workshops > 0 ? `${stats.workshops}+` : "Live"}</div>
                <div className="hero-stat-label">Active Workshops</div>
              </div>
              <div>
                <div className="hero-stat-value">{stats.projects > 0 ? `${stats.projects}+` : "Open"}</div>
                <div className="hero-stat-label">Freelance Opportunities</div>
              </div>
              <div>
                <div className="hero-stat-value">{stats.teams > 0 ? `${stats.teams}+` : "Active"}</div>
                <div className="hero-stat-label">Collaborative Teams</div>
              </div>
              <div>
                <div className="hero-stat-value">100%</div>
                <div className="hero-stat-label">Community Driven</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Four Core Pillars Section ────────────────────── */}
      <section className="section" style={{ background: "#ffffff", padding: "64px 0" }}>
        <div className="container">
          <div className="section-header-row">
            <div>
              <div className="badge badge-primary mb-2">Platform Capabilities</div>
              <h2 className="section-title">Everything you need to grow and collaborate</h2>
              <p className="section-subtitle">
                SkillSphere brings workshops, freelance client gigs, team building, and messaging together in one ecosystem.
              </p>
            </div>
          </div>

          <div className="grid-4">
            {PLATFORM_PILLARS.map((pillar) => {
              const IconComp = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="card card-hoverable"
                  style={{ display: "flex", flexDirection: "column", height: "100%" }}
                >
                  <div className="card-body" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: "var(--radius-md)",
                          background: "var(--brand-primary-light)",
                          color: "var(--brand-primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <IconComp size={22} strokeWidth={2} />
                      </div>
                      <span className="badge badge-primary">{pillar.badge}</span>
                    </div>

                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 8, color: "var(--gray-900)" }}>
                      {pillar.title}
                    </h3>
                    <p style={{ fontSize: "0.875rem", color: "var(--gray-600)", lineHeight: 1.6, marginBottom: 20, flex: 1 }}>
                      {pillar.desc}
                    </p>

                    <Link
                      to={pillar.link}
                      className="btn btn-outline btn-sm btn-full"
                      style={{ marginTop: "auto" }}
                    >
                      {pillar.cta}
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Category Exploration Grid ───────────────────── */}
      <section className="categories-section" style={{ background: "var(--gray-50)", borderTop: "1px solid var(--gray-200)", borderBottom: "1px solid var(--gray-200)" }}>
        <div className="container">
          <div className="section-header-row">
            <div>
              <div className="badge badge-violet mb-2">Explore Skills</div>
              <h2 className="section-title">Browse by Subject & Industry</h2>
              <p className="section-subtitle">
                Select a topic to discover curated workshops taught by experienced community mentors.
              </p>
            </div>
            <Link to="/explore" className="btn btn-outline btn-sm">
              View All Topics
              <ArrowRight size={14} />
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 16,
            }}
          >
            {CATEGORIES.map((c) => {
              const IconComp = c.icon;
              return (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => handleCategoryClick(c.label)}
                  className="card card-hoverable"
                  style={{
                    padding: 18,
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    textAlign: "left",
                    background: "#ffffff",
                    border: "1px solid var(--gray-200)",
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "var(--radius-md)",
                      background: "var(--brand-primary-light)",
                      color: "var(--brand-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <IconComp size={20} strokeWidth={2} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--gray-900)" }}>
                      {c.label}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--gray-500)", marginTop: 2 }}>
                      {c.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Featured Workshops Section ──────────────────── */}
      <section className="section" style={{ background: "#ffffff" }}>
        <div className="container">
          <div className="section-header-row">
            <div>
              <div className="badge badge-success mb-2">Top Rated</div>
              <h2 className="section-title">Featured Workshops</h2>
              <p className="section-subtitle">
                Highly recommended workshops loved and reviewed by platform learners.
              </p>
            </div>
            <Link to="/explore" className="btn btn-secondary">
              Browse All Workshops
              <ArrowRight size={15} />
            </Link>
          </div>

          {loadingFeatured ? (
            <div className="spinner-wrap" style={{ minHeight: 280 }}>
              <div className="spinner" />
            </div>
          ) : featured.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <BookOpen size={24} />
              </div>
              <div className="empty-state-title">No workshops published yet</div>
              <div className="empty-state-desc">
                Be the first instructor to publish a community workshop.
              </div>
              <Link to="/register" className="btn btn-primary btn-sm mt-4">
                Become an Instructor
              </Link>
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

      {/* ── How It Works Section ────────────────────────── */}
      <section className="section how-it-works">
        <div className="container">
          <div className="section-header text-center" style={{ maxWidth: 640, margin: "0 auto 48px" }}>
            <div className="badge badge-primary mb-2">Simple Process</div>
            <h2 className="section-title">How SkillSphere Works</h2>
            <p className="section-subtitle" style={{ margin: "0 auto" }}>
              A straightforward three-step path to master any skill and collaborate with the community.
            </p>
          </div>

          <div className="steps">
            {WORKFLOW_STEPS.map((s) => {
              const IconComp = s.icon;
              return (
                <div key={s.step} className="step">
                  <div className="step-number">{s.step}</div>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "var(--radius-sm)",
                      background: "var(--brand-violet-light)",
                      color: "var(--brand-violet)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16,
                    }}
                  >
                    <IconComp size={20} strokeWidth={2} />
                  </div>
                  <div className="step-title">{s.title}</div>
                  <div className="step-desc">{s.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Dual CTA Section for Students & Instructors ─── */}
      <section
        className="section"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)",
          color: "#ffffff",
          padding: "80px 0",
        }}
      >
        <div className="container">
          <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
            <div
              className="badge"
              style={{
                background: "rgba(255, 255, 255, 0.12)",
                color: "#c7d2fe",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                marginBottom: 20,
              }}
            >
              <ShieldCheck size={14} />
              <span>Join Thousands of Community Learners</span>
            </div>

            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 4vw, 2.8rem)",
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-0.03em",
                marginBottom: 16,
                lineHeight: 1.15,
              }}
            >
              Ready to Accelerate Your Learning Journey?
            </h2>

            <p
              style={{
                color: "var(--gray-300)",
                fontSize: "1.05rem",
                lineHeight: 1.65,
                marginBottom: 36,
              }}
            >
              Create a free SkillSphere account today to book live workshops,
              bid on paid freelance opportunities, or start your own collaborative team project.
            </p>

            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/register" className="btn btn-primary btn-lg" style={{ background: "#ffffff", color: "var(--brand-primary)", borderColor: "#ffffff" }}>
                Sign Up as Learner or Instructor
                <ArrowRight size={16} />
              </Link>
              <Link to="/explore" className="btn btn-outline btn-lg" style={{ background: "transparent", color: "#ffffff", borderColor: "rgba(255,255,255,0.3)" }}>
                Explore All Workshops
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
