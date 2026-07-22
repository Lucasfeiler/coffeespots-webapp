import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useShops } from '../context/ShopsContext';
import { api } from '../lib/api';

const inputClass = "w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]";
const dayLabels = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export default function MyShop() {
  const { user, loading: authLoading } = useAuth();
  const { shops } = useShops();
  const navigate = useNavigate();

  const [myShops, setMyShops] = useState(null);
  const [myClaims, setMyClaims] = useState([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user?.accountType !== 'business') return;
    Promise.all([api.myShops(), api.myClaims()])
      .then(([shopsRes, claimsRes]) => {
        setMyShops(shopsRes.shops);
        setMyClaims(claimsRes.claims);
      })
      .catch((err) => setLoadError(err.message));
  }, [user]);

  if (authLoading || !user) return null;

  if (user.accountType !== 'business') {
    return (
      <div className="max-w-lg mx-auto px-5 sm:px-8 py-24 text-center">
        <p className="font-display text-2xl mb-3">Business accounts only</p>
        <p className="text-sm text-[var(--color-muted-fg)]">
          Claiming and managing a shop listing is only available for cafe owner accounts.
        </p>
      </div>
    );
  }

  if (myShops === null) {
    return <div className="max-w-2xl mx-auto px-5 sm:px-8 py-20 text-center text-[var(--color-muted-fg)]">Loading…</div>;
  }

  if (loadError) {
    return <div className="max-w-2xl mx-auto px-5 sm:px-8 py-20 text-center text-red-600">{loadError}</div>;
  }

  if (myShops.length === 0) {
    return <ClaimShopFlow shops={shops} claims={myClaims} onClaimed={() => api.myClaims().then((r) => setMyClaims(r.claims))} />;
  }

  return <EditShopForm shop={myShops[0]} onSaved={(shop) => setMyShops([shop])} />;
}

function ClaimShopFlow({ shops, claims, onClaimed }) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const claimedShopIds = new Set(claims.filter((c) => c.status === 'pending').map((c) => c.shopId));
  const available = shops.filter(
    (s) => !s.ownerId && !claimedShopIds.has(s.id) && s.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    setError('');
    setSubmitting(true);
    try {
      await api.claimShop(selectedId, message);
      setSubmitted(true);
      onClaimed();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-5 sm:px-8 py-12">
      <h1 className="font-display text-3xl sm:text-4xl font-semibold">Claim Your Cafe</h1>
      <p className="text-[var(--color-muted-fg)] mt-2">
        Find your cafe in the list below to request ownership. We'll review it and get you access to edit
        its listing.
      </p>

      {claims.length > 0 && (
        <div className="mt-6 flex flex-col gap-2">
          {claims.map((c) => (
            <div key={c.id} className="flex items-center justify-between text-sm bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-4 py-2.5">
              <span>{c.shop.name} <span className="text-[var(--color-muted-fg)]">· {c.shop.city}</span></span>
              <span className={c.status === 'pending' ? 'text-[var(--color-accent)] font-semibold' : 'text-[var(--color-muted-fg)]'}>
                {c.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {submitted ? (
        <p className="mt-8 text-sm text-[var(--color-accent)] font-semibold">
          Claim submitted — we'll review it and let you know.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <input
            placeholder="Search for your cafe by name…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedId(null); }}
            className={inputClass}
          />
          {query && (
            <div className="max-h-60 overflow-y-auto flex flex-col gap-1 border border-[var(--color-border)] rounded-xl p-2">
              {available.length === 0 ? (
                <p className="text-sm text-[var(--color-muted-fg)] px-2 py-2">No unclaimed shops match.</p>
              ) : (
                available.slice(0, 20).map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedId === s.id ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)]' : 'hover:bg-[var(--color-card)]'
                    }`}
                  >
                    {s.name} <span className={selectedId === s.id ? 'opacity-80' : 'text-[var(--color-muted-fg)]'}>· {s.city}</span>
                  </button>
                ))
              )}
            </div>
          )}
          <textarea
            placeholder="Anything that helps us verify you own this cafe (optional)"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={inputClass}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            disabled={!selectedId || submitting}
            className="px-6 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-fg)] font-semibold text-sm disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit claim'}
          </button>
        </form>
      )}
    </div>
  );
}

function EditShopForm({ shop, onSaved }) {
  const [description, setDescription] = useState(shop.description ?? '');
  const [tags, setTags] = useState((shop.tags ?? []).join(', '));
  const [website, setWebsite] = useState(shop.website ?? '');
  const [instagram, setInstagram] = useState(shop.instagram ?? '');
  const [hours, setHours] = useState(shop.hours ?? {});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [photoError, setPhotoError] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    setSaving(true);
    try {
      const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
      const shopRes = await api.updateShop(shop.slug, { description, tags: tagList, website, instagram, hours });
      onSaved(shopRes.shop);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError('');
    setUploading(true);
    try {
      const { shop: updated } = await api.uploadShopPhoto(shop.slug, file);
      onSaved(updated);
    } catch (err) {
      setPhotoError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-lg mx-auto px-5 sm:px-8 py-12">
      <h1 className="font-display text-3xl sm:text-4xl font-semibold">{shop.name}</h1>
      <p className="text-[var(--color-muted-fg)] mt-1">{shop.address}, {shop.city}</p>

      <div className="mt-6">
        <p className="text-sm font-semibold mb-2">Photos</p>
        {shop.images?.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-3">
            {shop.images.map((src) => (
              <img key={src} src={src} alt={shop.name} className="w-20 h-20 rounded-lg object-cover" />
            ))}
          </div>
        )}
        <label className="inline-block text-xs font-semibold text-[var(--color-accent)] hover:underline cursor-pointer">
          {uploading ? 'Uploading…' : 'Add a photo'}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} disabled={uploading} className="hidden" />
        </label>
        <p className="text-xs text-[var(--color-muted-fg)] mt-1">JPEG, PNG, or WebP — up to 5MB</p>
        {photoError && <p className="text-sm text-red-600 mt-2">{photoError}</p>}
      </div>

      <form onSubmit={handleSave} className="mt-8 flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Description</span>
          <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Tags (comma-separated)</span>
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. light roast, pour over, wifi" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Website</span>
          <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Instagram</span>
          <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/…" className={inputClass} />
        </label>

        <div>
          <p className="text-sm font-medium mb-2">Opening hours</p>
          <div className="flex flex-col gap-2">
            {dayKeys.map((day) => (
              <div key={day} className="flex items-center gap-3">
                <span className="w-10 text-xs font-medium text-[var(--color-muted-fg)]">{dayLabels[day]}</span>
                <input
                  value={hours[day] ?? ''}
                  onChange={(e) => setHours((h) => ({ ...h, [day]: e.target.value }))}
                  placeholder="e.g. 8:00–18:00 or Closed"
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-[var(--color-accent)] font-semibold">Saved.</p>}
        <button disabled={saving} className="px-6 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-fg)] font-semibold text-sm disabled:opacity-60">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
