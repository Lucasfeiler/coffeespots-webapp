import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import PhotoGallery from '../components/PhotoGallery';
import { useFavorites } from '../context/FavoritesContext';
import { useVisits } from '../context/VisitsContext';
import { useAuth } from '../context/AuthContext';

const dayLabels = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };

export default function ShopDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isVisited, toggleVisit } = useVisits();

  const [shop, setShop] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, text: '' });
  const [reviewError, setReviewError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadShop = () => {
    api.getShop(slug)
      .then(({ shop }) => setShop(shop))
      .catch(() => setNotFound(true));
  };

  const loadReviews = () => {
    api.listReviews(slug).then(({ reviews }) => setReviews(reviews)).catch(() => {});
  };

  useEffect(() => {
    setShop(null);
    setNotFound(false);
    loadShop();
    loadReviews();
  }, [slug]);

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-20 text-center">
        <p className="font-display text-2xl mb-3">Shop not found</p>
        <Link to="/explore" className="text-[var(--color-accent)] font-semibold hover:underline">
          Back to explore
        </Link>
      </div>
    );
  }

  if (!shop) {
    return <div className="max-w-3xl mx-auto px-5 sm:px-8 py-20 text-center text-[var(--color-muted-fg)]">Loading…</div>;
  }

  const fav = isFavorite(shop.id);
  const visited = isVisited(shop.id);

  const handleFavoriteClick = () => {
    if (!user) return navigate('/auth');
    toggleFavorite(shop.id);
  };

  const handleVisitClick = () => {
    if (!user) return navigate('/auth');
    toggleVisit(shop.id);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    setSubmitting(true);
    try {
      await api.addReview(slug, Number(reviewForm.rating), reviewForm.text);
      setReviewForm({ rating: 5, text: '' });
      loadReviews();
      loadShop();
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-8">
      <Link to="/explore" className="text-sm font-semibold text-[var(--color-accent)] hover:underline">
        ← Back to explore
      </Link>

      <PhotoGallery shop={shop} className="w-full h-56 sm:h-72 rounded-2xl mt-4" />

      <div className="flex items-start justify-between gap-4 mt-6">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold">{shop.name}</h1>
        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={handleFavoriteClick}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
              fav
                ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)] border-[var(--color-primary)]'
                : 'border-[var(--color-border)] hover:bg-[var(--color-card)]'
            }`}
          >
            {fav ? '♥ Saved' : '♡ Save'}
          </button>
          <button
            onClick={handleVisitClick}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
              visited
                ? 'bg-[var(--color-accent)] text-[var(--color-accent-fg)] border-[var(--color-accent)]'
                : 'border-[var(--color-border)] hover:bg-[var(--color-card)]'
            }`}
          >
            {visited ? '✓ Visited' : "I've been here"}
          </button>
        </div>
      </div>
      <p className="text-[var(--color-muted-fg)] mt-1">{shop.address}</p>
      <p className="text-sm text-[var(--color-muted-fg)] mt-1">
        {shop.rating > 0 ? `★ ${shop.rating.toFixed(1)}` : '—'} ({shop.reviewCount} reviews)
        {shop.neighborhood && <span className="text-[var(--color-accent)] font-medium"> · {shop.neighborhood}</span>}
      </p>

      {shop.placeholder ? (
        <p className="mt-5 text-sm italic text-[var(--color-muted-fg)] bg-[var(--color-card)] rounded-xl px-4 py-3">
          Full description, tags, and hours for this shop weren't available from the list view when this
          was pulled from your live site — add them here once you have the details.
        </p>
      ) : (
        <p className="mt-5 text-base leading-relaxed">{shop.description}</p>
      )}

      {shop.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-5">
          {shop.tags.map((t) => (
            <span key={t} className="text-xs uppercase tracking-wide bg-[var(--color-border)] text-[var(--color-muted-fg)] px-3 py-1.5 rounded-full">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-4 mt-6">
        {shop.website && (
          <a href={shop.website} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[var(--color-accent)] hover:underline">
            Website
          </a>
        )}
        {shop.instagram && (
          <a href={shop.instagram} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[var(--color-accent)] hover:underline">
            Instagram
          </a>
        )}
      </div>

      <div className="border-t border-[var(--color-border)] mt-10 pt-8">
        <h2 className="font-display text-xl font-semibold mb-3">Reviews</h2>

        {user ? (
          <form onSubmit={handleReviewSubmit} className="flex flex-col gap-3 mb-8 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              Rating
              <select
                value={reviewForm.rating}
                onChange={(e) => setReviewForm((f) => ({ ...f, rating: e.target.value }))}
                className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm"
              >
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
              </select>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Share your experience…"
              value={reviewForm.text}
              onChange={(e) => setReviewForm((f) => ({ ...f, text: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
            {reviewError && <p className="text-sm text-red-600">{reviewError}</p>}
            <button
              disabled={submitting}
              className="self-start px-5 py-2 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-fg)] font-semibold text-sm disabled:opacity-60"
            >
              {submitting ? 'Posting…' : 'Post review'}
            </button>
          </form>
        ) : (
          <p className="text-sm text-[var(--color-muted-fg)] mb-6">
            <Link to="/auth" className="text-[var(--color-accent)] font-semibold hover:underline">Sign in</Link> to leave a review.
          </p>
        )}

        {reviews.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-fg)]">No reviews yet. Be the first!</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {reviews.map((r) => (
              <li key={r.id} className="border-b border-[var(--color-border)] pb-4">
                <p className="text-sm font-semibold">{r.authorName} <span className="text-[var(--color-accent)] font-normal">· {'★'.repeat(r.rating)}</span></p>
                <p className="text-sm text-[var(--color-muted-fg)] mt-1">{r.text}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {shop.hours && (
        <div className="border-t border-[var(--color-border)] mt-8 pt-8">
          <h2 className="font-display text-xl font-semibold mb-3">Opening Hours</h2>
          <dl className="text-sm divide-y divide-[var(--color-border)]">
            {Object.entries(shop.hours).map(([day, val]) => (
              <div key={day} className="flex justify-between py-1.5">
                <dt className="font-medium">{dayLabels[day]}</dt>
                <dd className="text-[var(--color-muted-fg)]">{val}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
