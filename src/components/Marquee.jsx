import site from '../lib/site';

/** An endless, tilted strip of technologies between the hero and About. */
export default function Marquee() {
  const items = [...site.marquee, ...site.marquee];
  return (
    // Exactly 5rem tall (--marquee-h in index.css) so hero + strip = one screen
    <div className="no-select relative z-10 flex h-[var(--marquee-h)] items-center overflow-hidden">
    <div className="-mx-4 w-[calc(100%+2rem)] -rotate-1 border-y-4 border-eerieBlack bg-eerieBlack py-3">
      <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        <ul className="flex w-max animate-marquee gap-10 hover:[animation-play-state:paused]" aria-label="Technologies I use">
          {items.map((t, i) => (
            <li
              key={`${t}-${i}`}
              aria-hidden={i >= site.marquee.length}
              className="flex items-center gap-10 whitespace-nowrap font-beckman text-xl uppercase tracking-[2px] text-timberWolf sm:text-2xl"
            >
              {t}
              <span className="text-gradient text-2xl">✦</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
    </div>
  );
}
