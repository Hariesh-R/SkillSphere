// src/components/StarPicker.jsx
// Interactive star-rating picker for the review form using Lucide Star
import { Star } from "lucide-react";

export default function StarPicker({ value, onChange }) {
  return (
    <div className="flex gap-2" style={{ alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const isFilled = n <= value;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`Rate ${n} stars`}
            style={{
              padding: 4,
              borderRadius: "var(--radius-sm)",
              transition: "transform 140ms ease",
              color: isFilled ? "#f59e0b" : "var(--gray-300)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <Star
              size={24}
              fill={isFilled ? "#f59e0b" : "none"}
              strokeWidth={1.75}
            />
          </button>
        );
      })}
      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--gray-700)", marginLeft: 6 }}>
        {value} of 5
      </span>
    </div>
  );
}
