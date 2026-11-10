// The original 3D tech balls (an icosahedron with the logo as a decal), drawn
// in ONE shared canvas laid over the HTML grid instead of one canvas per ball.
// Each ball follows the position of its grid slot, floats, and can be dragged
// to spin. Loaded lazily (see Tech.jsx), so three.js is not in the first download.
import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Decal, useTexture } from '@react-three/drei';

function Ball({ icon, slot, container, index }) {
  const [decal] = useTexture([icon]);
  const group = useRef();
  const mesh = useRef();
  const spin = useRef({ vx: 0, vy: 0, dragging: false, lastX: 0, lastY: 0 });

  useFrame((state, delta) => {
    if (!slot || !container || !group.current) return;
    const c = container.getBoundingClientRect();
    const r = slot.getBoundingClientRect();
    const t = state.clock.elapsedTime;
    // place the ball over its slot (orthographic camera: 1 unit = 1 CSS pixel)
    group.current.position.x = r.left - c.left + r.width / 2 - c.width / 2;
    group.current.position.y = c.height / 2 - (r.top - c.top + r.height / 2) + Math.sin(t * 1.6 + index) * 6;
    const radius = (r.width / 2) * 0.84;
    group.current.scale.setScalar(radius);

    // idle wobble plus drag momentum
    const s = spin.current;
    if (!s.dragging) {
      s.vx *= 0.94;
      s.vy *= 0.94;
    }
    mesh.current.rotation.y += s.vx + Math.sin(t * 0.8 + index) * 0.002;
    mesh.current.rotation.x += s.vy + Math.cos(t * 0.7 + index) * 0.0015;
    if (!s.dragging) {
      mesh.current.rotation.x *= 1 - Math.min(delta * 1.5, 0.05);
    }
  });

  const onDown = (e) => {
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId);
    Object.assign(spin.current, { dragging: true, lastX: e.clientX, lastY: e.clientY });
  };
  const onMove = (e) => {
    const s = spin.current;
    if (!s.dragging) return;
    s.vx = (e.clientX - s.lastX) * 0.01;
    s.vy = (e.clientY - s.lastY) * 0.01;
    s.lastX = e.clientX;
    s.lastY = e.clientY;
  };
  const onUp = (e) => {
    spin.current.dragging = false;
    e.target.releasePointerCapture?.(e.pointerId);
  };

  return (
    <group ref={group}>
      <mesh
        ref={mesh}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerOver={() => (document.body.style.cursor = 'grab')}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial color="#efefef" polygonOffset polygonOffsetFactor={-5} flatShading />
        <Decal position={[0, 0, 1]} rotation={[2 * Math.PI, 0, 6.25]} scale={1} map={decal} />
      </mesh>
    </group>
  );
}

/** Renders once every texture above it has loaded. */
function Ready({ onReady }) {
  useEffect(() => onReady?.(), [onReady]);
  return null;
}

/** Pauses the render loop while the grid is off screen (saves battery and CPU). */
function useOnScreen(el) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { rootMargin: '100px' });
    io.observe(el);
    return () => io.disconnect();
  }, [el]);
  return on;
}

export default function TechBalls({ items, slots, container, onReady }) {
  const onScreen = useOnScreen(container);
  return (
    <Canvas
      frameloop={onScreen ? 'always' : 'never'}
      orthographic
      camera={{ zoom: 1, position: [0, 0, 500], near: 1, far: 2000 }}
      dpr={[1, 1.75]}
      style={{ position: 'absolute', inset: 0 }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[0, 0, 500]} intensity={1.1} />
      <Suspense fallback={null}>
        {items.map((t, i) => (
          <Ball key={t.name} icon={t.icon} slot={slots[i]} container={container} index={i} />
        ))}
        <Ready onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
