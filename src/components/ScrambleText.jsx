// Letters "decode" from random characters into the real text, left to right,
// once when the page loads (the same effect as the GalvanAI page loader).
//
// - The pre-rendered HTML and screen readers get the real text (aria-label).
// - Every letter keeps the width of its final character while it scrambles,
//   so the heading never jumps around.
// - Random characters are A-Z and 0-9 only: the Mova font is subset to those.
// - Skipped for people who prefer reduced motion.
import { useEffect, useState } from 'react';

// no extra-wide letters (M, W), so a scrambled letter barely spills past its slot
const CHARS = 'ABCDEFGHJKLNOPQRSTUVXYZ23456789';
const SCRAMBLES = /[A-Za-z0-9]/; // punctuation and spaces stay as they are
const random = () => CHARS[Math.floor(Math.random() * CHARS.length)];

export default function ScrambleText({ text, delay = 0, step = 1 / 3, interval = 30, className = '' }) {
  const [shown, setShown] = useState(null); // null = show the real text

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let iteration = 0;
    let timer;
    const tick = () => {
      setShown(text.split('').map((ch, i) => (!SCRAMBLES.test(ch) || i < iteration ? ch : random())));
      iteration += step;
      if (iteration >= text.length + step) {
        clearInterval(timer);
        setShown(null);
      }
    };
    const start = setTimeout(() => {
      tick();
      timer = setInterval(tick, interval);
    }, delay);
    return () => {
      clearTimeout(start);
      clearInterval(timer);
    };
  }, [text, delay, step, interval]);

  return (
    <span aria-label={text} role="text" className={className}>
      {text.split('').map((ch, i) =>
        ch === ' ' ? (
          <span key={i} aria-hidden="true">
            {' '}
          </span>
        ) : (
          // Both letters share one grid cell: the real one (hidden while scrambling)
          // sets the width, the scrambled one is drawn in the same spot. Grid keeps
          // them in normal flow, so gradient text (background-clip) still paints them.
          <span key={i} aria-hidden="true" className="inline-grid justify-items-center">
            <span className={`[grid-area:1/1] ${shown && shown[i] !== ch ? 'invisible' : ''}`}>{ch}</span>
            {shown && shown[i] !== ch && <span className="[grid-area:1/1] w-0 flex justify-center">{shown[i]}</span>}
          </span>
        ),
      )}
    </span>
  );
}
