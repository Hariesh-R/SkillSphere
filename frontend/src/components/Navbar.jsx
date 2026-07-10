// src/components/Navbar.jsx
import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

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
    <nav className="navbar">
      <div className="container navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          🎓 <span>Skill</span>Sphere
        </Link>

        {/* Hamburger */}
        <button
          className="hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>

        {/* Nav Links */}
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
            Explore
          </NavLink>
          {user && (
            <NavLink
              to={dashPath}
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              Dashboard
            </NavLink>
          )}
        </div>

        {/* Actions */}
        <div className="navbar-actions">
          {!user ? (
            <>
              <Link to="/login" className="btn btn-outline btn-sm">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </>
          ) : (
            <div className="navbar-user-menu" ref={dropRef}>
              <button
                className="navbar-avatar"
                onClick={() => setDropOpen((o) => !o)}
                aria-label="User menu"
              >
                {user.name?.[0]?.toUpperCase() || "U"}
              </button>

              {dropOpen && (
                <div className="user-dropdown">
                  <div className="user-dropdown-header">
                    <div className="user-dropdown-name">{user.name}</div>
                    <div className="user-dropdown-role">{user.role}</div>
                  </div>
                  <Link to={dashPath} onClick={() => setDropOpen(false)}>
                    📊 Dashboard
                  </Link>
                  <Link to="/profile" onClick={() => setDropOpen(false)}>
                    👤 Profile
                  </Link>
                  <button className="logout-btn" onClick={handleLogout}>
                    🚪 Log Out
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
