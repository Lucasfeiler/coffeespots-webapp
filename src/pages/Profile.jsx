import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { requestNotificationToken } from '../lib/firebase';

const inputClass = "w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]";

const badges = [
  { count: 5, name: 'Explorer' },
  { count: 10, name: 'Regular' },
  { count: 25, name: 'Connoisseur' },
  { count: 50, name: 'Legend' },
];

function nextBadge(visitCount) {
  return badges.find((b) => visitCount < b.count) ?? null;
}

function formatJoinDate(dateString) {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Profile() {
  const { user, loading, updateProfile, deleteAccount, uploadPhoto } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');

  const [notifStatus, setNotifStatus] = useState('idle'); // idle | enabling | enabled | error | sending | sent
  const [notifError, setNotifError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setLocation(user.location ?? '');
      setBio(user.bio ?? '');
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [loading, user, navigate]);

  if (!user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    setSubmitting(true);
    try {
      await updateProfile({ name, location, bio });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    setDeleteError('');
    if (!window.confirm('This permanently deletes your account, favorites, and reviews. This cannot be undone. Continue?')) {
      return;
    }
    setDeleting(true);
    try {
      await deleteAccount(deletePassword);
      navigate('/');
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const joinDate = formatJoinDate(user.createdAt);
  const upcoming = nextBadge(user.visitCount ?? 0);
  const initials = user.name?.trim().slice(0, 2).toUpperCase() || '?';

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError('');
    setUploading(true);
    try {
      await uploadPhoto(file);
    } catch (err) {
      setPhotoError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleEnableNotifications = async () => {
    setNotifError('');
    setNotifStatus('enabling');
    try {
      const token = await requestNotificationToken();
      await api.registerDeviceToken(token);
      setNotifStatus('enabled');
    } catch (err) {
      setNotifError(err.message);
      setNotifStatus('error');
    }
  };

  const handleSendTest = async () => {
    setNotifError('');
    setNotifStatus('sending');
    try {
      const { sent } = await api.sendTestNotification();
      setNotifStatus(sent > 0 ? 'sent' : 'error');
      if (sent === 0) setNotifError('No notification was delivered — try enabling again.');
    } catch (err) {
      setNotifError(err.message);
      setNotifStatus('error');
    }
  };

  return (
    <div className="max-w-sm mx-auto px-5 sm:px-8 py-16">
      <h1 className="font-display text-3xl font-semibold mb-6">Your profile</h1>

      <div className="flex items-center gap-4">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name} className="w-16 h-16 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)] flex items-center justify-center font-display font-semibold text-lg shrink-0">
            {initials}
          </div>
        )}
        <div>
          <p className="text-sm text-[var(--color-muted-fg)]">{user.email}</p>
          {joinDate && <p className="text-xs text-[var(--color-muted-fg)] mt-1">Joined {joinDate}</p>}
          <label className="inline-block mt-2 text-xs font-semibold text-[var(--color-accent)] hover:underline cursor-pointer">
            {uploading ? 'Uploading…' : 'Upload photo'}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} disabled={uploading} className="hidden" />
          </label>
        </div>
      </div>
      {photoError && <p className="text-sm text-red-600 mt-2">{photoError}</p>}

      <div className="mt-6 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Visited shops</p>
          <p className="font-display text-2xl font-semibold text-[var(--color-accent)]">{user.visitCount ?? 0}</p>
        </div>
        <p className="text-xs text-[var(--color-muted-fg)] mt-1">
          {(user.visitCount ?? 0) === 0
            ? `Tap "I've been here" on a shop to start collecting badges.`
            : upcoming
              ? `${upcoming.count - user.visitCount} more for ${upcoming.name}.`
              : `You've earned every badge!`}
        </p>
      </div>

      <div className="mt-4 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4">
        <p className="text-sm font-semibold">Notifications</p>
        <p className="text-xs text-[var(--color-muted-fg)] mt-1">
          Get notified about new specialty shops and updates. You can turn this off anytime in your browser settings.
        </p>
        {notifError && <p className="text-sm text-red-500 mt-2">{notifError}</p>}
        <div className="mt-3 flex gap-2">
          {notifStatus !== 'enabled' && notifStatus !== 'sent' ? (
            <button
              onClick={handleEnableNotifications}
              disabled={notifStatus === 'enabling'}
              className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-fg)] font-semibold text-sm disabled:opacity-60"
            >
              {notifStatus === 'enabling' ? 'Enabling…' : 'Enable notifications'}
            </button>
          ) : (
            <button
              onClick={handleSendTest}
              disabled={notifStatus === 'sending'}
              className="px-4 py-2 rounded-xl border border-[var(--color-border)] font-semibold text-sm hover:bg-[var(--color-bg)] disabled:opacity-60"
            >
              {notifStatus === 'sending' ? 'Sending…' : notifStatus === 'sent' ? 'Sent — send another test' : 'Send test notification'}
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Name</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Home city</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={inputClass}
            placeholder="e.g. Munich"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Bio</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className={inputClass}
            placeholder="Tell other coffee lovers about yourself"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-[var(--color-accent)]">Saved.</p>}

        <button
          disabled={submitting}
          className="mt-2 px-6 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-fg)] font-semibold text-sm disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <div className="mt-12 border border-red-900/40 bg-red-950/20 rounded-xl p-5">
        <p className="text-sm font-semibold text-red-500">Danger zone</p>
        <p className="text-sm text-[var(--color-muted-fg)] mt-1">
          Deleting your account permanently removes your profile, favorites, and reviews. This cannot be undone.
        </p>

        {!showDeleteForm ? (
          <button
            onClick={() => setShowDeleteForm(true)}
            className="mt-4 px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors"
          >
            Delete account
          </button>
        ) : (
          <form onSubmit={handleDelete} className="mt-4 flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Confirm your password</span>
              <input
                required
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className={inputClass}
              />
            </label>
            {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}
            <div className="flex gap-2">
              <button
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : 'Permanently delete'}
              </button>
              <button
                type="button"
                onClick={() => { setShowDeleteForm(false); setDeletePassword(''); setDeleteError(''); }}
                className="px-5 py-2.5 rounded-xl border border-[var(--color-border)] font-semibold text-sm hover:bg-[var(--color-card)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
