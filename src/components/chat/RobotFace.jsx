// The AI assistant's robot face (artwork from page-mascot, MIT, see
// public/mascots/LICENSE.txt).
//
// Where it looks:
// - mouse/trackpad: toward the cursor, mapped across the WHOLE screen, so even
//   small movements turn the head (an angle-only mapping barely moves when the
//   robot sits in a corner, since everything is "up-left" of it)
// - touch screens: toward each tap, a glance up/down while scrolling, and a
//   look around now and then when idle
// With `interactive`, it's a button: tapping it plays a reaction
// (blink, then heart / sparkle / delighted; poke it 4 times quickly: dizzy).
import { useEffect, useRef, useState } from 'react';

const DIRECTIONS = '/mascots/robot-directions.webp';
const REACTIONS = '/mascots/robot-reactions.webp';
// 3x3 sheets, left-to-right, top-to-bottom
// Direction names in the order of the cells on the robot's sheet. Checked
// against the artwork: the robot's TOP row is drawn mirrored (the first cell
// looks up-RIGHT, the third up-LEFT), unlike page-mascot's default order.
const DIR_CELLS = ['up-right', 'up', 'up-left', 'left', 'center', 'right', 'down-left', 'down', 'down-right'];
const REACT_CELLS = ['blink', 'heart', 'sparkle', 'surprised', 'wink', 'bashful', 'sleepy', 'dizzy', 'delighted'];
// Where the drawing's centre is inside each direction frame (measured from the
// sheet), so the robot stays centred whichever way it looks.
const CENTRE = {
  'up-right': [0.54, 0.56],
  up: [0.52, 0.53],
  'up-left': [0.46, 0.55],
  left: [0.57, 0.48],
  center: [0.51, 0.47],
  right: [0.43, 0.48],
  'down-left': [0.57, 0.41],
  down: [0.52, 0.41],
  'down-right': [0.43, 0.41],
};
const cellPos = (cells, name) => {
  const i = Math.max(0, cells.indexOf(name));
  return `${(i % 3) * 50}% ${Math.floor(i / 3) * 50}%`;
};

// How far (as a share of the screen) the cursor must be from the robot before
// the head turns. Lower = more sensitive.
const TURN_AT = 0.1;
const pick = (dx, dy) => {
  const hx = dx / window.innerWidth;
  const vy = dy / window.innerHeight;
  const col = hx < -TURN_AT ? 'left' : hx > TURN_AT ? 'right' : '';
  const row = vy < -TURN_AT ? 'up' : vy > TURN_AT ? 'down' : '';
  return row && col ? `${row}-${col}` : row || col || 'center';
};

const SQUASH = [
  { transform: 'scale(1, 1)', easing: 'ease-in' },
  { transform: 'scale(1.10, 0.86)', offset: 0.18, easing: 'ease-out' },
  { transform: 'scale(0.95, 1.08)', offset: 0.45, easing: 'ease-in-out' },
  { transform: 'scale(1.03, 0.97)', offset: 0.72, easing: 'ease-in-out' },
  { transform: 'scale(1, 1)' },
];
const PAYOFFS = ['heart', 'sparkle', 'delighted'];

export default function RobotFace({ size = 44, interactive = false, label = 'AI assistant robot' }) {
  const ref = useRef(null);
  const squashRef = useRef(null);
  const timers = useRef([]);
  const boops = useRef({ count: 0, at: 0 });
  const [dir, setDir] = useState('center');
  const [reaction, setReaction] = useState(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const aimAt = (x, y) => {
      const box = ref.current?.getBoundingClientRect();
      if (!box) return;
      setDir(pick(x - (box.left + box.width / 2), y - (box.top + box.height / 2)));
    };
    let frame = 0;
    const cleanups = [];

    if (fine) {
      const onMove = (e) => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => aimAt(e.clientX, e.clientY));
      };
      window.addEventListener('pointermove', onMove, { passive: true });
      cleanups.push(() => window.removeEventListener('pointermove', onMove));
    } else if (!reduced) {
      // touch screens: look at taps, glance while scrolling, look around when idle
      let back;
      const lookThen = (d, ms = 1400) => {
        setDir(d);
        clearTimeout(back);
        back = setTimeout(() => setDir('center'), ms);
      };
      const onTap = (e) => {
        aimAt(e.clientX, e.clientY);
        clearTimeout(back);
        back = setTimeout(() => setDir('center'), 1600);
      };
      let lastY = window.scrollY;
      const onScroll = () => {
        const y = window.scrollY;
        if (Math.abs(y - lastY) > 30) {
          lookThen(y > lastY ? 'down' : 'up', 700);
          lastY = y;
        }
      };
      const LOOKS = ['left', 'up-left', 'up', 'up-right', 'right', 'center'];
      const idle = setInterval(() => {
        if (document.visibilityState === 'visible') lookThen(LOOKS[Math.floor(Math.random() * LOOKS.length)], 1100);
      }, 3500);
      window.addEventListener('pointerdown', onTap, { passive: true });
      window.addEventListener('scroll', onScroll, { passive: true });
      cleanups.push(() => {
        clearInterval(idle);
        clearTimeout(back);
        window.removeEventListener('pointerdown', onTap);
        window.removeEventListener('scroll', onScroll);
      });
    }
    return () => {
      cancelAnimationFrame(frame);
      cleanups.forEach((c) => c());
      timers.current.forEach(clearTimeout);
    };
  }, []);

  const boop = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const later = (ms, next) => timers.current.push(setTimeout(() => setReaction(next), ms));
    const now = Date.now();
    const b = boops.current;
    b.count = now - b.at < 1600 ? b.count + 1 : 1;
    b.at = now;
    if (b.count >= 4) {
      b.count = 0;
      setReaction('dizzy');
      later(1100, null);
    } else {
      setReaction('blink');
      later(120, PAYOFFS[(b.count - 1) % PAYOFFS.length]);
      later(560, null);
    }
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      squashRef.current?.animate(SQUASH, { duration: 420, easing: 'linear' });
    }
  };

  const [cx, cy] = CENTRE[dir];
  const layer = {
    position: 'absolute',
    inset: 0,
    backgroundSize: '300% 300%',
    backgroundRepeat: 'no-repeat',
    transition: 'opacity 80ms',
  };
  const face = (
    <span ref={squashRef} className="relative block h-full w-full" style={{ transformOrigin: '50% 78%' }}>
      <span
        style={{
          ...layer,
          backgroundImage: `url(${DIRECTIONS})`,
          backgroundPosition: cellPos(DIR_CELLS, dir),
          transform: `translate(${((0.5 - cx) * size).toFixed(1)}px, ${((0.5 - cy) * size).toFixed(1)}px)`,
          opacity: reaction ? 0 : 1,
        }}
      />
      {interactive && (
        <span
          style={{ ...layer, backgroundImage: `url(${REACTIONS})`, backgroundPosition: cellPos(REACT_CELLS, reaction ?? 'blink'), opacity: reaction ? 1 : 0 }}
        />
      )}
    </span>
  );

  return interactive ? (
    <button
      ref={ref}
      type="button"
      onClick={boop}
      aria-label={`Boop the ${label}`}
      className="relative block shrink-0 cursor-pointer select-none border-0 bg-transparent p-0"
      style={{ width: size, height: size }}
    >
      {face}
    </button>
  ) : (
    <span ref={ref} aria-hidden="true" className="pointer-events-none relative block" style={{ width: size, height: size }}>
      {face}
    </span>
  );
}
