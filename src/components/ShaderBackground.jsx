// An animated Paper Shaders background for a dark section. Which shader, its
// colours and settings come from src/data/shaders.json (all options are listed
// in docs/SHADERS.md).
//
// Kept cheap for a free-hosted site:
// - the library downloads only when a dark section first comes near the screen
// - it renders at low resolution (soft shaders look identical) and pauses
//   whenever the section is off screen
// - no shader for reduced-motion visitors or without WebGL: the CSS glow stays.
import { useEffect, useRef, useState } from 'react';

let paperPromise = null;
const loadPaper = () => (paperPromise ??= import('@paper-design/shaders'));

const isHex = (v) => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
const hexToRgba = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
};

const hasWebGL = () => {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
};

/** The full uniform set for one shaders.json entry. */
function buildUniforms(paper, fragment, config) {
  const sizing = fragment.includes('v_patternUV') ? paper.defaultPatternSizing : paper.defaultObjectSizing;
  const u = {
    u_fit: paper.ShaderFitOptions[sizing.fit],
    u_scale: config.scale ?? 1,
    u_rotation: config.rotation ?? 0,
    u_originX: sizing.originX,
    u_originY: sizing.originY,
    u_offsetX: sizing.offsetX,
    u_offsetY: sizing.offsetY,
    u_worldWidth: sizing.worldWidth,
    u_worldHeight: sizing.worldHeight,
  };
  if (config.colors?.length) {
    u.u_colors = config.colors.map(hexToRgba);
    u.u_colorsCount = config.colors.length;
  }
  for (const [key, value] of Object.entries(config.uniforms ?? {})) {
    u[`u_${key}`] = isHex(value) ? hexToRgba(value) : value;
  }
  if (fragment.includes('u_noiseTexture')) u.u_noiseTexture = paper.getShaderNoiseTexture();
  return u;
}

export default function ShaderBackground({ config }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !config?.shader) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !hasWebGL()) return;

    const speed = config.speed ?? 0.35;
    let mount = null;
    let disposed = false;
    let onScreen = false;

    const start = async () => {
      const paper = await loadPaper();
      if (disposed || mount) return;
      const fragment = paper[`${config.shader}FragmentShader`];
      if (!fragment) {
        console.warn(`[shaders.json] unknown shader "${config.shader}". See docs/SHADERS.md.`);
        return;
      }
      try {
        mount = new paper.ShaderMount(
          el,
          fragment,
          buildUniforms(paper, fragment, config),
          { alpha: false, antialias: false, powerPreference: 'low-power' },
          onScreen ? speed : 0,
          (config.seed ?? 0) * 1000,
          0.5, // min pixel ratio
          960 * 540, // max pixels: soft backgrounds need very few
        );
        setVisible(true);
      } catch {
        /* no WebGL after all: the CSS glow stays */
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen && !mount) start();
        mount?.setSpeed(onScreen ? speed : 0);
      },
      { rootMargin: '200px' },
    );
    io.observe(el);

    return () => {
      disposed = true;
      io.disconnect();
      mount?.dispose();
    };
  }, [config]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 transition-opacity duration-[1500ms]"
      style={{
        opacity: visible ? (config?.opacity ?? 1) : 0,
        mixBlendMode: config?.blend ?? 'normal',
      }}
    />
  );
}
