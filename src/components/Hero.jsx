import { useEffect, useState } from 'react';
import { MapDots, MapLand } from './VisitorMap';
import ScrambleText from './ScrambleText';
import { AnimatePresence, motion } from 'framer-motion';
import { Github, Linkedin, Mail } from 'lucide-react';
import site, { img, srcSet } from '../lib/site';

const ease = [0.22, 1, 0.36, 1];

function RotatingWord({ words }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % words.length), 2600);
    return () => clearInterval(t);
  }, [words.length]);
  const longest = words.reduce((a, b) => (b.length > a.length ? b : a));
  return (
    <span className="relative inline-grid overflow-hidden leading-[1.3]">
      <span className="invisible col-start-1 row-start-1 whitespace-nowrap">{longest}</span>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={words[i]}
          className="text-gradient col-start-1 row-start-1 whitespace-nowrap"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          {words[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

const socials = [
  { href: site.links.github, label: 'GitHub', Icon: Github },
  { href: site.links.linkedin, label: 'LinkedIn', Icon: Linkedin },
  { href: `mailto:${site.links.email}`, label: 'Email', Icon: Mail },
];

// The hero's entrance runs in CSS (see .hero-in in index.css), so it plays from
// the pre-rendered HTML before any JavaScript has loaded.
const delay = (s) => ({ animationDelay: `${s}s` });

export default function Hero() {
  const { profile, stats } = site;

  return (
    <section id="top" className="relative flex min-h-[max(36rem,calc(100svh-var(--marquee-h)))] flex-col overflow-hidden">
      {/* World map drawn from real coastline data, with a dot wherever visitors come from */}
      <MapLand />
      <div className="hero-split absolute inset-0" />
      <MapDots />
      {/* New: colour glow on the dark side */}
      <div aria-hidden="true" className="pointer-events-none absolute bottom-[-20%] right-[-10%] h-[70vmin] w-[70vmin] animate-aurora rounded-full bg-pink-500/30 blur-[120px]" />
      <div aria-hidden="true" className="pointer-events-none absolute right-[15%] top-[20%] h-[45vmin] w-[45vmin] animate-aurora rounded-full bg-violet-600/30 blur-[120px]" style={{ animationDelay: '-10s' }} />

      <div className="container-x relative z-10 flex flex-1 items-start gap-4 pb-6 pt-24 sm:items-center sm:pb-10 sm:pt-24 lg:[@media(max-height:760px)]:pb-5 lg:[@media(max-height:760px)]:pt-20">
        {/* Original mobile decoration: dot and fading line */}
        <div className="mt-4 flex flex-col items-center sm:hidden" aria-hidden="true">
          <div className="h-5 w-5 rounded-full bg-accent" />
          <div className="bw-gradient h-40 w-1" />
        </div>

        <div className="max-w-2xl">
          <h1 className="font-poppins font-black uppercase leading-[0.95] text-eerieBlack">
            <span style={delay(0.1)} className="hero-in block text-[40px] xs:text-[50px] sm:text-[60px] lg:text-[80px] lg:[@media(max-height:860px)]:text-[64px] lg:[@media(max-height:760px)]:text-[52px]">
              <ScrambleText text={profile.greeting} delay={150} />
            </span>
            <span className="block overflow-hidden">
              <span
                style={delay(0.2)}
                className="hero-rise text-gradient block font-mova text-[64px] font-extrabold leading-[1.05] xs:text-[80px] sm:text-[110px] lg:text-[140px] lg:[@media(max-height:860px)]:text-[112px] lg:[@media(max-height:760px)]:text-[92px]"
              >
                <ScrambleText text={profile.shortName} delay={350} step={1 / 4} />
              </span>
            </span>
          </h1>

          <p style={delay(0.35)} className="no-select hero-in mt-4 flex flex-wrap items-center gap-x-[0.3em] font-poppins text-[20px] font-semibold leading-[1.3] text-eerieBlack sm:text-[28px] lg:text-[32px] lg:[@media(max-height:760px)]:text-[26px]">
            <span>I build</span>
            <RotatingWord words={profile.rotatingWords} />
          </p>

          <p style={delay(0.45)} className="hero-in mt-4 hidden max-w-xl text-[16px] sm:block leading-relaxed text-jetLight sm:text-[18px] lg:max-w-[min(36rem,47vw)] lg:[@media(max-height:760px)]:mt-3 lg:[@media(max-height:760px)]:text-[16px] lg:[@media(max-height:760px)]:leading-normal">
            {profile.intro}
          </p>

          <div style={delay(0.55)} className="hero-in mt-6 flex items-center gap-1.5 sm:mt-7 sm:flex-wrap sm:gap-3 lg:[@media(max-height:760px)]:mt-5">
            <a href="#projects" className="btn-accent max-sm:!gap-0 max-sm:!whitespace-nowrap max-sm:!px-2.5 max-sm:!py-2.5 max-sm:!text-[10.5px] max-sm:!tracking-[0.3px]">
              SEE MY WORK
            </a>
            <a href="#contact" className="btn-dark max-sm:!gap-0 max-sm:!whitespace-nowrap max-sm:!px-2.5 max-sm:!py-2.5 max-sm:!text-[10.5px] max-sm:!tracking-[0.3px]">
              GET IN TOUCH
            </a>
            <div className="flex items-center sm:gap-1">
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith('mailto') ? undefined : '_blank'}
                  rel="noreferrer"
                  aria-label={label}
                  className="grid h-7 w-7 place-items-center rounded-full text-jetLight sm:h-11 sm:w-11 transition hover:bg-eerieBlack hover:text-white"
                >
                  <Icon size={19} className="max-sm:h-[15px] max-sm:w-[15px]" />
                </a>
              ))}
            </div>
          </div>

          <dl style={delay(0.7)} className="hero-in mt-8 lg:[@media(max-height:760px)]:mt-5 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-sm sm:bg-white/70 sm:backdrop-blur-xl lg:[@media(max-height:760px)]:py-2">
                <dt className="sr-only">{s.label}</dt>
                <dd className="font-display text-2xl font-extrabold text-eerieBlack sm:text-3xl">{s.value}</dd>
                <dd className="text-[11px] leading-tight text-jetGray sm:text-xs">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Original: portrait standing at the bottom right */}
      <img
        src={img(profile.photo)}
        srcSet={srcSet(profile.photo)}
        sizes="(min-width: 1024px) 45vw, 75vw"
        alt={`Portrait of ${profile.name}`}
        width="1114"
        height="983"
        fetchpriority="high"
        decoding="async"
        onContextMenu={(e) => e.preventDefault()}
        style={delay(0.25)}
        className="hero-photo pointer-events-none relative z-0 mx-auto -mt-2 block h-auto w-[88%] max-w-[420px] select-none sm:absolute sm:bottom-0 sm:mx-0 sm:mt-0 sm:w-auto sm:max-w-none drop-shadow-[0_20px_60px_rgba(236,72,153,0.35)] sm:right-[-3%] sm:h-[min(40vh,38vw)] lg:right-[-1%] lg:h-[min(80vh,35vw)] xl:h-[min(80vh,40vw)] 2xl:right-[4%]"
      />

      {/* Original scroll indicator */}
      <a href="#about" aria-label="Scroll to About" className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 sm:block lg:hidden">
        <span className="flex h-[64px] w-[35px] items-start justify-center rounded-3xl border-4 border-dim p-2">
          <span className="mb-1 h-3 w-3 animate-scroll-dot rounded-full bg-accent" />
        </span>
      </a>
    </section>
  );
}
