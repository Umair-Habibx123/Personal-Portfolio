// The robot's face for the chat button: looks toward the cursor.
// A picture only (no button of its own), so it can sit inside the chat button.
// Direction logic adapted from page-mascot (MIT, see public/mascots/LICENSE.txt).
import { useEffect, useRef, useState } from 'react';

// 3x3 sheet, left-to-right, top-to-bottom
const CELLS = ['up-left', 'up', 'up-right', 'left', 'center', 'right', 'down-left', 'down', 'down-right'];
const CLOCKWISE = ['right', 'down-right', 'down', 'down-left', 'left', 'up-left', 'up', 'up-right'];
const SECTOR = (Math.PI * 2) / CLOCKWISE.length;
const HYSTERESIS = 0.12;
const DEAD_ZONE = 60;
// Where the drawing's centre actually is inside each frame (measured from the
// sheet: x, y as fractions of the frame). Used to shift each frame so the
// robot stays centred in the round button whichever way it looks.
const CENTRE = {
  'up-left': [0.54, 0.56],
  up: [0.52, 0.53],
  'up-right': [0.46, 0.55],
  left: [0.57, 0.48],
  center: [0.51, 0.47],
  right: [0.43, 0.48],
  'down-left': [0.57, 0.41],
  down: [0.52, 0.41],
  'down-right': [0.43, 0.41],
};
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const cell = (name) => {
  const i = CELLS.indexOf(name);
  return `${(i % 3) * 50}% ${Math.floor(i / 3) * 50}%`;
};

export default function RobotFace({ size = 44, sheet = '/mascots/robot-directions.webp' }) {
  const ref = useRef(null);
  const [dir, setDir] = useState('center');

  useEffect(() => {
    // follow the cursor only with a mouse or trackpad
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined;
    let sector = -1;
    let frame = 0;
    const onMove = (e) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const box = el.getBoundingClientRect();
        const dx = e.clientX - (box.left + box.width / 2);
        const dy = e.clientY - (box.top + box.height / 2);
        if (Math.hypot(dx, dy) < DEAD_ZONE) {
          sector = -1;
          setDir('center');
          return;
        }
        const angle = Math.atan2(dy, dx);
        if (sector !== -1 && Math.abs(wrap(angle - sector * SECTOR)) < SECTOR / 2 + HYSTERESIS) return;
        sector = (Math.round(angle / SECTOR) + CLOCKWISE.length) % CLOCKWISE.length;
        setDir(CLOCKWISE[sector]);
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none block"
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${sheet})`,
        backgroundSize: '300% 300%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: cell(dir),
        transform: `translate(${((0.5 - CENTRE[dir][0]) * size).toFixed(1)}px, ${((0.5 - CENTRE[dir][1]) * size).toFixed(1)}px)`,
      }}
    />
  );
}
