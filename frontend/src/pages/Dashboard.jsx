// src/pages/Dashboard.jsx (Student Dashboard)
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  CheckCircle2,
  Award,
  User,
  Globe,
  MapPin,
  Compass,
  AlertCircle,
  Clock,
  BookOpen,
} from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";

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

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
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

  const active = bookings.filter((b) => b.status !== "cancelled");
  const confirmed = bookings.filter((b) => b.status === "confirmed" || b.status === "attended");

  return (
    <>
      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <div className="dashboard-sidebar-title">Student Portal</div>
          <button
            className={`sidebar-link${activeTab === "bookings" ? " active" : ""}`}
            onClick={() => setActiveTab("bookings")}
          >
            <Calendar size={16} />
            My Bookings
          </button>
          <button
            className={`sidebar-link${activeTab === "profile" ? " active" : ""}`}
            onClick={() => navigate("/profile")}
          >
            <User size={16} />
            Profile & Skills
          </button>
          <div style={{ marginTop: 24, padding: "0 24px" }}>
            <Link to="/explore" className="btn btn-secondary btn-sm btn-full flex gap-1">
              <Compass size={14} />
              Explore Workshops
            </Link>
          </div>
        </aside>

        {/* Content */}
        <main className="dashboard-content">
          <div className="dashboard-welcome">
            <h1>Welcome back, {user?.name?.split(" ")[0]}!</h1>
            <p>Track your enrolled workshops, schedule, and learning progress.</p>
          </div>

          {/* Metric Stats */}
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-card-icon">
                <Calendar size={20} />
              </div>
              <div className="stat-card-value">{active.length}</div>
              <div className="stat-card-label">Active Enrollments</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: "var(--success-light)", color: "var(--success)" }}>
                <CheckCircle2 size={20} />
              </div>
              <div className="stat-card-value">{confirmed.length}</div>
              <div className="stat-card-label">Confirmed & Attended</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: "var(--brand-violet-light)", color: "var(--brand-violet)" }}>
                <Award size={20} />
              </div>
              <div className="stat-card-value">{bookings.length}</div>
              <div className="stat-card-label">Total Workshops Taken</div>
            </div>
          </div>

          {msg.text && (
            <div className={`alert alert-${msg.type}`} style={{ marginBottom: 20 }}>
              {msg.text}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.25rem", color: "var(--gray-900)" }}>
              Workshop Registrations
            </h2>
            <Link to="/explore" className="btn btn-outline btn-sm flex gap-1">
              <Compass size={14} />
              Browse More
            </Link>
          </div>

          {loading ? (
            <div className="spinner-wrap" style={{ minHeight: 240 }}>
              <div className="spinner" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <BookOpen size={24} />
              </div>
              <h3 className="empty-state-title">No bookings yet</h3>
              <p className="empty-state-desc">
                Browse our directory of live expert-led workshops to start learning.
              </p>
              <Link to="/explore" className="btn btn-primary btn-sm mt-4">
                Explore Workshops
              </Link>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Workshop Title</th>
                    <th>Instructor</th>
                    <th>Schedule</th>
                    <th>Mode</th>
                    <th>Tuition Paid</th>
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
                          style={{ fontWeight: 600, color: "var(--brand-primary)" }}
                        >
                          {b.workshop?.title}
                        </Link>
                        <div style={{ fontSize: "0.75rem", color: "var(--gray-400)", marginTop: 2 }}>
                          {b.workshop?.category}
                        </div>
                      </td>
                      <td>{b.instructor?.name || "Community Instructor"}</td>
                      <td>
                        {b.workshop?.schedule
                          ? new Date(b.workshop.schedule).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "TBD"}
                      </td>
                      <td>
                        <span className={`badge ${b.workshop?.mode === "online" ? "badge-primary" : "badge-gray"} flex gap-1`}>
                          {b.workshop?.mode === "online" ? (
                            <>
                              <Globe size={11} />
                              Online
                            </>
                          ) : (
                            <>
                              <MapPin size={11} />
                              In-Person
                            </>
                          )}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {b.paid_amount === 0 ? (
                          <span style={{ color: "var(--success)" }}>Free</span>
                        ) : (
                          `₹${Number(b.paid_amount).toLocaleString()}`
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            b.status === "confirmed"
                              ? "badge-success"
                              : b.status === "cancelled"
                              ? "badge-error"
                              : b.status === "attended"
                              ? "badge-primary"
                              : "badge-warning"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td>
                        {b.status !== "cancelled" ? (
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleCancel(b.booking_id)}
                            disabled={cancellingId === b.booking_id}
                            style={{ color: "var(--error)", borderColor: "var(--error-border)" }}
                          >
                            {cancellingId === b.booking_id ? "Cancelling…" : "Cancel"}
                          </button>
                        ) : (
                          <span style={{ fontSize: "0.8rem", color: "var(--gray-400)" }}>Cancelled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
}
