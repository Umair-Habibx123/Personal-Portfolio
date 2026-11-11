// Where the chat button sits.
//
// By default it is docked in the bottom-right stack, just above WhatsApp, and
// moves up with it when the back-to-top button appears. It can also be dragged
// (or flung) anywhere on screen; dropped near a dock spot it snaps there.
//
// A position is either { dock: 'stack' } or a point kept as a fraction of the
// screen ({ fx, fy }), so it survives resizes and the next visit.
export const SIZE = 52;
const MARGIN = 20;
const SNAP_DISTANCE = 110;
const KEY = 'ask-pos-v2';
// must match FloatingButtons.jsx: right-4 (sm:right-5), bottom 1.25rem, 52px
// buttons 4rem apart, back-to-top shown after 900px of scrolling
const STACK_GAP = 64;
export const BACK_TO_TOP_AFTER = 900;

// The page's visible size WITHOUT scrollbars. (innerWidth includes a desktop
// scrollbar, which would put the button ~15px right of the WhatsApp button,
// whose `right` is measured from the page edge.)
const vw = () => document.documentElement.clientWidth || window.innerWidth;
const vh = () => document.documentElement.clientHeight || window.innerHeight;

/** Above WhatsApp (and above back-to-top + WhatsApp once that shows). */
function stackPoint() {
  const right = vw() >= 640 ? 20 : 16;
  const lifted = window.scrollY > BACK_TO_TOP_AFTER ? 2 : 1;
  return {
    x: vw() - right - SIZE / 2,
    y: vh() - MARGIN - SIZE / 2 - STACK_GAP * lifted,
    dock: 'stack',
  };
}

/** Dock spots it snaps to when dropped nearby. */
function targets() {
  const W = vw();
  const H = vh();
  const m = MARGIN + SIZE / 2;
  return [
    stackPoint(), // bottom right, above WhatsApp (default)
    { x: m, y: H - m }, // bottom left
    { x: W / 2, y: H - m }, // bottom
    { x: m, y: H / 2 }, // left
    { x: W - m, y: m + 64 }, // top right, under the menu
  ];
}

/** Keep the whole button on screen. */
function clampPt({ x, y }) {
  const m = MARGIN / 2 + SIZE / 2;
  return {
    x: Math.min(vw() - m, Math.max(m, x)),
    y: Math.min(vh() - m, Math.max(m, y)),
  };
}

/** Where a dropped/thrown button should end up (a point, maybe with `dock`). */
export function settle(pt) {
  let best = null;
  let min = SNAP_DISTANCE;
  for (const t of targets()) {
    const d = Math.hypot(t.x - pt.x, t.y - pt.y);
    if (d < min) [min, best] = [d, t];
  }
  return best ?? clampPt(pt);
}

/** Point on screen -> stored position. */
export const toPos = (p) => (p.dock ? { dock: p.dock } : { fx: p.x / vw(), fy: p.y / vh() });

/** Stored position -> point on screen. */
export const toPx = (pos) => (pos?.dock ? stackPoint() : clampPt({ x: pos.fx * vw(), y: pos.fy * vh() }));

export function loadPos() {
  try {
    const f = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (f?.dock === 'stack') return f;
    if (f && Number.isFinite(f.fx) && Number.isFinite(f.fy)) return f;
  } catch {
    /* ignore */
  }
  return { dock: 'stack' };
}

export function savePos(pos) {
  try {
    localStorage.setItem(KEY, JSON.stringify(pos));
  } catch {
    /* private mode */
  }
}
