// src/pages/WorkshopDetail.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import StarPicker from "../components/StarPicker";

function Stars({ rating }) {
  const r = Math.round(rating || 0);
  return (
    <span className="stars">
      {[1,2,3,4,5].map((n) => (
        <span key={n} className={`star${n <= r ? " filled" : ""}`}>★</span>
      ))}
    </span>
  );
}

export default function WorkshopDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [workshop,  setWorkshop]  = useState(null);
  const [reviews,   setReviews]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [booking,   setBooking]   = useState(false);
  const [bookMsg,   setBookMsg]   = useState({ type: "", text: "" });
  const [booked,    setBooked]    = useState(false);

  // Review form
  const [rating,    setRating]    = useState(5);
  const [comment,   setComment]   = useState("");
  const [revLoading,setRevLoading]= useState(false);
  const [revMsg,    setRevMsg]    = useState({ type: "", text: "" });

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
          } catch { /* not logged in */ }
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
    if (!user) { navigate("/login", { state: { from: { pathname: `/workshops/${id}` } } }); return; }
    if (user.role !== "student") { setBookMsg({ type: "error", text: "Only students can book workshops." }); return; }
    setBooking(true);
    setBookMsg({ type: "", text: "" });
    try {
      await api.post("/bookings", { workshop_id: id });
      setBooked(true);
      setBookMsg({ type: "success", text: "🎉 Booking confirmed! Check your dashboard." });
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
      setRevMsg({ type: "success", text: "✅ Review submitted!" });
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

  if (loading) return <div className="spinner-wrap" style={{ minHeight: "60vh" }}><div className="spinner" /></div>;
  if (!workshop) return null;

  const {
    title, description, category, mode, price, capacity, remaining_seats,
    schedule, meet_link, image_url, avg_rating, review_count,
    instructor_name, instructor_email, instructor_bio, status,
  } = workshop;

  const isFull = remaining_seats === 0;
  const isFree = price === 0;

  return (
    <div style={{ background: "var(--gray-50)", minHeight: "calc(100vh - var(--nav-height))" }}>
      <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: "0.8rem", color: "var(--gray-500)", marginBottom: 24 }}>
          <Link to="/" style={{ color: "var(--brand-primary)" }}>Home</Link>
          {" / "}
          <Link to="/explore" style={{ color: "var(--brand-primary)" }}>Explore</Link>
          {" / "}
          {title}
        </div>

        <div className="workshop-detail-layout">
          {/* ── Main Content ──────────────────────────── */}
          <div>
            {/* Hero Image */}
            {image_url ? (
              <img src={image_url} alt={title} className="workshop-hero-img" />
            ) : (
              <div
                className="workshop-hero-placeholder"
                style={{ background: `linear-gradient(135deg, hsl(${title.charCodeAt(0)*7%360},70%,45%), hsl(${title.charCodeAt(0)*13%360},80%,35%))` }}
              >
                📚
              </div>
            )}

            {/* Badges */}
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:24, marginBottom:16 }}>
              <span className="badge badge-primary">{category}</span>
              <span className={`badge ${mode==="online"?"badge-primary":"badge-gray"}`}>
                {mode==="online" ? "🌐 Online" : "📍 Offline"}
              </span>
              {status !== "published" && (
                <span className="badge badge-warning">{status}</span>
              )}
            </div>

            <h1 style={{ fontFamily:"var(--font-display)", fontSize:"1.8rem", fontWeight:900, color:"var(--gray-900)", marginBottom:12, lineHeight:1.2 }}>
              {title}
            </h1>

            {avg_rating != null && (
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
                <Stars rating={avg_rating} />
                <span style={{ fontWeight:700, color:"#f59e0b" }}>{avg_rating.toFixed(1)}</span>
                <span style={{ color:"var(--gray-400)", fontSize:"0.875rem" }}>({review_count} reviews)</span>
              </div>
            )}

            {/* Instructor */}
            <div className="instructor-card">
              <div className="instructor-avatar">
                {instructor_name?.[0]?.toUpperCase() || "I"}
              </div>
              <div>
                <div className="instructor-name">{instructor_name}</div>
                <div className="instructor-email">{instructor_email}</div>
                {instructor_bio && (
                  <div style={{ fontSize:"0.8rem", color:"var(--gray-600)", marginTop:4 }}>{instructor_bio}</div>
                )}
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom:32 }}>
              <h2 style={{ fontSize:"1.1rem", fontWeight:700, marginBottom:12, color:"var(--gray-900)" }}>About This Workshop</h2>
              <p style={{ color:"var(--gray-600)", lineHeight:1.8, whiteSpace:"pre-wrap" }}>
                {description || "No description provided."}
              </p>
            </div>

            {meet_link && mode === "online" && (
              <div style={{ padding:"16px 20px", background:"var(--info-light)", borderRadius:"var(--radius-lg)", marginBottom:24, display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:"1.2rem" }}>🔗</span>
                <div>
                  <div style={{ fontWeight:600, fontSize:"0.875rem", color:"var(--info)" }}>Meeting Link</div>
                  <a href={meet_link} target="_blank" rel="noreferrer" style={{ fontSize:"0.8rem", color:"var(--info)" }}>{meet_link}</a>
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="divider" />
            <h2 style={{ fontSize:"1.1rem", fontWeight:700, marginBottom:20, color:"var(--gray-900)" }}>
              Reviews {review_count > 0 && `(${review_count})`}
            </h2>

            {/* Leave a review */}
            {user?.role === "student" && booked && (
              <div style={{ background:"var(--gray-50)", borderRadius:"var(--radius-lg)", padding:20, marginBottom:24 }}>
                <div style={{ fontWeight:700, marginBottom:12 }}>Leave a Review</div>
                {revMsg.text && (
                  <div className={`alert alert-${revMsg.type}`}>{revMsg.text}</div>
                )}
                {revMsg.type !== "success" && (
                  <form onSubmit={handleReview}>
                    <div style={{ marginBottom:12 }}>
                      <StarPicker value={rating} onChange={setRating} />
                    </div>
                    <textarea
                      className="form-textarea"
                      placeholder="Share your experience (optional)…"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      style={{ minHeight:80 }}
                    />
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      style={{ marginTop:10 }}
                      disabled={revLoading}
                    >
                      {revLoading ? "Submitting…" : "Submit Review"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {reviews.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">💬</div>
                <div className="empty-state-title">No reviews yet</div>
                <div className="empty-state-desc">Be the first to review this workshop!</div>
              </div>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="review-item">
                  <div className="review-header">
                    <div className="review-avatar">
                      {(r.student_name || r.reviewer_name || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="review-name">{r.student_name || r.reviewer_name}</div>
                      <div className="review-date">
                        {new Date(r.created_at).toLocaleDateString("en-IN", { year:"numeric", month:"short", day:"numeric" })}
                      </div>
                    </div>
                    <Stars rating={r.rating} />
                  </div>
                  {r.comment && <div className="review-comment">{r.comment}</div>}
                </div>
              ))
            )}
          </div>

          {/* ── Booking Card ─────────────────────────── */}
          <div>
            <div className="booking-card">
              <div className="booking-price">
                {isFree ? <span style={{ color:"var(--success)" }}>Free</span> : `₹${price}`}
                <span> / person</span>
              </div>

              {bookMsg.text && (
                <div className={`alert alert-${bookMsg.type}`}>{bookMsg.text}</div>
              )}

              {booked ? (
                <div className="alert alert-success">✅ You're booked!</div>
              ) : (
                <button
                  className="btn btn-primary btn-full btn-lg"
                  onClick={handleBook}
                  disabled={booking || isFull || status !== "published"}
                >
                  {booking ? "Booking…" : isFull ? "Fully Booked" : status !== "published" ? "Not Available" : "Book Now"}
                </button>
              )}

              {!user && (
                <p style={{ textAlign:"center", fontSize:"0.8rem", color:"var(--gray-500)", marginTop:10 }}>
                  <Link to="/login" style={{ color:"var(--brand-primary)" }}>Log in</Link> to book this workshop
                </p>
              )}

              <div className="booking-meta">
                {schedule && (
                  <div className="booking-meta-item">
                    <span>📅</span>
                    <div>
                      <div style={{ fontSize:"0.75rem", color:"var(--gray-400)" }}>Schedule</div>
                      <strong>{new Date(schedule).toLocaleDateString("en-IN", { weekday:"short", year:"numeric", month:"short", day:"numeric" })}</strong>
                    </div>
                  </div>
                )}
                <div className="booking-meta-item">
                  <span>🪑</span>
                  <div>
                    <div style={{ fontSize:"0.75rem", color:"var(--gray-400)" }}>Seats</div>
                    <strong style={{ color: remaining_seats <= 5 ? "var(--error)" : undefined }}>
                      {remaining_seats} of {capacity} left
                    </strong>
                  </div>
                </div>
                <div className="booking-meta-item">
                  <span>{mode==="online"?"🌐":"📍"}</span>
                  <div>
                    <div style={{ fontSize:"0.75rem", color:"var(--gray-400)" }}>Mode</div>
                    <strong style={{ textTransform:"capitalize" }}>{mode}</strong>
                  </div>
                </div>
              </div>

              <div className="divider" />
              <div style={{ fontSize:"0.8rem", color:"var(--gray-500)", display:"flex", flexDirection:"column", gap:6 }}>
                <div>✅ Instant confirmation</div>
                <div>🔄 Free cancellation anytime</div>
                <div>📩 Booking details sent to email</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
