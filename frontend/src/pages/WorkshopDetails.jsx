// src/pages/WorkshopDetails.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Star,
  Globe,
  MapPin,
  Calendar,
  Users,
  Video,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import StarPicker from "../components/StarPicker";
import Footer from "../components/Footer";
import { getWorkshopImage } from "../utils/categoryImages";

export default function WorkshopDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [workshop, setWorkshop] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [bookMsg, setBookMsg] = useState({ type: "", text: "" });
  const [booked, setBooked] = useState(false);

  // Review form
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [revLoading, setRevLoading] = useState(false);
  const [revMsg, setRevMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [wRes, rRes] = await Promise.all([
          api.get(`/workshops/${id}`),
          api.get(`/workshops/${id}/reviews`),
        ]);
        setWorkshop(wRes.data.data);
        setReviews(rRes.data.data.reviews || []);

        // Check if the current student already booked
        if (user?.role === "student") {
          try {
            const myRes = await api.get("/bookings/my");
            const myBookings = myRes.data.data.bookings || [];
            const alreadyBooked = myBookings.some(
              (b) => b.workshop?.id === id && b.status !== "cancelled"
            );
            setBooked(alreadyBooked);
          } catch {
            // not logged in
          }
        }
      } catch {
        navigate("/404");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user, navigate]);

  const handleBook = async () => {
    if (!user) {
      navigate("/login", { state: { from: { pathname: `/workshops/${id}` } } });
      return;
    }
    if (user.role !== "student") {
      setBookMsg({ type: "error", text: "Only student accounts can book workshops." });
      return;
    }
    setBooking(true);
    setBookMsg({ type: "", text: "" });
    try {
      await api.post("/bookings", { workshop_id: id });
      setBooked(true);
      setBookMsg({ type: "success", text: "Booking confirmed! You are registered for this workshop." });
      // Refresh remaining seats
      const { data } = await api.get(`/workshops/${id}`);
      setWorkshop(data.data);
    } catch (err) {
      setBookMsg({ type: "error", text: err.response?.data?.message || "Booking failed." });
    } finally {
      setBooking(false);
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    setRevMsg({ type: "", text: "" });
    setRevLoading(true);
    try {
      await api.post(`/workshops/${id}/reviews`, { rating, comment });
      setRevMsg({ type: "success", text: "Review submitted successfully!" });
      setComment("");
      // Reload reviews
      const { data } = await api.get(`/workshops/${id}/reviews`);
      setReviews(data.data.reviews || []);
      const wRes = await api.get(`/workshops/${id}`);
      setWorkshop(wRes.data.data);
    } catch (err) {
      setRevMsg({ type: "error", text: err.response?.data?.message || "Failed to submit review." });
    } finally {
      setRevLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="spinner-wrap" style={{ minHeight: "60vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!workshop) return null;

  const {
    title,
    description,
    category,
    mode,
    price,
    capacity,
    remaining_seats,
    schedule,
    meet_link,
    image_url,
    avg_rating,
    review_count,
    instructor_id,
    instructor_name,
    instructor_email,
    instructor_bio,
    status,
  } = workshop;

  const isFull = remaining_seats === 0;
  const isFree = price === 0 || price === "0";
  const heroImg = getWorkshopImage(category, image_url);

  return (
    <>
      <div style={{ background: "var(--gray-50)", minHeight: "calc(100vh - var(--nav-height))" }}>
        <div className="container" style={{ paddingTop: 32, paddingBottom: 80 }}>
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "var(--gray-500)", marginBottom: 24 }}>
            <Link to="/" style={{ color: "var(--brand-primary)", fontWeight: 500 }}>
              Home
            </Link>
            <span>/</span>
            <Link to="/explore" style={{ color: "var(--brand-primary)", fontWeight: 500 }}>
              Explore
            </Link>
            <span>/</span>
            <span style={{ color: "var(--gray-700)", fontWeight: 600 }}>{title}</span>
          </nav>

          <div className="workshop-detail-layout">
            {/* ── Main Workshop Details ───────────────── */}
            <main>
              {/* Product Hero Image */}
              <div style={{ position: "relative", marginBottom: 24 }}>
                <img
                  src={heroImg}
                  alt={title}
                  className="workshop-hero-img"
                  onError={(e) => {
                    const fallback = getWorkshopImage(category);
                    if (e.target.src !== fallback) e.target.src = fallback;
                  }}
                />
              </div>

              {/* Category & Status Pills */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
                <span className="badge badge-primary">{category}</span>
                <span className={`badge ${mode === "online" ? "badge-primary" : "badge-gray"} flex gap-1`}>
                  {mode === "online" ? (
                    <>
                      <Globe size={13} />
                      Online Live Stream
                    </>
                  ) : (
                    <>
                      <MapPin size={13} />
                      In-Person Classroom
                    </>
                  )}
                </span>
                {status && status !== "published" && (
                  <span className="badge badge-warning">{status}</span>
                )}
              </div>

              {/* Title */}
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "2.1rem",
                  fontWeight: 800,
                  color: "var(--gray-900)",
                  letterSpacing: "-0.03em",
                  marginBottom: 14,
                  lineHeight: 1.25,
                }}
              >
                {title}
              </h1>

              {/* Rating Summary */}
              {avg_rating != null && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                  <div className="flex gap-1" style={{ alignItems: "center" }}>
                    {[1, 2, 3, 4, 5].map((starIdx) => (
                      <Star
                        key={starIdx}
                        size={18}
                        fill={starIdx <= Math.round(avg_rating) ? "#f59e0b" : "none"}
                        color={starIdx <= Math.round(avg_rating) ? "#f59e0b" : "var(--gray-300)"}
                        strokeWidth={1.8}
                      />
                    ))}
                  </div>
                  <span style={{ fontWeight: 800, color: "var(--gray-900)", fontSize: "1rem" }}>
                    {Number(avg_rating).toFixed(1)}
                  </span>
                  <span style={{ color: "var(--gray-500)", fontSize: "0.875rem" }}>
                    ({review_count} {review_count === 1 ? "review" : "reviews"})
                  </span>
                </div>
              )}

              {/* Instructor Profile Card */}
              <div className="instructor-card">
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div className="instructor-avatar">
                    {instructor_name?.[0]?.toUpperCase() || "I"}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--gray-900)" }}>
                      {instructor_name || "Community Instructor"}
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--gray-500)" }}>
                      {instructor_email}
                    </div>
                    {instructor_bio && (
                      <div style={{ fontSize: "0.85rem", color: "var(--gray-600)", marginTop: 6 }}>
                        {instructor_bio}
                      </div>
                    )}
                  </div>
                </div>

                {user && instructor_id && user.id !== instructor_id && (
                  <Link
                    to={`/messages?userId=${instructor_id}`}
                    className="btn btn-outline btn-sm flex gap-2"
                  >
                    <MessageSquare size={15} color="var(--brand-primary)" />
                    Message Instructor
                  </Link>
                )}
              </div>

              {/* Description Section */}
              <section style={{ marginBottom: 36, marginTop: 28 }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: 12, color: "var(--gray-900)" }}>
                  About This Workshop
                </h2>
                <div
                  style={{
                    color: "var(--gray-700)",
                    lineHeight: 1.8,
                    whiteSpace: "pre-wrap",
                    fontSize: "0.95rem",
                  }}
                >
                  {description || "No description provided."}
                </div>
              </section>

              {/* Meeting Link Notification for Registered Students */}
              {meet_link && mode === "online" && (
                <div
                  style={{
                    padding: "16px 20px",
                    background: "var(--brand-primary-light)",
                    border: "1px solid var(--brand-primary-border)",
                    borderRadius: "var(--radius-lg)",
                    marginBottom: 32,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Video size={22} color="var(--brand-primary)" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--brand-primary)" }}>
                      Live Stream Video Room
                    </div>
                    <a
                      href={meet_link}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--brand-primary-hover)",
                        textDecoration: "underline",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      {meet_link}
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              )}

              <div className="divider" />

              {/* ── Reviews Section ───────────────────── */}
              <section>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--gray-900)" }}>
                    Student Reviews {review_count > 0 && `(${review_count})`}
                  </h2>
                </div>

                {/* Review Form for Enrolled Students */}
                {user?.role === "student" && booked && (
                  <div
                    className="card"
                    style={{
                      background: "var(--brand-primary-subtle)",
                      border: "1px solid var(--brand-primary-border)",
                      marginBottom: 28,
                    }}
                  >
                    <div className="card-body">
                      <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 12, color: "var(--gray-900)" }}>
                        Share Your Workshop Feedback
                      </h3>

                      {revMsg.text && (
                        <div className={`alert alert-${revMsg.type}`}>{revMsg.text}</div>
                      )}

                      {revMsg.type !== "success" && (
                        <form onSubmit={handleReview}>
                          <div style={{ marginBottom: 14 }}>
                            <label className="form-label">Your Rating</label>
                            <StarPicker value={rating} onChange={setRating} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Your Experience</label>
                            <textarea
                              className="form-textarea"
                              placeholder="Write a few sentences on what you learned and how the instructor guided the session…"
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              style={{ minHeight: 90 }}
                            />
                          </div>
                          <button
                            type="submit"
                            className="btn btn-primary btn-sm"
                            disabled={revLoading}
                          >
                            {revLoading ? "Submitting Review…" : "Publish Review"}
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                )}

                {/* Reviews List */}
                {reviews.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <Star size={24} />
                    </div>
                    <div className="empty-state-title">No reviews yet</div>
                    <div className="empty-state-desc">
                      Be among the first participants to attend and leave a review!
                    </div>
                  </div>
                ) : (
                  <div>
                    {reviews.map((r) => (
                      <div key={r.id} className="review-item">
                        <div className="review-header">
                          <div className="review-avatar">
                            {r.user_name?.[0]?.toUpperCase() || "S"}
                          </div>
                          <div>
                            <div className="review-name">{r.user_name || "Student"}</div>
                            <div className="review-date">
                              {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}
                            </div>
                          </div>
                          <div style={{ marginLeft: "auto", display: "flex", gap: 2 }}>
                            {[1, 2, 3, 4, 5].map((st) => (
                              <Star
                                key={st}
                                size={14}
                                fill={st <= r.rating ? "#f59e0b" : "none"}
                                color={st <= r.rating ? "#f59e0b" : "var(--gray-300)"}
                              />
                            ))}
                          </div>
                        </div>
                        {r.comment && <div className="review-comment">{r.comment}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </main>

            {/* ── Sticky Booking Sidebar ──────────────── */}
            <aside>
              <div className="booking-card">
                <div className="booking-price">
                  {isFree ? (
                    <span style={{ color: "var(--success)", fontWeight: 800 }}>Free</span>
                  ) : (
                    <>
                      ₹{Number(price).toLocaleString()}
                      <span> / participant</span>
                    </>
                  )}
                </div>

                {bookMsg.text && (
                  <div className={`alert alert-${bookMsg.type}`}>{bookMsg.text}</div>
                )}

                <div className="booking-meta">
                  <div className="booking-meta-item">
                    <Calendar size={18} color="var(--brand-primary)" />
                    <div>
                      <div>Schedule</div>
                      <strong>{schedule ? new Date(schedule).toLocaleString() : "TBD by Instructor"}</strong>
                    </div>
                  </div>

                  <div className="booking-meta-item">
                    <Users size={18} color="var(--brand-primary)" />
                    <div>
                      <div>Capacity & Availability</div>
                      <strong>
                        {remaining_seats} of {capacity} seats remaining
                      </strong>
                    </div>
                  </div>

                  <div className="booking-meta-item">
                    <ShieldCheck size={18} color="var(--brand-primary)" />
                    <div>
                      <div>Access Pass</div>
                      <strong>Live interactive access + Q&A</strong>
                    </div>
                  </div>
                </div>

                {booked ? (
                  <div
                    style={{
                      padding: 16,
                      background: "var(--success-light)",
                      border: "1px solid var(--success-border)",
                      borderRadius: "var(--radius-md)",
                      textAlign: "center",
                      color: "var(--success-text)",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <CheckCircle2 size={18} />
                    You are enrolled in this workshop
                  </div>
                ) : isFull ? (
                  <button className="btn btn-full btn-lg" disabled style={{ background: "var(--gray-200)", color: "var(--gray-500)" }}>
                    Workshop is Sold Out
                  </button>
                ) : (
                  <button
                    className="btn btn-primary btn-full btn-lg"
                    onClick={handleBook}
                    disabled={booking}
                  >
                    {booking ? "Confirming Spot…" : isFree ? "Enroll Free Spot" : `Book Spot for ₹${Number(price).toLocaleString()}`}
                  </button>
                )}

                <div style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--gray-400)", marginTop: 14 }}>
                  Instant seat confirmation with full workshop access.
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
