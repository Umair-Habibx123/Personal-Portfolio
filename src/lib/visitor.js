// Anonymous visitor ID and the visit ping.
//
// The ID is a random string kept in this browser (localStorage, plus a cookie
// as a backup). It links a visitor's visits and their AI chat, so the chat can
// be reloaded later. It contains nothing personal.
//
// Visits are only sent from the live site: never from localhost or a local
// network address, never from automated browsers, and never after the owner
// opts out by opening the site once with ?notrack (?track turns it back on).

const KEY = 'pf-vid';
const OPT_OUT = 'pf-notrack';
const ID_RE = /^[a-z0-9]{12,40}$/;

function readCookie() {
  const m = document.cookie.match(/(?:^|;\s*)pf_vid=([a-z0-9]+)/);
  return m ? m[1] : null;
}

function newId() {
  const bytes = new Uint8Array(15);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => (b % 36).toString(36)).join('') + Date.now().toString(36);
}

export function getVisitorId() {
  if (typeof window === 'undefined') return null;
  let id = null;
  try {
    id = localStorage.getItem(KEY);
  } catch {
    /* blocked storage */
  }
  if (!ID_RE.test(id || '')) id = readCookie();
  if (!ID_RE.test(id || '')) id = newId();
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* ignore */
  }
  document.cookie = `pf_vid=${id}; Max-Age=${400 * 24 * 3600}; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
  return id;
}

const LOCAL_RE = /^(localhost|127\.|0\.0\.0\.0|\[::1\]|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)|\.local$/i;

export function trackingAllowed() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(location.search);
  try {
    if (params.has('notrack')) localStorage.setItem(OPT_OUT, '1');
    if (params.has('track')) localStorage.removeItem(OPT_OUT);
    if (localStorage.getItem(OPT_OUT)) return false;
  } catch {
    /* ignore */
  }
  if (LOCAL_RE.test(location.hostname)) return false;
  if (navigator.webdriver) return false;
  return true;
}

/** Sends one visit ping (the server ignores repeats within 30 minutes). */
export function trackVisit() {
  if (!trackingAllowed()) return;
  const body = JSON.stringify({
    visitorId: getVisitorId(),
    path: location.pathname + location.hash,
    referrer: document.referrer,
    search: location.search,
  });
  try {
    if (navigator.sendBeacon?.('/api/analytics', new Blob([body], { type: 'application/json' }))) return;
  } catch {
    /* fall through */
  }
  fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
}
