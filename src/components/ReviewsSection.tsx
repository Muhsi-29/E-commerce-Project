import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, ThumbsUp, Trash2 } from 'lucide-react';
import { api, getErrorMessage } from '../api.ts';
import { useAuth } from '../context/auth.ts';
import type { ReviewPage } from '../types.ts';
import { formatDate } from '../utils/format.ts';
import StarRating, { StarInput } from './StarRating.tsx';
import './ReviewsSection.css';

const SORTS = [
  { value: 'helpful', label: 'Most helpful' },
  { value: 'newest', label: 'Newest' },
  { value: 'highest', label: 'Highest rated' },
  { value: 'lowest', label: 'Lowest rated' },
];

// Ratings summary, the review list and (for customers who received the product) the review form
export default function ReviewsSection({ productId, onRatingChange }: { productId: number; onRatingChange?: () => void }) {
  const { user } = useAuth();
  const [data, setData] = useState<ReviewPage | null>(null);
  const [sort, setSort] = useState('helpful');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ rating: 0, title: '', comment: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/products/${productId}/reviews`, { params: { sort, page } });
      setData(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [productId, sort, page]);

  useEffect(() => { load(); }, [load, user]);

  const openForm = () => {
    const mine = data?.myReview;
    setForm({ rating: mine?.rating ?? 0, title: mine?.title ?? '', comment: mine?.comment ?? '' });
    setFormError('');
    setFormOpen(true);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.rating === 0) {
      setFormError('Please choose a star rating.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await api.post(`/products/${productId}/reviews`, form);
      setFormOpen(false);
      await load();
      onRatingChange?.();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const vote = async (reviewId: number) => {
    try {
      const res = await api.post(`/reviews/${reviewId}/helpful`);
      setData(current => current && {
        ...current,
        reviews: current.reviews.map(r => (r.id === reviewId ? { ...r, ...res.data.data } : r)),
      });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const remove = async (reviewId: number) => {
    try {
      await api.delete(`/reviews/${reviewId}`);
      await load();
      onRatingChange?.();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (!data) return error ? <div className="alert alert-error">{error}</div> : null;
  const { summary } = data;

  return (
    <section className="reviews" id="reviews">
      <h2>Ratings & reviews</h2>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="reviews-layout">
        <aside className="reviews-summary card">
          {summary.count > 0 ? (
            <>
              <div className="reviews-average">
                <strong>{summary.average.toFixed(1)}</strong>
                <div>
                  <StarRating value={summary.average} size={18} />
                  <span>{summary.count} {summary.count === 1 ? 'rating' : 'ratings'}</span>
                </div>
              </div>
              <ul className="reviews-bars">
                {[5, 4, 3, 2, 1].map(star => {
                  const n = summary.breakdown[star] ?? 0;
                  return (
                    <li key={star}>
                      <span>{star}★</span>
                      <span className="bar"><span style={{ width: `${(n / summary.count) * 100}%` }} /></span>
                      <span className="bar-count">{n}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="muted">No reviews yet.</p>
          )}

          {data.canReview ? (
            <button className="btn btn-primary btn-sm" onClick={openForm}>
              {data.myReview ? 'Edit your review' : 'Write a review'}
            </button>
          ) : (
            <p className="reviews-note">
              {user
                ? 'Only customers who received this product can review it.'
                : <><Link to="/auth">Log in</Link> to review products you've bought.</>}
            </p>
          )}
        </aside>

        <div className="reviews-main">
          {formOpen && (
            <form className="review-form card" onSubmit={submit}>
              <h3>{data.myReview ? 'Edit your review' : 'Write a review'}</h3>
              <StarInput value={form.rating} onChange={rating => setForm(f => ({ ...f, rating }))} />
              <div className="input-group">
                <label className="input-label" htmlFor="review-title">Headline (optional)</label>
                <input id="review-title" className="input-field" maxLength={100} value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="review-comment">Your review</label>
                <textarea id="review-comment" className="input-field" rows={4} maxLength={2000} required value={form.comment}
                  placeholder="What did you like or dislike? How did you use it?"
                  onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} />
              </div>
              {formError && <div className="alert alert-error">{formError}</div>}
              <div className="review-form-actions">
                <button type="button" className="btn btn-outline btn-sm btn-inline" onClick={() => setFormOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm btn-inline" disabled={saving}>{saving ? 'Saving...' : 'Submit review'}</button>
              </div>
            </form>
          )}

          {summary.count > 0 && (
            <div className="reviews-toolbar">
              <label>
                Sort by{' '}
                <select className="input-field" value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}>
                  {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </label>
            </div>
          )}

          <ul className="review-list">
            {data.reviews.map(review => (
              <li key={review.id} className="review">
                <div className="review-head">
                  <StarRating value={review.rating} />
                  {review.title && <strong>{review.title}</strong>}
                </div>
                <p className="review-meta">
                  {review.author} · {formatDate(review.createdAt)} ·{' '}
                  <span className="verified"><BadgeCheck size={14} /> Verified purchase</span>
                </p>
                <p className="review-text">{review.comment}</p>
                <div className="review-actions">
                  {review.isMine ? (
                    <button className="btn-link danger-link" onClick={() => remove(review.id)}><Trash2 size={14} /> Delete</button>
                  ) : user ? (
                    <button className={`helpful-btn ${review.votedHelpful ? 'voted' : ''}`} onClick={() => vote(review.id)}>
                      <ThumbsUp size={14} /> Helpful{review.helpfulCount > 0 ? ` (${review.helpfulCount})` : ''}
                    </button>
                  ) : review.helpfulCount > 0 && (
                    <span className="muted small">{review.helpfulCount} found this helpful</span>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {data.totalPages > 1 && (
            <div className="review-pages">
              <button className="btn btn-outline btn-sm btn-inline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              <span>Page {page} of {data.totalPages}</span>
              <button className="btn btn-outline btn-sm btn-inline" disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
