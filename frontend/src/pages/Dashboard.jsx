// src/pages/StudentDashboard.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("bookings");

  const loadBookings = async () => {
    try {
      const { data } = await api.get("/bookings/my");
      setBookings(data.data.bookings || []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBookings(); }, []);

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Cancel this booking?")) return;
    setCancellingId(bookingId);
    setMsg({ type: "", text: "" });
    try {
      await api.delete(`/bookings/${bookingId}`);
      setMsg({ type: "success", text: "Booking cancelled successfully." });
      await loadBookings();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Cancellation failed." });
    } finally {
      setCancellingId(null);
    }
  };

  const active    = bookings.filter((b) => b.status !== "cancelled");
  const cancelled = bookings.filter((b) => b.status === "cancelled");

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar-title">Student</div>
        <button
          className={`sidebar-link${activeTab==="bookings"?" active":""}`}
          onClick={() => setActiveTab("bookings")}
        >📅 My Bookings</button>
        <button
          className={`sidebar-link${activeTab==="profile"?" active":""}`}
          onClick={() => navigate("/profile")}
        >👤 Profile</button>
        <div style={{ marginTop:20, padding:"0 20px" }}>
          <Link to="/explore" className="btn btn-secondary btn-sm btn-full">Explore Workshops</Link>
        </div>
      </aside>

      {/* Content */}
      <div className="dashboard-content">
        <div className="dashboard-welcome">
          <h1>Welcome back, {user?.name?.split(" ")[0]}! 👋</h1>
          <p>Track your learning journey from here.</p>
        </div>

        {/* Stats */}
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-card-icon">📅</div>
            <div className="stat-card-value">{active.length}</div>
            <div className="stat-card-label">Active Bookings</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">✅</div>
            <div className="stat-card-value">{bookings.filter(b=>b.status==="confirmed"||b.status==="attended").length}</div>
            <div className="stat-card-label">Confirmed</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">🌟</div>
            <div className="stat-card-value">{bookings.length}</div>
            <div className="stat-card-label">Total Workshops</div>
          </div>
        </div>

        {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

        <h2 style={{ fontFamily:"var(--font-display)", fontWeight:800, marginBottom:16, fontSize:"1.2rem" }}>
          My Bookings
        </h2>

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-title">No bookings yet</div>
            <div className="empty-state-desc">Start your learning journey today!</div>
            <Link to="/explore" className="btn btn-primary" style={{ marginTop:16 }}>Explore Workshops</Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Workshop</th>
                  <th>Instructor</th>
                  <th>Date</th>
                  <th>Mode</th>
                  <th>Price Paid</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.booking_id}>
                    <td>
                      <Link
                        to={`/workshops/${b.workshop?.id}`}
                        style={{ fontWeight:600, color:"var(--brand-primary)" }}
                      >
                        {b.workshop?.title}
                      </Link>
                      <div style={{ fontSize:"0.75rem", color:"var(--gray-400)", marginTop:2 }}>
                        {b.workshop?.category}
                      </div>
                    </td>
                    <td>{b.instructor?.name}</td>
                    <td>
                      {b.workshop?.schedule
                        ? new Date(b.workshop.schedule).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })
                        : "TBD"}
                    </td>
                    <td>
                      <span className={`badge ${b.workshop?.mode==="online"?"badge-primary":"badge-gray"}`}>
                        {b.workshop?.mode === "online" ? "🌐 Online" : "📍 Offline"}
                      </span>
                    </td>
                    <td style={{ fontWeight:600 }}>
                      {b.paid_amount === 0 ? "Free" : `₹${b.paid_amount}`}
                    </td>
                    <td>
                      <span className={`badge ${
                        b.status==="confirmed"?"badge-success":
                        b.status==="cancelled"?"badge-error":
                        b.status==="attended"?"badge-primary":"badge-warning"
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td>
                      {b.status !== "cancelled" ? (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleCancel(b.booking_id)}
                          disabled={cancellingId === b.booking_id}
                          style={{ color:"var(--error)", borderColor:"var(--error)" }}
                        >
                          {cancellingId === b.booking_id ? "…" : "Cancel"}
                        </button>
                      ) : (
                        <span style={{ fontSize:"0.75rem", color:"var(--gray-400)" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
