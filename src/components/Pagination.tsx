import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

// Page numbers around the current page, with gaps: 1 … 4 5 6 … 10
const visiblePages = (page: number, totalPages: number) => {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  return [...pages].filter(p => p >= 1 && p <= totalPages).sort((a, b) => a - b);
};

export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = visiblePages(page, totalPages);

  return (
    <nav className="pagination" aria-label="Pagination">
      <button className="pagination-btn" onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Previous page">
        <ChevronLeft size={18} />
      </button>
      {pages.map((p, index) => (
        <span key={p} className="pagination-group">
          {index > 0 && p - pages[index - 1]! > 1 && <span className="pagination-gap">…</span>}
          <button
            className={`pagination-btn ${p === page ? 'active' : ''}`}
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        </span>
      ))}
      <button className="pagination-btn" onClick={() => onChange(page + 1)} disabled={page === totalPages} aria-label="Next page">
        <ChevronRight size={18} />
      </button>
    </nav>
  );
}
