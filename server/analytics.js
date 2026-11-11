// Visit analytics for the live site, stored in Redis (see server/redis.js).
//
// - One "visit" per visitor per 30 minutes; refreshes inside that window
//   don't count again.
// - Country/region/city come from Vercel's own request headers, so no
//   third-party geo-IP service is called and no IP address is stored.
// - Nothing is recorded for localhost, preview deployments, bots or automated
//   browsers, or when the owner opts out (visit the site with ?notrack).
//
// Keys (prefix pf:)
//   pf:visits                 total visits            pf:uniq      unique visitors (HyperLogLog)
//   pf:since                  date of the first visit
//   pf:places                 'lat,lon,CC' (rounded to ~10 km) -> visits, for the hero map
//   pf:countries / pf:devices / pf:browsers / pf:os / pf:sources / pf:referrers   sorted sets (visit counts)
//   pf:day:YYYY-MM-DD         hash { visits }         pf:dayu:YYYY-MM-DD  unique visitors that day
//   pf:visitor:<id>           hash { first, last, visits, country, city, chats }
//   pf:log                    the latest 2,000 visits (JSON), newest first
//   pf:sess:<id>              30-minute session marker
import { redis, redisConfigured, VISITOR_RE } from './redis.js';

const SESSION_SECONDS = 30 * 60;
const LOG_SIZE = 2000;
const BOT_RE = /bot|crawler|spider|crawling|headless|lighthouse|pagespeed|preview|facebookexternalhit|embedly|slurp|bingpreview|whatsapp|telegram|discord|curl|wget|python|node-fetch|axios/i;
const LOCAL_HOST_RE = /^(localhost|127\.|0\.0\.0\.0|\[::1\]|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)|\.local(:|$)/i;

// ── small parsers ───────────────────────────────────────────────
export function parseUA(ua = '') {
  const device = /iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua) ? 'tablet' : /Mobi|iPhone|iPod|Android/i.test(ua) ? 'mobile' : 'desktop';
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\/|Opera/.test(ua)
      ? 'Opera'
      : /SamsungBrowser/.test(ua)
        ? 'Samsung Internet'
        : /Firefox|FxiOS/.test(ua)
          ? 'Firefox'
          : /Chrome|CriOS/.test(ua)
            ? 'Chrome'
            : /Safari/.test(ua)
              ? 'Safari'
              : 'Other';
  const os = /Windows/.test(ua)
    ? 'Windows'
    : /iPhone|iPad|iPod/.test(ua)
      ? 'iOS'
      : /Android/.test(ua)
        ? 'Android'
        : /Mac OS X|Macintosh/.test(ua)
          ? 'macOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : 'Other';
  return { device, browser, os };
}

const SEARCH = ['google.', 'bing.', 'duckduckgo.', 'yahoo.', 'yandex.', 'baidu.', 'ecosia.', 'brave.com', 'qwant.com'];
const SOCIAL = ['linkedin.', 'lnkd.in', 'facebook.', 'fb.com', 'instagram.', 'twitter.', 'x.com', 't.co', 'reddit.', 'youtube.', 'whatsapp.', 't.me', 'telegram.', 'discord.', 'medium.com', 'news.ycombinator.com', 'github.com', 'upwork.com', 'threads.net', 'bsky.app'];
const matches = (host, list) => list.some((e) => (e.endsWith('.') ? host.startsWith(e) || host.includes(`.${e}`) : host === e || host.endsWith(`.${e}`)));

/** Reduces a referrer to { host, type }: direct, internal, search, social or referral. */
export function classifyReferrer(referrer = '', selfHost = '') {
  if (!referrer) return { host: null, type: 'direct' };
  let host;
  try {
    host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return { host: null, type: 'direct' };
  }
  if (!host || host === selfHost.toLowerCase().replace(/^www\./, '').replace(/:\d+$/, '')) return { host: null, type: 'internal' };
  if (matches(host, SEARCH)) return { host, type: 'search' };
  if (matches(host, SOCIAL)) return { host, type: 'social' };
  return { host, type: 'referral' };
}

const header = (h, k) => {
  const v = h[k];
  if (!v) return null;
  try {
    return decodeURIComponent(Array.isArray(v) ? v[0] : v);
  } catch {
    return String(v);
  }
};

const hits = new Map();
function rateLimited(ip) {
  if (!ip) return false;
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 30;
}

/** Should this request be recorded at all? */
export function shouldRecord({ host = '', ua = '', env = process.env }) {
  if (!redisConfigured(env)) return false;
  if (LOCAL_HOST_RE.test(host)) return false;
  // On Vercel, only the production deployment counts (not preview URLs)
  if (env.VERCEL_ENV && env.VERCEL_ENV !== 'production') return false;
  if (!ua || BOT_RE.test(ua)) return false;
  return true;
}

/**
 * POST /api/analytics  { visitorId, path, referrer, search }
 * Always answers 204 quickly; errors are only logged.
 */
