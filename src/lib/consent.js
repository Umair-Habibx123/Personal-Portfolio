// The visitor's cookie choice, kept in this browser (localStorage).
//
// Only "analytics" is theirs to decide: it controls whether visits (country,
// approximate location, device, traffic source) are recorded. Without a yes,
// nothing is sent to /api/analytics. "Necessary" (the chat history in this
// browser and this choice itself) is always on.
//
// Bump VERSION to ask everyone again (e.g. if a new category is added).

const KEY = 'pf-consent';
const VERSION = 1;
export const CONSENT_EVENT = 'pf-consent-change';
export const OPEN_CONSENT_EVENT = 'pf-open-consent';

export function readConsent() {
  if (typeof window === 'undefined') return null;
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || 'null');
    return c && c.version === VERSION && typeof c.analytics === 'boolean' ? c : null;
  } catch {
    return null;
  }
}

export function writeConsent({ analytics }) {
  const state = { analytics: analytics === true, version: VERSION, decidedAt: new Date().toISOString() };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode: they'll be asked again next time */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: state }));
  return state;
}

export const hasConsent = (category) => category === 'necessary' || readConsent()?.[category] === true;

/** Calls `handler(state)` whenever the choice changes (in this tab or another). */
export function onConsentChange(handler) {
  const listener = () => handler(readConsent());
  window.addEventListener(CONSENT_EVENT, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(CONSENT_EVENT, listener);
    window.removeEventListener('storage', listener);
  };
}

/** Reopens the cookie card (footer link). */
export const openCookieSettings = () => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT));
