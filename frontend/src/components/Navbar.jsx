// src/components/Navbar.jsx
import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Compass,
  Briefcase,
  Users,
  MessageSquare,
  Bell,
  LayoutDashboard,
  FileText,
  Rocket,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import api from "../api/axios";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unreadNotifCount, setUnreadNotifCount } = useSocket();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  // Fetch initial unread notifications count
  useEffect(() => {
    if (!user) return;
    api.get("/notifications/unread-count")
      .then(({ data }) => setUnreadNotifCount(data.data.unread_count))
      .catch(() => {});
  }, [user, setUnreadNotifCount]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
    setDropOpen(false);
  };

  const dashPath = user?.role === "instructor" ? "/instructor" : "/student";

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="container navbar-inner">
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
          <div className="navbar-brand-mark">
            <GraduationCap size={20} strokeWidth={2.2} />
          </div>
          <span>Skill</span>Sphere
        </Link>

        {/* Mobile Hamburger Button */}
        <button
          className="hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Navigation Links */}
        <div className={`navbar-links${menuOpen ? " open" : ""}`}>
          <NavLink
            to="/"
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            end
            onClick={() => setMenuOpen(false)}
          >
            Home
          </NavLink>
          <NavLink
            to="/explore"
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            <Compass size={16} strokeWidth={1.8} />
            Workshops
          </NavLink>
          <NavLink
            to="/freelance"
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            <Briefcase size={16} strokeWidth={1.8} />
            Freelance
          </NavLink>
          <NavLink
            to="/teams"
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            <Users size={16} strokeWidth={1.8} />
            Team Finder
          </NavLink>

          {user && (
            <>
              <NavLink
                to="/messages"
                className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                <MessageSquare size={16} strokeWidth={1.8} />
                Messages
              </NavLink>
              <NavLink
                to="/notifications"
                className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                <Bell size={16} strokeWidth={1.8} />
                Notifications
                {unreadNotifCount > 0 && <span className="nav-badge">{unreadNotifCount}</span>}
              </NavLink>
            </>
          )}
        </div>

        {/* Right CTA Actions */}
        <div className="navbar-actions">
          {!user ? (
            <>
              <Link to="/login" className="btn btn-outline btn-sm">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign Up Free
              </Link>
            </>
          ) : (
            <div className="navbar-user-menu" ref={dropRef}>
              <button
                className="navbar-avatar"
                onClick={() => setDropOpen((o) => !o)}
                aria-label="Toggle user menu"
                aria-haspopup="true"
                aria-expanded={dropOpen}
              >
                {user.name?.[0]?.toUpperCase() || "U"}
              </button>

              {dropOpen && (
                <div className="user-dropdown">
                  <div className="user-dropdown-header">
                    <div className="user-dropdown-name">{user.name}</div>
                    <div className="user-dropdown-role">{user.role} Account</div>
                  </div>
                  <Link to={dashPath} onClick={() => setDropOpen(false)}>
                    <LayoutDashboard size={16} color="var(--brand-primary)" />
                    Dashboard
                  </Link>
                  <Link to="/freelance/my-projects" onClick={() => setDropOpen(false)}>
                    <Briefcase size={16} color="var(--brand-primary)" />
                    My Projects
                  </Link>
                  <Link to="/freelance/my-proposals" onClick={() => setDropOpen(false)}>
                    <FileText size={16} color="var(--brand-primary)" />
                    My Proposals
                  </Link>
                  <Link to="/teams/my-teams" onClick={() => setDropOpen(false)}>
                    <Rocket size={16} color="var(--brand-primary)" />
                    My Teams
                  </Link>
                  <Link to="/profile" onClick={() => setDropOpen(false)}>
                    <User size={16} color="var(--brand-primary)" />
                    Profile & Portfolio
                  </Link>
                  <button className="logout-btn" onClick={handleLogout}>
                    <LogOut size={16} />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
