// The hero's world map, drawn from real coastline data (public/world-land.svg),
// with a dot wherever visitors have come from. Both layers use the same
// coordinates and the same "slice" scaling, so dots always sit on the right spot.
//
// Projection (must match how public/world-land.svg was made): Miller,
// longitude -180..180 across 1000 units, latitude 84 (top) to -58 (bottom).
import { useEffect, useState } from 'react';
import { loadStats } from '../lib/stats';

const MAP_W = 1000;
const miller = (lat) => 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * ((lat * Math.PI) / 180)));
const TOP = miller(84);
const BOTTOM = miller(-58);
const MAP_H = (MAP_W / (2 * Math.PI)) * (TOP - BOTTOM);

export function project(lat, lon) {
  const la = Math.max(-58, Math.min(84, lat));
  return [((lon + 180) / 360) * MAP_W, ((TOP - miller(la)) / (TOP - BOTTOM)) * MAP_H];
}

// a little breathing room around the continents, like the original artwork
const VB_W = MAP_W + 80;
const VB_H = MAP_H + 140;
const VIEWBOX = `-40 -70 ${VB_W} ${VB_H.toFixed(1)}`;
// Desktop: fills the hero (cropped to fit). Phones: the whole world across the
// width, a little wider than the screen, behind the heading. Both layers share
// this box, so the dots stay aligned with the land.
const layer =
  'pointer-events-none absolute inset-0 h-full w-full max-sm:inset-auto max-sm:left-[-18%] max-sm:top-[13%] max-sm:h-auto max-sm:w-[136%]';
const box = { aspectRatio: `${VB_W} / ${VB_H.toFixed(1)}` };

/** The land, under the diagonal light/dark split. */
export function MapLand() {
  return (
    <svg className={layer} style={box} viewBox={VIEWBOX} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <image href="/world-land.svg" x="0" y="0" width={MAP_W} height={MAP_H.toFixed(1)} />
    </svg>
  );
}

/** Visitor dots, above the split so they show on both sides. */
export function MapDots() {
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    let alive = true;
    const go = () => loadStats().then((s) => alive && s?.places?.length && setPlaces(s.places.slice(0, 200)));
    const id = 'requestIdleCallback' in window ? requestIdleCallback(go, { timeout: 4000 }) : setTimeout(go, 2000);
    return () => {
      alive = false;
      if ('cancelIdleCallback' in window) cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, []);

  if (!places.length) return null;
  const max = Math.max(...places.map((p) => p.count));
  return (
    <svg className={`${layer} visitor-dots`} style={box} viewBox={VIEWBOX} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {places.map((p, i) => {
        const [x, y] = project(p.lat, p.lon);
        const r = 2.2 + 3.2 * Math.sqrt(p.count / max);
        return (
          <g key={`${p.lat},${p.lon}`}>
            <circle className="visitor-dot-pulse" cx={x} cy={y} r={r} style={{ animationDelay: `${(i % 9) * 0.35}s` }} />
            <circle className="visitor-dot" cx={x} cy={y} r={r} />
          </g>
        );
      })}
    </svg>
  );
}
