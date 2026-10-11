// src/components/WorkshopCard.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Globe, MapPin, User, Users } from "lucide-react";
import { getWorkshopImage } from "../utils/categoryImages";

export default function WorkshopCard({ workshop }) {
  const navigate = useNavigate();

  const {
    id,
    title,
    category,
    mode,
    price,
    instructor_name,
    avg_rating,
    review_count,
    remaining_seats,
    image_url,
    capacity,
  } = workshop;

  const fallbackUrl = getWorkshopImage(category, image_url);
  const [imgSrc, setImgSrc] = useState(fallbackUrl);

  const isFree = price === 0 || price === "0";
  const isFull = remaining_seats === 0;
  const isLow = remaining_seats > 0 && remaining_seats <= 5;

  return (
    <article
      className="card card-hoverable workshop-card"
      onClick={() => navigate(`/workshops/${id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`/workshops/${id}`);
        }
      }}
      aria-label={`Workshop: ${title} by ${instructor_name || "Instructor"}`}
    >
      <div className="workshop-card-img-wrap">
        <img
          src={imgSrc}
          alt={title}
          className="workshop-card-img"
          loading="lazy"
          onError={() => {
            // If primary image fails, fall back to curated category photography
            const secondaryFallback = getWorkshopImage(category);
            if (imgSrc !== secondaryFallback) {
              setImgSrc(secondaryFallback);
            }
          }}
        />
        <div className="workshop-card-category-badge">{category}</div>
        <div className="workshop-card-mode-badge">
          {mode === "online" ? (
            <>
              <Globe size={13} color="var(--brand-primary)" strokeWidth={2.2} />
              <span>Online</span>
            </>
          ) : (
            <>
              <MapPin size={13} color="var(--brand-violet)" strokeWidth={2.2} />
              <span>In Person</span>
            </>
          )}
        </div>
      </div>

      <div className="workshop-card-body">
        <h3 className="workshop-card-title">{title}</h3>

        <div className="workshop-card-instructor">
          <User size={14} color="var(--gray-400)" />
          <span>{instructor_name || "Community Instructor"}</span>
        </div>

        {avg_rating != null && (
          <div className="workshop-card-rating">
            <div className="flex gap-1" style={{ alignItems: "center" }}>
              {[1, 2, 3, 4, 5].map((starIdx) => (
                <Star
                  key={starIdx}
                  size={14}
                  fill={starIdx <= Math.round(avg_rating) ? "#f59e0b" : "none"}
                  color={starIdx <= Math.round(avg_rating) ? "#f59e0b" : "var(--gray-300)"}
                  strokeWidth={1.8}
                />
              ))}
            </div>
            <span style={{ fontWeight: 700, color: "var(--gray-900)" }}>
              {Number(avg_rating).toFixed(1)}
            </span>
            <span style={{ color: "var(--gray-400)", fontSize: "0.8rem" }}>
              ({review_count || 0})
            </span>
          </div>
        )}

        <div className="workshop-card-meta">
          <div>
            <div className={`workshop-card-price${isFree ? " workshop-card-price-free" : ""}`}>
              {isFree ? "Free" : `₹${Number(price).toLocaleString()}`}
            </div>
          </div>

          <div>
            {isFull ? (
              <span className="badge badge-danger">Sold Out</span>
            ) : isLow ? (
              <span className="badge badge-warning">{remaining_seats} seats left</span>
            ) : (
              <span className="badge badge-gray flex gap-1">
                <Users size={12} />
                {remaining_seats}/{capacity} seats
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
