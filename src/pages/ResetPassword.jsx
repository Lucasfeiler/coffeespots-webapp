import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';

const inputClass = "w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="max-w-sm mx-auto px-5 sm:px-8 py-20 text-center">
        <p className="font-display text-2xl mb-3">Invalid reset link</p>
        <Link to="/auth" className="text-[var(--color-accent)] font-semibold hover:underline">Back to sign in</Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-sm mx-auto px-5 sm:px-8 py-20 text-center">
        <p className="font-display text-2xl mb-3">Password updated</p>
        <p className="text-sm text-[var(--color-muted-fg)] mb-6">You can now sign in with your new password.</p>
        <button
          onClick={() => navigate('/auth')}
          className="px-6 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-fg)] font-semibold text-sm"
        >
          Go to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-5 sm:px-8 py-20">
      <h1 className="font-display text-3xl font-semibold mb-2 text-center">Set a new password</h1>
      <p className="text-sm text-[var(--color-muted-fg)] text-center mb-8">Choose a new password for your account.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          required
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={submitting}
          className="px-6 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-fg)] font-semibold text-sm disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Set new password'}
        </button>
      </form>
    </div>
  );
}
