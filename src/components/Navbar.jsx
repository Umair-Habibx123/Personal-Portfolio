import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import site, { img } from '../lib/site';
import { ResumeLink } from './ui';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('');
  const lastY = useRef(0);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  // Original behaviour: hide when scrolling down, show when scrolling up
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > lastY.current && y > 200);
      setScrolled(y > 20);
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    site.nav.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-transform duration-500 ${hidden && !open ? '-translate-y-full' : 'translate-y-0'}`}
      >
        <div className="absolute inset-x-0 top-0 z-10 h-[3px] overflow-hidden">
          <motion.div className="h-full origin-left bg-accent" style={{ scaleX: progress }} />
        </div>
        <nav
          aria-label="Main"
          className={`transition-all duration-500 ${scrolled ? 'bg-flashWhite/85 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.25)] backdrop-blur-xl' : 'bg-flashWhite/0'}`}
        >
          <div className="container-x flex h-20 items-center justify-between">
            <Logo />

            <ul className="hidden items-center gap-8 lg:flex xl:gap-10">
              {site.nav.map(({ id, label }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className={`group relative font-mova text-[18px] uppercase tracking-[3px] transition ${
                      active === id ? 'text-eerieBlack' : 'text-jetGray hover:text-eerieBlack'
                    }`}
                  >
                    {label}
                    <span
                      className={`absolute -bottom-1.5 left-1/2 h-[3px] -translate-x-1/2 rounded-full bg-accent transition-all duration-500 ${
                        active === id ? 'w-[70%]' : 'w-0 group-hover:w-[70%]'
                      }`}
                    />
                  </a>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-2">
              <ResumeLink className="btn-accent hidden !px-5 !py-2.5 sm:inline-flex">RESUME</ResumeLink>
              <button
                type="button"
                className="grid h-11 w-11 place-items-center rounded-xl bg-eerieBlack text-white lg:hidden"
                onClick={() => setOpen(true)}
                aria-expanded={open}
                aria-controls="mobile-menu"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Full-screen menu for phones and tablets. It lives OUTSIDE the header:
          the header's slide transform would otherwise trap it to the header's size. */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-flashWhite lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-pink-500/20 blur-[90px]" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-violet-600/20 blur-[90px]" />

            <div className="container-x relative flex h-20 shrink-0 items-center justify-between">
              <Logo onClick={() => setOpen(false)} />
              <button
                type="button"
                className="grid h-11 w-11 place-items-center rounded-xl bg-eerieBlack text-white"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                autoFocus
              >
                <X size={20} />
              </button>
            </div>

            <nav aria-label="Mobile" className="relative flex flex-1 flex-col items-center justify-center gap-10 px-6 py-10">
              <ul className="flex flex-col items-center gap-5">
                {site.nav.map(({ id, label }, i) => (
                  <motion.li key={id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 * i + 0.05 }}>
                    <a
                      href={`#${id}`}
                      onClick={() => setOpen(false)}
                      className={`group flex flex-col items-center font-mova text-[34px] uppercase leading-none tracking-[4px] xs:text-[40px] ${
                        active === id ? 'text-eerieBlack' : 'text-jetGray'
                      }`}
                    >
                      <span className="mb-1 font-mono text-[11px] tracking-normal text-pink-500">0{i + 1}</span>
                      {label}
                      <span className={`mt-2 h-[3px] rounded-full bg-accent transition-all ${active === id ? 'w-12' : 'w-0 group-hover:w-12'}`} />
                    </a>
                  </motion.li>
                ))}
              </ul>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <ResumeLink className="btn-accent !px-8">RESUME</ResumeLink>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Logo({ onClick }) {
  return (
    <a href="#top" onClick={onClick} className="flex items-center" aria-label={`${site.profile.name}, back to top`}>
      <img src={img('brand/logo-black.webp')} alt="" width="46" height="46" className="h-[46px] w-[46px] object-contain" />
      <img src={img('brand/logo-text-black.webp')} alt={site.profile.shortName} width="84" height="84" className="-ml-2 h-[84px] w-[84px] object-contain" />
    </a>
  );
}
