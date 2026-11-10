import site from '../lib/site';
import { Heading, Reveal, trackPointer } from './ui';

/** Original light "Overview." section, with the dark service cards. */
export default function About() {
  const { about } = site;
  return (
    <section id="about" className="relative bg-flashWhite py-24 sm:py-32">
      <div className="container-x">
        <Heading eyebrow={about.eyebrow} title={about.title} />

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <Reveal className="max-w-3xl space-y-5 text-[18px] leading-[30px] text-jetGray">
            {about.paragraphs.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </Reveal>
          <Reveal delay={0.1}>
            <p className="font-display text-3xl font-extrabold leading-tight text-eerieBlack lg:text-right">
              {about.tagline.split(' ').slice(0, -1).join(' ')} <span className="text-gradient">{about.tagline.split(' ').slice(-1)}</span>
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {about.highlights.map((h, i) => (
            <Reveal key={h.title} delay={i * 0.1} x={-20} y={0}>
              <div className="card-border group h-full shadow-card">
                <div
                  onMouseMove={trackPointer}
                  className="spotlight flex h-full min-h-[280px] flex-col items-center justify-evenly overflow-hidden rounded-[20px] bg-neutral-600 px-8 py-6 text-center"
                >
                  <span className="relative z-10 font-mova text-[44px] leading-none text-timberWolf/40 transition duration-500 group-hover:text-white">0{i + 1}</span>
                  <h3 className="relative z-10 text-[18px] font-bold text-white">{h.title}</h3>
                  <p className="relative z-10 text-sm leading-relaxed text-timberWolf">{h.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
