import { useEffect, useRef, useState } from 'react';
import { useShops } from '../context/ShopsContext';
import { loadGoogleMaps } from '../lib/loadGoogleMaps';

export default function MapPage() {
  const { shops } = useShops();
  const mapRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const located = shops.filter((s) => s.lat != null && s.lng != null);
    if (located.length === 0) return;

    let cancelled = false;

    loadGoogleMaps()
      // Give the browser one tick to finish applying layout/CSS before Maps
      // measures the container — without this it can size itself against a
      // 0×0 box and never recover, even after the container gets its real size.
      .then((maps) => new Promise((resolve) => setTimeout(() => resolve(maps), 0)))
      .then((maps) => {
        if (cancelled || !mapRef.current) return;

        const map = new maps.Map(mapRef.current, {
          center: { lat: 48, lng: 12 },
          zoom: 5,
        });

        const bounds = new maps.LatLngBounds();
        const infoWindow = new maps.InfoWindow();

        for (const shop of located) {
          const position = { lat: shop.lat, lng: shop.lng };
          bounds.extend(position);

          const marker = new maps.Marker({
            map,
            position,
            title: shop.name,
          });

          marker.addListener('click', () => {
            infoWindow.setContent(`
              <div style="font-family: sans-serif; padding: 2px;">
                <p style="font-weight: 600; margin: 0 0 4px;">${shop.name}</p>
                <p style="font-size: 12px; color: #666; margin: 0 0 6px;">${shop.address}</p>
                <a href="/shop/${shop.slug}" style="font-size: 13px; font-weight: 600;">View shop &rarr;</a>
              </div>
            `);
            infoWindow.open({ map, anchor: marker });
          });
        }

        maps.event.trigger(map, 'resize');
        map.fitBounds(bounds);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMessage(err.message);
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [shops]);

  const located = shops.filter((s) => s.lat != null && s.lng != null);

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
      <h1 className="font-display text-3xl sm:text-4xl font-semibold">Map</h1>
      <p className="text-[var(--color-muted-fg)] mt-2 max-w-xl">
        All {located.length} coffee spots with a known location. Click a pin for details.
      </p>

      <div className="relative mt-8 w-full h-[600px] rounded-2xl border border-[var(--color-border)] overflow-hidden">
        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-card)] text-center px-6">
            <p className="text-sm text-[var(--color-muted-fg)]">Couldn't load the map: {errorMessage}</p>
          </div>
        )}
        {status === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-card)]">
            <p className="text-sm text-[var(--color-muted-fg)]">Loading map…</p>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />
      </div>
    </div>
  );
}
