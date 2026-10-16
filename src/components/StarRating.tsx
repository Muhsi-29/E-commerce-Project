import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;   // 0-5, can be fractional (4.3)
  count?: number;  // Number of ratings, shown in brackets
  size?: number;
}

// ★★★★☆ (12). Partial stars are filled proportionally.
export default function StarRating({ value, count, size = 14 }: StarRatingProps) {
  return (
    <span className="stars" aria-label={`${value.toFixed(1)} out of 5 stars${count !== undefined ? `, ${count} ratings` : ''}`}>
      {[1, 2, 3, 4, 5].map(n => {
        const fill = Math.max(0, Math.min(1, value - (n - 1)));
        return (
          <span key={n} className="star" style={{ width: size, height: size }}>
            <Star size={size} className="star-empty" />
            <span className="star-fill" style={{ width: `${fill * 100}%` }}>
              <Star size={size} />
            </span>
          </span>
        );
      })}
      {count !== undefined && <span className="stars-count">({count})</span>}
    </span>
  );
}

// Clickable stars for writing a review
export function StarInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <span className="star-input" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          className={n <= value ? 'on' : ''}
          onClick={() => onChange(n)}
        >
          <Star size={26} />
        </button>
      ))}
    </span>
  );
}
