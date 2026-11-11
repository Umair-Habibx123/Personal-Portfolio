// Where the chat button sits. It can be dragged (or flung) anywhere on screen;
// if it lands near one of the dock spots it snaps there. The position is kept
// as a fraction of the screen so it survives resizes and the next visit.
export const SIZE = 52;
const MARGIN = 20;
const SNAP_DISTANCE = 110;
const KEY = 'ask-pos';

/** Dock spots (the bottom-right corner is left free for WhatsApp). */
function targets() {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const m = MARGIN + SIZE / 2;
  return [
    { x: m, y: H - m }, // bottom left
    { x: W / 2, y: H - m }, // bottom
    { x: m, y: H / 2 }, // left
    { x: W - m, y: H / 2 }, // right
    { x: W - m, y: m + 64 }, // top right, under the menu
  ];
}

const DEFAULT = () => targets()[0];

/** Keep the whole button on screen. */
function clampPt({ x, y }) {
  const m = MARGIN / 2 + SIZE / 2;
  return {
    x: Math.min(window.innerWidth - m, Math.max(m, x)),
    y: Math.min(window.innerHeight - m, Math.max(m, y)),
  };
}

/** Where a dropped/thrown button should end up. */
export function settle(pt) {
  let best = null;
  let min = SNAP_DISTANCE;
  for (const t of targets()) {
    const d = Math.hypot(t.x - pt.x, t.y - pt.y);
    if (d < min) [min, best] = [d, t];
  }
  return best ?? clampPt(pt);
}

export const toFrac = (p) => ({ fx: p.x / window.innerWidth, fy: p.y / window.innerHeight });
export const toPx = (f) => clampPt({ x: f.fx * window.innerWidth, y: f.fy * window.innerHeight });

export function loadFrac() {
  try {
    const f = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (f && Number.isFinite(f.fx) && Number.isFinite(f.fy)) return f;
  } catch {
    /* ignore */
  }
  return toFrac(DEFAULT());
}

export function saveFrac(f) {
  try {
    localStorage.setItem(KEY, JSON.stringify(f));
  } catch {
    /* private mode */
  }
}
