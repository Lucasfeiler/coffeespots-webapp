const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const TOKEN_KEY = 'coffeespots:token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  register: (email, password, name) => request('/api/auth/register', { method: 'POST', body: { email, password, name } }),
  login: (email, password) => request('/api/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request('/api/auth/me', { auth: true }),

  listShops: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return request(`/api/shops${qs ? `?${qs}` : ''}`);
  },
  shopsMeta: () => request('/api/shops/meta'),
  getShop: (slug) => request(`/api/shops/${slug}`),

  listFavorites: () => request('/api/favorites', { auth: true }),
  toggleFavorite: (shopId) => request(`/api/favorites/${shopId}`, { method: 'POST', auth: true }),

  listReviews: (slug) => request(`/api/shops/${slug}/reviews`),
  addReview: (slug, rating, text) => request(`/api/shops/${slug}/reviews`, { method: 'POST', auth: true, body: { rating, text } }),

  submitShop: (payload) => request('/api/submissions', { method: 'POST', body: payload }),

  nearbyShops: (lat, lon, radius) =>
    request(`/api/nearby?lat=${lat}&lon=${lon}${radius ? `&radius=${radius}` : ''}`),
};
