// src/components/Footer.jsx
import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">
              <div className="navbar-brand-mark" style={{ width: 30, height: 30 }}>
                <GraduationCap size={18} strokeWidth={2.2} />
              </div>
              <span>SkillSphere</span>
            </div>
            <p className="footer-desc">
              The premium community skill-sharing platform. Connect with real experts,
              attend interactive workshops, take on freelance projects, and build collaborative teams.
            </p>
          </div>

          <div>
            <div className="footer-col-title">Workshops</div>
            <div className="footer-links">
              <Link to="/explore">Browse All Workshops</Link>
              <Link to="/explore?category=Programming">Programming</Link>
              <Link to="/explore?category=Design">UI/UX Design</Link>
              <Link to="/explore?category=Business">Business & Growth</Link>
              <Link to="/explore?mode=online">Online Sessions</Link>
            </div>
          </div>

          <div>
            <div className="footer-col-title">Collaborate</div>
            <div className="footer-links">
              <Link to="/freelance">Freelance Marketplace</Link>
              <Link to="/teams">Team Project Finder</Link>
              <Link to="/freelance/post">Post a Freelance Job</Link>
              <Link to="/teams/post">Start a Team Project</Link>
              <Link to="/register">Become an Instructor</Link>
            </div>
          </div>

          <div>
            <div className="footer-col-title">Platform</div>
            <div className="footer-links">
              <Link to="/">How It Works</Link>
              <Link to="/login">Sign In</Link>
              <Link to="/register">Create Account</Link>
              <Link to="/explore">Explore Directory</Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div>
            © {new Date().getFullYear()} SkillSphere. Built with passion for community-powered learning.
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <Link to="/explore" style={{ color: "var(--gray-400)" }}>Privacy Policy</Link>
            <Link to="/explore" style={{ color: "var(--gray-400)" }}>Terms of Service</Link>
            <Link to="/explore" style={{ color: "var(--gray-400)" }}>Community Guidelines</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
