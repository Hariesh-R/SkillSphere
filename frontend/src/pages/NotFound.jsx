// src/pages/NotFound.jsx
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found-code">404</div>
      <h1 className="not-found-title">Page Not Found</h1>
      <p className="not-found-desc">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
        <Link to="/" className="btn btn-primary btn-lg">Go Home</Link>
        <Link to="/explore" className="btn btn-outline btn-lg">Explore Workshops</Link>
      </div>
    </div>
  );
}
