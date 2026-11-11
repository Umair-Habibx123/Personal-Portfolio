// Public visit totals from /api/analytics, fetched once and shared by the hero
// map and the footer. Open the site with ?mapdemo to see sample data.

const DEMO = {
  ok: true,
  visitors: 128,
  visits: 214,
  countryCount: 9,
  countries: [
    { key: 'PK', count: 120 },
    { key: 'US', count: 31 },
    { key: 'AE', count: 18 },
    { key: 'GB', count: 12 },
    { key: 'DE', count: 9 },
    { key: 'SA', count: 8 },
    { key: 'CA', count: 6 },
    { key: 'AU', count: 5 },
    { key: 'IN', count: 5 },
  ],
  places: [
    { lat: 33.7, lon: 73.1, country: 'PK', count: 64 },
    { lat: 31.5, lon: 74.3, country: 'PK', count: 30 },
    { lat: 24.9, lon: 67.0, country: 'PK', count: 26 },
    { lat: 40.7, lon: -74.0, country: 'US', count: 14 },
    { lat: 37.8, lon: -122.4, country: 'US', count: 10 },
    { lat: 30.3, lon: -97.7, country: 'US', count: 7 },
    { lat: 25.2, lon: 55.3, country: 'AE', count: 18 },
    { lat: 51.5, lon: -0.1, country: 'GB', count: 12 },
    { lat: 52.5, lon: 13.4, country: 'DE', count: 9 },
    { lat: 24.7, lon: 46.7, country: 'SA', count: 8 },
    { lat: 43.7, lon: -79.4, country: 'CA', count: 6 },
    { lat: -33.9, lon: 151.2, country: 'AU', count: 5 },
    { lat: 12.97, lon: 77.6, country: 'IN', count: 5 },
  ],
};

let pending;
export function loadStats() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (new URLSearchParams(location.search).has('mapdemo')) return Promise.resolve(DEMO);
  pending ??= fetch('/api/analytics')
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => (d?.ok ? d : null))
    .catch(() => null);
  return pending;
}
