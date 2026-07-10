// src/components/StarPicker.jsx
// Interactive star-rating picker for the review form

export default function StarPicker({ value, onChange }) {
  return (
    <div className="stars" style={{ gap: 6, cursor: "pointer" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`star${n <= value ? " filled" : ""}`}
          style={{ fontSize: "1.6rem", cursor: "pointer" }}
          onClick={() => onChange(n)}
          role="button"
          aria-label={`${n} star`}
        >
          ★
        </span>
      ))}
    </div>
  );
}
