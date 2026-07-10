// src/components/Footer.jsx
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-logo">🎓 SkillSphere</div>
            <p className="footer-desc">
              A community-driven platform where instructors share skills and
              students grow — one workshop at a time.
            </p>
          </div>
          <div>
            <div className="footer-col-title">Learn</div>
            <div className="footer-links">
              <Link to="/explore">Browse Workshops</Link>
              <Link to="/explore?category=Programming">Programming</Link>
              <Link to="/explore?category=Design">Design</Link>
              <Link to="/explore?category=Business">Business</Link>
            </div>
          </div>
          <div>
            <div className="footer-col-title">Teach</div>
            <div className="footer-links">
              <Link to="/register">Become an Instructor</Link>
              <Link to="/instructor">Instructor Dashboard</Link>
            </div>
          </div>
          <div>
            <div className="footer-col-title">Company</div>
            <div className="footer-links">
              <Link to="/">About</Link>
              <Link to="/">Careers</Link>
              <Link to="/">Blog</Link>
              <Link to="/">Contact</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} SkillSphere. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
