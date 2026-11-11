// Top 5 visitor countries (flag, name, visits) from /api/analytics.
// Loads only when it scrolls into view, and hides itself if there's no data.
import { useEffect, useRef, useState } from 'react';
import { loadStats } from '../lib/stats';

const fmt = (n) => new Intl.NumberFormat('en').format(n);
let names;
const countryName = (code) => {
  try {
    names ??= new Intl.DisplayNames(['en'], { type: 'region' });
    return names.of(code) || code;
  } catch {
    return code;
  }
};

export default function Visitors() {
  const ref = useRef(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        loadStats().then((d) => d?.countries?.length > 0 && setStats(d));
      },
      { rootMargin: '300px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="mt-6 w-full" aria-live="polite">
      {stats?.countries?.length > 0 && (
        <div className="border-t border-neutral-300/60 pt-5">
            <ul aria-label="Top visitor countries" className="flex flex-wrap justify-center gap-2">
              {stats.countries.slice(0, 5).map(({ key, count }) => (
                <li
                  key={key}
                  title={`${countryName(key)}: ${fmt(count)} ${count === 1 ? 'visit' : 'visits'}`}
                  className="flex items-center gap-1.5 rounded-full border border-neutral-300/70 bg-white/70 py-1 pl-1.5 pr-2.5 text-[12px] text-neutral-700"
                >
                  <img
                    src={`https://flagcdn.com/w40/${key.toLowerCase()}.png`}
                    alt=""
                    width="20"
                    height="15"
                    className="h-[15px] w-5 rounded-[2px] object-cover"
                  />
                  {countryName(key)}
                  <span className="text-neutral-400">{fmt(count)}</span>
                </li>
              ))}
            </ul>
        </div>
      )}
    </div>
  );
}
