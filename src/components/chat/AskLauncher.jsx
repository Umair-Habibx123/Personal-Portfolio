// The chat button. A plain button shows first; the draggable version (GSAP)
// and the chat load once the browser is idle, or right away if it's clicked,
// so none of it slows the first page load.
import { lazy, Suspense, useEffect, useState } from 'react';
import { SIZE, loadPos, toPx } from './spots';

const AskWidget = lazy(() => import('./AskWidget'));

export const launcherClass =
  'fixed left-0 top-0 z-[60] grid cursor-grab touch-none place-items-center overflow-hidden rounded-full border-2 border-transparent text-white [background:linear-gradient(#141414,#141414)_padding-box,linear-gradient(135deg,#8b5cf6,#ec4899,#f59e0b)_border-box] shadow-[0_10px_30px_-6px_rgba(219,39,119,0.6)] active:cursor-grabbing';

export default function AskLauncher() {
  const [mounted, setMounted] = useState(false);
  const [load, setLoad] = useState(false);
  const [openOnLoad, setOpenOnLoad] = useState(false);

  useEffect(() => {
    setMounted(true);
    const go = () => setLoad(true);
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(go, { timeout: 4000 });
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(go, 2500);
    return () => clearTimeout(id);
  }, []);

  if (!mounted) return null;
  const p = toPx(loadPos());
  const fallback = (
    <button
      type="button"
      aria-label="Ask my AI assistant about my work"
      onClick={() => {
        setOpenOnLoad(true);
        setLoad(true);
      }}
      className={launcherClass}
      style={{ width: SIZE, height: SIZE, transform: `translate(${p.x - SIZE / 2}px, ${p.y - SIZE / 2}px)` }}
    >
      {/* still robot face until the chat code loads (then it follows the cursor) */}
      <img src="/mascots/robot-face.webp" alt="" width="42" height="42" className="pointer-events-none h-[42px] w-[42px]" />
    </button>
  );
  if (!load) return fallback;
  return (
    <Suspense fallback={fallback}>
      <AskWidget openOnMount={openOnLoad} />
    </Suspense>
  );
}
