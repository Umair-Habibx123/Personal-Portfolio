import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import ShaderBackground from './ShaderBackground';
import shaders from '../data/shaders.json';
import site, { img, srcSet } from '../lib/site';
import { Heading, Reveal, trackPointer } from './ui';

const TechBalls = lazy(() => import('./canvas/Ball'));

/** Large screens with a mouse get real 3D; phones and reduced-motion get the flat version. */
function useCan3D() {
  const query = '(min-width: 768px) and (prefers-reduced-motion: no-preference)';
  // false on the server and on first paint; decided in the browser after hydration
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setOk(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return ok;
}

/** True once the element is close to the viewport. */
function useNear(ref) {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: '400px' });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [ref]);
  return near;
}

function FlatBall({ icon }) {
  return (
    <div className="grid h-full w-full place-items-center rounded-full bg-gradient-to-br from-[#efefef] to-[#cfcfcf] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)]">
      <img src={icon} alt="" className="h-1/2 w-1/2 object-contain" loading="lazy" decoding="async" width="100" height="100" />
    </div>
  );
}

export default function Tech() {
  const ref = useRef(null);
  const gridRef = useRef(null);
  const slotRefs = useRef([]);
  const [ready3D, setReady3D] = useState(false);
  const onReady = useCallback(() => setReady3D(true), []);
  const can3D = useCan3D();
  const near = useNear(ref);
  const { skills } = site;
  const technologies = skills.balls;

  return (
    <section id="skills" ref={ref} className="relative overflow-hidden bg-night py-24 sm:py-32">
      {/* Original: city-skyline backdrop under a dark wash */}
      <img src={img('backgrounds/nairobi@960.webp')} alt="" aria-hidden="true" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-night/90 via-night/70 to-night" />
      {/* No glow or shader here: just the original skyline */}

      <div className="container-x relative">
        <Heading eyebrow={skills.eyebrow} title={skills.title} dark />
        {can3D && <p className="mt-3 font-mono text-xs text-taupe">{skills.hint}</p>}

        <div ref={gridRef} className="relative mt-14">
          <ul className="flex flex-wrap justify-center gap-x-8 gap-y-10">
            {technologies.map((t, i) => (
              <li key={t.name} className="flex w-24 flex-col items-center gap-3 sm:w-28">
                <div ref={(el) => (slotRefs.current[i] = el)} className="h-24 w-24 sm:h-28 sm:w-28" title={t.name}>
                  <div className={`h-full w-full transition-opacity duration-500 ${ready3D ? 'opacity-0' : 'opacity-100'}`}>
                    <FlatBall icon={img(t.icon)} />
                  </div>
                </div>
                <span className="text-center font-mono text-[11px] uppercase tracking-wider text-timberWolf">{t.name}</span>
              </li>
            ))}
          </ul>
          {can3D && near && (
            <Suspense fallback={null}>
              <TechBalls
                items={technologies.map((t) => ({ name: t.name, icon: img(t.icon) }))}
                slots={slotRefs.current}
                container={gridRef.current}
                onReady={onReady}
              />
            </Suspense>
          )}
        </div>

        {/* New: the full toolbox, grouped */}
        <div className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skills.groups.map((g, i) => (
            <Reveal key={g.group} delay={(i % 3) * 0.08}>
              <div
                onMouseMove={trackPointer}
                className="spotlight pulse-border glass-dark h-full rounded-3xl p-6 transition hover:border-white/25"
                style={{ '--pulse-delay': `${-i * 0.7}s` }}
              >
                {/* a faint neural-network shader, only behind the AI card */}
                {g.group.startsWith('AI') && shaders.aiCard?.shader && (
                  <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" aria-hidden="true">
                    <ShaderBackground config={shaders.aiCard} />
                  </span>
                )}
                <h3 className="relative z-10 flex items-center gap-3 font-beckman text-lg font-bold uppercase tracking-[2px] text-timberWolf">
                  <span className="h-[2px] w-6 bg-accent" aria-hidden="true" />
                  {/* Beckman draws "&" like an 8, so the ampersand uses the body font */}
                  <span>
                    {g.group.split('&').map((part, i) => (
                      <span key={i}>
                        {i > 0 && <span className="font-sans font-bold">&amp;</span>}
                        {part}
                      </span>
                    ))}
                  </span>
                </h3>
                <ul className="relative z-10 mt-5 flex flex-wrap gap-2">
                  {g.items.map((s) => (
                    <li key={s} className="chip border-white/10 bg-white/5 text-[12px] text-silver transition hover:border-pink-400/60 hover:text-white">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
