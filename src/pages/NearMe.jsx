import { useEffect, useState } from 'react';
import { api } from '../lib/api';

function formatDistance(meters) {
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export default function NearMe() {
  const [status, setStatus] = useState('prompting'); // prompting | loading | ready | denied | error
  const [errorMessage, setErrorMessage] = useState('');
  const [shops, setShops] = useState([]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMessage("Your browser doesn't support location lookup.");
      return;
    }

    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const { shops } = await api.nearbyShops(latitude, longitude);
          setShops(shops);
          setStatus('ready');
        } catch (err) {
          setStatus('error');
          setErrorMessage(err.message);
        }
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'error');
        setErrorMessage(err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-12">
      <h1 className="font-display text-3xl sm:text-4xl font-semibold">Near Me</h1>
      <p className="text-[var(--color-muted-fg)] mt-2">
        Coffee spots close to wherever you are right now, sourced from OpenStreetMap.
      </p>

      {status === 'loading' && (
        <p className="mt-10 text-[var(--color-muted-fg)]">Finding coffee spots near you…</p>
      )}

      {status === 'denied' && (
        <div className="mt-10 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-5">
          <p className="font-semibold">Location access was denied.</p>
          <p className="text-sm text-[var(--color-muted-fg)] mt-1">
            Enable location access for this site in your browser settings, then try again.
          </p>
          <button
            onClick={requestLocation}
            className="mt-4 px-5 py-2 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-fg)] font-semibold text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-10 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-5">
          <p className="font-semibold">Couldn't load nearby coffee spots.</p>
          <p className="text-sm text-[var(--color-muted-fg)] mt-1">{errorMessage}</p>
          <button
            onClick={requestLocation}
            className="mt-4 px-5 py-2 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-fg)] font-semibold text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {status === 'ready' && shops.length === 0 && (
        <p className="mt-10 text-[var(--color-muted-fg)]">
          No coffee spots found nearby. Try again in a busier area.
        </p>
      )}

      {status === 'ready' && shops.length > 0 && (
        <ul className="mt-8 flex flex-col gap-3">
          {shops.map((s) => (
            <li
              key={s.id}
              className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4 flex items-start justify-between gap-4"
            >
              <div>
                <p className="font-display font-semibold">{s.name}</p>
                {s.address && <p className="text-sm text-[var(--color-muted-fg)] mt-1">{s.address}</p>}
                {s.website && (
                  <a
                    href={s.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-[var(--color-accent)] hover:underline mt-1 inline-block"
                  >
                    Website
                  </a>
                )}
              </div>
              <span className="shrink-0 text-sm font-semibold text-[var(--color-accent)]">
                {formatDistance(s.distanceMeters)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
