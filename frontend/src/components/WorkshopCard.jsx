// src/components/WorkshopCard.jsx
import { useNavigate } from "react-router-dom";

const CATEGORY_EMOJIS = {
  Programming: "💻", Design: "🎨", Business: "💼", Marketing: "📣",
  Music: "🎵", Photography: "📷", Health: "🏃", Cooking: "🍳",
  Language: "🌍", Finance: "💰", Science: "🔬", Art: "🖌️",
};

function Stars({ rating }) {
  const r = Math.round(rating || 0);
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`star${n <= r ? " filled" : ""}`}>★</span>
      ))}
    </div>
  );
}

export default function WorkshopCard({ workshop }) {
  const navigate = useNavigate();

  const {
    id, title, category, mode, price,
    instructor_name, avg_rating, review_count,
    remaining_seats, image_url, capacity,
  } = workshop;

  const emoji = CATEGORY_EMOJIS[category] || "📚";
  const isFree = price === 0;
  const isFull = remaining_seats === 0;
  const isLow = remaining_seats > 0 && remaining_seats <= 5;

  return (
    <div className="card workshop-card" onClick={() => navigate(`/workshops/${id}`)}>
      {image_url ? (
        <img src={image_url} alt={title} className="workshop-card-img" />
      ) : (
        <div
          className="workshop-card-img-placeholder"
          style={{
            background: `linear-gradient(135deg, hsl(${(title.charCodeAt(0) * 7) % 360},70%,50%), hsl(${(title.charCodeAt(0) * 13) % 360},80%,40%))`,
          }}
        >
          {emoji}
        </div>
      )}
      <div className="workshop-card-body">
        <div className="workshop-card-category">{category}</div>
        <div className="workshop-card-title">{title}</div>
        <div className="workshop-card-instructor">by {instructor_name || "Instructor"}</div>

        {avg_rating != null && (
          <div className="workshop-card-rating">
            <Stars rating={avg_rating} />
            <span style={{ fontWeight: 700, color: "#f59e0b" }}>{avg_rating?.toFixed(1)}</span>
            <span style={{ color: "var(--gray-400)" }}>({review_count})</span>
          </div>
        )}

        <div className="workshop-card-meta">
          <div className={`workshop-card-price${isFree ? " workshop-card-price-free" : ""}`}>
            {isFree ? "Free" : `₹${price}`}
          </div>
          <div className="flex gap-2" style={{ alignItems: "center" }}>
            <span className={`badge ${mode === "online" ? "badge-primary" : "badge-gray"}`}>
              {mode === "online" ? "🌐 Online" : "📍 Offline"}
            </span>
            {isFull ? (
              <span className="workshop-card-seats low">Full</span>
            ) : isLow ? (
              <span className="workshop-card-seats low">{remaining_seats} left</span>
            ) : (
              <span className="workshop-card-seats">{remaining_seats}/{capacity} seats</span>
            )}
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <button className="btn btn-outline btn-full btn-sm" onClick={(e) => {
            e.stopPropagation();
            navigate(`/workshops/${id}`);
          }}>
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