export async function handleTrack(body, { headers = {}, ip, env = process.env } = {}) {
  const ua = String(headers['user-agent'] || '');
  const host = String(headers['x-forwarded-host'] || headers.host || '');
  if (!shouldRecord({ host, ua, env })) return { recorded: false, reason: 'skipped' };
  if (rateLimited(ip)) return { recorded: false, reason: 'rate' };
  const visitorId = String(body?.visitorId || '');
  if (!VISITOR_RE.test(visitorId)) return { recorded: false, reason: 'visitor' };

  // first: is this a new visit (no ping from this visitor in the last 30 min)?
  const [fresh] = await redis(env, [['SET', `pf:sess:${visitorId}`, '1', 'EX', SESSION_SECONDS, 'NX']]);
  if (fresh !== 'OK') {
    await redis(env, [['HSET', `pf:visitor:${visitorId}`, 'last', new Date().toISOString()]]);
    return { recorded: false, reason: 'same-visit' };
  }

  const at = new Date().toISOString();
  const day = at.slice(0, 10);
  const country = (header(headers, 'x-vercel-ip-country') || 'XX').toUpperCase().slice(0, 2);
  const region = header(headers, 'x-vercel-ip-country-region');
  const city = header(headers, 'x-vercel-ip-city');
  // approximate location, rounded to 0.1 degree (~10 km) for the visitor map
  const lat = Number(header(headers, 'x-vercel-ip-latitude'));
  const lon = Number(header(headers, 'x-vercel-ip-longitude'));
  const place = Number.isFinite(lat) && Number.isFinite(lon) && (lat || lon) ? `${lat.toFixed(1)},${lon.toFixed(1)},${country}` : null;
  const { device, browser, os } = parseUA(ua);
  const ref = classifyReferrer(String(body?.referrer || '').slice(0, 500), host);
  const params = new URLSearchParams(String(body?.search || '').slice(0, 500));
  const utm = params.get('utm_source') || params.get('ref') || null;
  const source = utm ? `campaign:${utm.toLowerCase().slice(0, 40)}` : ref.type;
  const lang = String(headers['accept-language'] || '').split(',')[0].slice(0, 12) || null;
  const path = String(body?.path || '/').slice(0, 200);

  const entry = { at, visitorId, country, region, city, place, device, browser, os, source, referrer: ref.host, path, lang };
  const dayTtl = 400 * 24 * 3600;
  await redis(env, [
    ['INCR', 'pf:visits'],
    ['SET', 'pf:since', day, 'NX'],
    ['PFADD', 'pf:uniq', visitorId],
    ['ZINCRBY', 'pf:countries', 1, country],
    ['ZINCRBY', 'pf:devices', 1, device],
    ['ZINCRBY', 'pf:browsers', 1, browser],
    ['ZINCRBY', 'pf:os', 1, os],
    ['ZINCRBY', 'pf:sources', 1, source],
    ...(ref.host ? [['ZINCRBY', 'pf:referrers', 1, ref.host]] : []),
    ...(place ? [['ZINCRBY', 'pf:places', 1, place]] : []),
    ['HINCRBY', `pf:day:${day}`, 'visits', 1],
    ['EXPIRE', `pf:day:${day}`, dayTtl],
    ['PFADD', `pf:dayu:${day}`, visitorId],
    ['EXPIRE', `pf:dayu:${day}`, dayTtl],
    ['HSETNX', `pf:visitor:${visitorId}`, 'first', at],
    ['HSET', `pf:visitor:${visitorId}`, 'last', at, 'country', country, 'city', city || ''],
    ['HINCRBY', `pf:visitor:${visitorId}`, 'visits', 1],
    ['EXPIRE', `pf:visitor:${visitorId}`, dayTtl],
    ['LPUSH', 'pf:log', JSON.stringify(entry)],
    ['LTRIM', 'pf:log', 0, LOG_SIZE - 1],
  ]);
  return { recorded: true };
}

const pairs = (flat = []) => {
  const out = [];
  for (let i = 0; i < flat.length; i += 2) out.push({ key: flat[i], count: Number(flat[i + 1]) });
  return out;
};

/** GET /api/analytics: public totals for the site (no cities, no visitor data). */
export async function handleStats({ env = process.env } = {}) {
  const r = await redis(env, [
    ['GET', 'pf:visits'],
    ['PFCOUNT', 'pf:uniq'],
    ['GET', 'pf:since'],
    ['ZREVRANGE', 'pf:countries', 0, 11, 'WITHSCORES'],
    ['ZCARD', 'pf:countries'],
    ['ZREVRANGE', 'pf:devices', 0, -1, 'WITHSCORES'],
    ['ZREVRANGE', 'pf:places', 0, 299, 'WITHSCORES'],
  ]);
  if (!r) return null;
  const countries = pairs(r[3]).filter((c) => c.key !== 'XX');
  return {
    visits: Number(r[0] || 0),
    visitors: Number(r[1] || 0),
    since: r[2] || null,
    countryCount: Number(r[4] || 0) - (pairs(r[3]).some((c) => c.key === 'XX') ? 1 : 0),
    countries,
    devices: pairs(r[5]),
    places: pairs(r[6]).map(({ key, count }) => {
      const [lat, lon, country] = key.split(',');
      return { lat: Number(lat), lon: Number(lon), country, count };
    }),
  };
}
