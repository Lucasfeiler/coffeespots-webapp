import { Router } from 'express';

export const nearbyRouter = Router();

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map();

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatAddress(tags) {
  const parts = [
    [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' '),
    [tags['addr:postcode'], tags['addr:city']].filter(Boolean).join(' '),
  ].filter(Boolean);
  return parts.join(', ') || null;
}

nearbyRouter.get('/', async (req, res) => {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  const radius = Math.min(Number(req.query.radius) || 1500, 5000);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ error: 'lat and lon are required' });
  }

  const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)},${radius}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return res.json({ shops: cached.shops, source: 'osm', cached: true });
  }

  const query = `[out:json][timeout:25];(node["amenity"="cafe"](around:${radius},${lat},${lon});way["amenity"="cafe"](around:${radius},${lat},${lon});node["shop"="coffee"](around:${radius},${lat},${lon});way["shop"="coffee"](around:${radius},${lat},${lon}););out center tags;`;

  try {
    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain', 'User-Agent': 'CoffeeSpotsApp/1.0', Accept: '*/*' },
      body: query,
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'Nearby lookup is temporarily unavailable' });
    }

    const data = await response.json();

    const shops = (data.elements || [])
      .map((el) => {
        const tags = el.tags || {};
        const elLat = el.lat ?? el.center?.lat;
        const elLon = el.lon ?? el.center?.lon;
        if (!tags.name || elLat == null || elLon == null) return null;
        return {
          id: `osm-${el.type}-${el.id}`,
          slug: `osm-${el.type}-${el.id}`,
          name: tags.name,
          address: formatAddress(tags),
          lat: elLat,
          lon: elLon,
          distanceMeters: Math.round(haversineMeters(lat, lon, elLat, elLon)),
          website: tags.website || tags['contact:website'] || null,
          openingHours: tags.opening_hours || null,
          source: 'osm',
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, 60);

    cache.set(cacheKey, { shops, at: Date.now() });
    res.json({ shops, source: 'osm', cached: false });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Nearby lookup is temporarily unavailable' });
  }
});
