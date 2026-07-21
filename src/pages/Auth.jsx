import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

const inputClass = "w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]";

export default function Auth() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // login | register | forgot
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form.email, form.password, form.name);
      navigate('/favorites');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.forgotPassword(form.email);
      setResetSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (mode === 'forgot') {
    return (
      <div className="max-w-sm mx-auto px-5 sm:px-8 py-20">
        <h1 className="font-display text-3xl font-semibold mb-2 text-center">Reset password</h1>
        <p className="text-sm text-[var(--color-muted-fg)] text-center mb-8">
          Enter your email and we'll send you a link to set a new password.
        </p>

        {resetSent ? (
          <p className="text-sm text-center text-[var(--color-accent)]">
            If that email has an account, a reset link is on its way. Check your inbox.
          </p>
        ) : (
          <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
            <input required type="email" placeholder="Email" value={form.email} onChange={update('email')} className={inputClass} />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              disabled={submitting}
              className="px-6 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-fg)] font-semibold text-sm disabled:opacity-60"
            >
              {submitting ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <p className="text-sm text-center mt-6 text-[var(--color-muted-fg)]">
          <button onClick={() => { setMode('login'); setResetSent(false); setError(''); }} className="text-[var(--color-accent)] font-semibold hover:underline">
            Back to sign in
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-5 sm:px-8 py-20">
      <h1 className="font-display text-3xl font-semibold mb-2 text-center">
        {mode === 'login' ? 'Sign in' : 'Create account'}
      </h1>
      <p className="text-sm text-[var(--color-muted-fg)] text-center mb-8">
        Save favorites and leave reviews.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === 'register' && (
          <input required placeholder="Name" value={form.name} onChange={update('name')} className={inputClass} />
        )}
        <input required type="email" placeholder="Email" value={form.email} onChange={update('email')} className={inputClass} />
        <input required type="password" placeholder="Password" value={form.password} onChange={update('password')} className={inputClass} />

        {mode === 'login' && (
          <button
            type="button"
            onClick={() => { setMode('forgot'); setError(''); }}
            className="text-xs text-[var(--color-accent)] hover:underline self-end -mt-2"
          >
            Forgot password?
          </button>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          disabled={submitting}
          className="px-6 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-fg)] font-semibold text-sm disabled:opacity-60"
        >
          {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <p className="text-sm text-center mt-6 text-[var(--color-muted-fg)]">
        {mode === 'login' ? (
          <>No account? <button onClick={() => setMode('register')} className="text-[var(--color-accent)] font-semibold hover:underline">Create one</button></>
        ) : (
          <>Already have an account? <button onClick={() => setMode('login')} className="text-[var(--color-accent)] font-semibold hover:underline">Sign in</button></>
        )}
      </p>
    </div>
  );
}
