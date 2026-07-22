import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function Admin() {
  const { user, loading } = useAuth();
  const [submissions, setSubmissions] = useState(null);
  const [claims, setClaims] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    api.listSubmissions()
      .then(({ submissions }) => setSubmissions(submissions))
      .catch((err) => setError(err.message));
    api.listClaims()
      .then(({ claims }) => setClaims(claims))
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    if (user?.isAdmin) load();
  }, [user]);

  if (loading) return null;

  if (!user?.isAdmin) {
    return (
      <div className="max-w-lg mx-auto px-5 sm:px-8 py-24 text-center">
        <p className="font-display text-2xl mb-3">Not authorized</p>
        <p className="text-sm text-[var(--color-muted-fg)] mb-6">This page is admin-only.</p>
        <Link to="/" className="text-[var(--color-accent)] font-semibold hover:underline">Back home</Link>
      </div>
    );
  }

  const act = async (id, action) => {
    setBusyId(id);
    setError('');
    try {
      if (action === 'approve') await api.approveSubmission(id);
      else await api.rejectSubmission(id);
      setSubmissions((subs) => subs.map((s) => (s.id === id ? { ...s, status: action === 'approve' ? 'approved' : 'rejected' } : s)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const actOnClaim = async (id, action) => {
    setBusyId(id);
    setError('');
    try {
      if (action === 'approve') await api.approveClaim(id);
      else await api.rejectClaim(id);
      setClaims((cs) => cs.map((c) => (c.id === id ? { ...c, status: action === 'approve' ? 'approved' : 'rejected' } : c)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const pending = submissions?.filter((s) => s.status === 'pending') ?? [];
  const decided = submissions?.filter((s) => s.status !== 'pending') ?? [];
  const pendingClaims = claims?.filter((c) => c.status === 'pending') ?? [];
  const decidedClaims = claims?.filter((c) => c.status !== 'pending') ?? [];

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10">
      <h1 className="font-display text-3xl font-semibold">Submitted Shops</h1>
      <p className="text-[var(--color-muted-fg)] mt-1">Approve to publish a shop, reject to dismiss it.</p>

      {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

      {submissions === null ? (
        <p className="text-sm text-[var(--color-muted-fg)] mt-8">Loading…</p>
      ) : (
        <>
          <h2 className="font-display text-lg font-semibold mt-8 mb-3">Pending ({pending.length})</h2>
          {pending.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-fg)]">Nothing waiting on review.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {pending.map((s) => (
                <li key={s.id} className="border border-[var(--color-border)] rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-sm text-[var(--color-muted-fg)]">{s.address}, {s.city}{s.neighborhood ? ` · ${s.neighborhood}` : ''}</p>
                      {s.description && <p className="text-sm mt-2">{s.description}</p>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        disabled={busyId === s.id}
                        onClick={() => act(s.id, 'approve')}
                        className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-[var(--color-primary)] text-[var(--color-primary-fg)] disabled:opacity-60"
                      >
                        Approve
                      </button>
                      <button
                        disabled={busyId === s.id}
                        onClick={() => act(s.id, 'reject')}
                        className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-[var(--color-border)] disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {decided.length > 0 && (
            <>
              <h2 className="font-display text-lg font-semibold mt-10 mb-3">Reviewed</h2>
              <ul className="flex flex-col gap-2">
                {decided.map((s) => (
                  <li key={s.id} className="flex items-center justify-between text-sm py-2 border-b border-[var(--color-border)]">
                    <span>{s.name} <span className="text-[var(--color-muted-fg)]">· {s.city}</span></span>
                    <span className={s.status === 'approved' ? 'text-[var(--color-accent)] font-semibold' : 'text-[var(--color-muted-fg)]'}>
                      {s.status}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      <h1 className="font-display text-3xl font-semibold mt-16">Shop Ownership Claims</h1>
      <p className="text-[var(--color-muted-fg)] mt-1">Approve to hand over editing rights to that business account.</p>

      {claims === null ? (
        <p className="text-sm text-[var(--color-muted-fg)] mt-8">Loading…</p>
      ) : (
        <>
          <h2 className="font-display text-lg font-semibold mt-8 mb-3">Pending ({pendingClaims.length})</h2>
          {pendingClaims.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-fg)]">Nothing waiting on review.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {pendingClaims.map((c) => (
                <li key={c.id} className="border border-[var(--color-border)] rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{c.shop.name} <span className="text-[var(--color-muted-fg)] font-normal">· {c.shop.city}</span></p>
                      <p className="text-sm text-[var(--color-muted-fg)]">Claimed by {c.user.name} ({c.user.email})</p>
                      {c.message && <p className="text-sm mt-2">{c.message}</p>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        disabled={busyId === c.id}
                        onClick={() => actOnClaim(c.id, 'approve')}
                        className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-[var(--color-primary)] text-[var(--color-primary-fg)] disabled:opacity-60"
                      >
                        Approve
                      </button>
                      <button
                        disabled={busyId === c.id}
                        onClick={() => actOnClaim(c.id, 'reject')}
                        className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-[var(--color-border)] disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {decidedClaims.length > 0 && (
            <>
              <h2 className="font-display text-lg font-semibold mt-10 mb-3">Reviewed</h2>
              <ul className="flex flex-col gap-2">
                {decidedClaims.map((c) => (
                  <li key={c.id} className="flex items-center justify-between text-sm py-2 border-b border-[var(--color-border)]">
                    <span>{c.shop.name} <span className="text-[var(--color-muted-fg)]">· {c.user.name}</span></span>
                    <span className={c.status === 'approved' ? 'text-[var(--color-accent)] font-semibold' : 'text-[var(--color-muted-fg)]'}>
                      {c.status}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}
