// src/pages/NotFound.jsx
import { Link } from "react-router-dom";
import { Home, Compass } from "lucide-react";
import Footer from "../components/Footer";

export default function NotFound() {
  return (
    <>
      <div className="not-found" style={{ background: "var(--gray-50)" }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(5rem, 12vw, 8rem)",
            fontWeight: 900,
            color: "var(--brand-primary-border)",
            lineHeight: 1,
            letterSpacing: "-0.05em",
          }}
        >
          404
        </div>
        <h1 className="not-found-title" style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: 12 }}>
          Page Not Found
        </h1>
        <p className="not-found-desc" style={{ maxWidth: 440, margin: "8px auto 28px" }}>
          The page you are looking for doesn't exist, was renamed, or has moved to a new route.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/" className="btn btn-primary btn-lg flex gap-2">
            <Home size={16} />
            Go to Homepage
          </Link>
          <Link to="/explore" className="btn btn-outline btn-lg flex gap-2">
            <Compass size={16} />
            Explore Workshops
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
