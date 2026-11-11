import site, { img } from '../lib/site';
import Visitors from './Visitors';
import { openCookieSettings } from '../lib/consent';

/** The original footer: abstract background, name and quote. */
export default function Footer() {

  const { footer, profile, nav } = site;
  return (
    <footer className="bg-cover bg-center px-6 py-12" style={{ backgroundImage: `url(${img('backgrounds/white-abstract.webp')})` }}>
      <div className="mx-auto flex max-w-4xl flex-col items-center rounded-2xl bg-gradient-to-b from-white/70 via-white/50 to-white/20 p-8 text-center shadow-lg backdrop-blur-sm">
        <p className="font-mova text-[34px] uppercase tracking-[3px] text-eerieBlack md:text-[42px]">{profile.shortName}</p>
        <blockquote className="mt-3 max-w-xl font-serif text-[16px] italic leading-relaxed text-neutral-700 md:text-[19px]">
          <span className="text-gradient font-display text-3xl not-italic">“</span>
          {footer.quote}
          <span className="text-gradient font-display text-3xl not-italic">”</span>
          <cite className="mt-1 block text-sm not-italic text-neutral-500">— {footer.quoteBy}</cite>
        </blockquote>
        <nav aria-label="Footer" className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 font-mova text-sm uppercase tracking-[2px] text-jetGray">
          {nav.map(({ id, label }) => (
            <a key={id} href={`#${id}`} className="hover:text-eerieBlack">
              {label}
            </a>
          ))}
        </nav>
        <p className="mt-6 text-[13px] text-neutral-600">
          © {new Date().getFullYear()} {profile.name}. {footer.note}
        </p>
        <button type="button" onClick={openCookieSettings} className="mt-2 text-[12px] text-neutral-500 underline-offset-2 hover:text-eerieBlack hover:underline">
          Cookie settings
        </button>
        <Visitors />
      </div>

    </footer>
  );
}
