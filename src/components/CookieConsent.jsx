// Cookie card (same design as the GalvanAI site's): Necessary is always on,
// Analytics is a toggle that starts ON. Nothing is recorded until the visitor
// chooses. "Accept all" ends with a little confetti burst.
//
// Unlike the GalvanAI version it doesn't block the page: a portfolio visitor
// can keep reading while the card waits in the corner.
import { useCallback, useEffect, useRef, useState } from 'react';
import { BarChart3, Cookie, ShieldCheck, X } from 'lucide-react';
import { OPEN_CONSENT_EVENT, readConsent, writeConsent } from '../lib/consent';

const CONFETTI = ['#7c3aed', '#ec4899', '#f59e0b', '#ffffff', '#a78bfa'];
const SHOW_AFTER_MS = 1800; // let the hero land first

const CATEGORIES = [
  { key: 'necessary', label: 'Necessary', desc: 'Keeps your AI chat in this browser and remembers this choice', Icon: ShieldCheck, locked: true },
  { key: 'analytics', label: 'Analytics', desc: 'Anonymous visit stats: country, device and how you found the site. No IP addresses', Icon: BarChart3 },
];

export default function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [firstTime, setFirstTime] = useState(false);
  const [analytics, setAnalytics] = useState(true); // on by default
  const boxRef = useRef(null);
  const canvasRef = useRef(null);

  // First visit: show the card shortly after the page loads
  useEffect(() => {
    const stored = readConsent();
    if (stored) {
      setAnalytics(stored.analytics);
      return undefined;
    }
    const t = setTimeout(() => {
      setFirstTime(true);
      setOpen(true);
    }, SHOW_AFTER_MS);
    return () => clearTimeout(t);
  }, []);

  // Footer "Cookie settings" link reopens it
  useEffect(() => {
    const onOpen = () => {
      const stored = readConsent();
      setAnalytics(stored ? stored.analytics : true);
      setFirstTime(!stored);
      setOpen(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, onOpen);
  }, []);

  // Escape closes it once a choice exists
  useEffect(() => {
    if (!open || firstTime) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, firstTime]);

  // Pop in, with one soft nudge on the first visit so it gets noticed
  useEffect(() => {
    const box = boxRef.current;
    if (!open || !box || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const a = box.animate(
      [
        { opacity: 0, transform: 'translateY(10px) scale(0.94)' },
        { opacity: 1, transform: 'translateY(0) scale(1)' },
      ],
      { duration: 350, easing: 'cubic-bezier(.2,.8,.2,1)' },
    );
    let nudge;
    if (firstTime) {
      nudge = box.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.02)' }, { transform: 'scale(1)' }], {
        duration: 1000,
        delay: 400,
        easing: 'ease-in-out',
      });
    }
    return () => {
      a.cancel();
      nudge?.cancel();
    };
  }, [open, firstTime]);

  const celebrate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const w = (canvas.width = window.innerWidth);
    const h = (canvas.height = window.innerHeight);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const parts = Array.from({ length: 70 }, () => ({
      x: Math.random() * w,
      y: Math.random() * -80,
      vy: 2 + Math.random() * 6,
      vx: -3 + Math.random() * 6,
      r: 6 + Math.random() * 8,
      rot: Math.random() * 360,
      vr: -6 + Math.random() * 12,
      c: CONFETTI[Math.floor(Math.random() * CONFETTI.length)],
    }));
    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r);
        ctx.restore();
      }
      if (++frame < 130) requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, w, h);
    };
    requestAnimationFrame(draw);
  }, []);

  const commit = (value, confetti = false) => {
    writeConsent({ analytics: value });
    setAnalytics(value);
    setFirstTime(false);
    setOpen(false);
    if (confetti) celebrate();
  };

  const switchBase = 'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors';

  return (
    <>
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[90]" aria-hidden="true" />
      {open && (
        <aside
          ref={boxRef}
          role="dialog"
          aria-labelledby="cookie-title"
          aria-describedby="cookie-desc"
          className={`fixed inset-x-3 bottom-3 z-[80] max-h-[calc(100svh-1.5rem)] overflow-y-auto rounded-3xl bg-white p-5 font-poppins text-eerieBlack sm:inset-x-auto sm:bottom-24 sm:right-5 sm:w-[380px] ${
            firstTime ? 'border-2 border-pink-500 shadow-2xl shadow-pink-500/20 ring-4 ring-pink-500/10' : 'border border-neutral-200 shadow-2xl'
          }`}
        >
          {!firstTime && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
            >
              <X size={14} />
            </button>
          )}

          <div className="flex items-start gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-100 to-pink-100 text-pink-600">
              <Cookie size={24} aria-hidden="true" />
            </span>
            <div>
              <h2 id="cookie-title" className="pr-4 text-lg font-bold leading-snug">
                {firstTime ? 'Your privacy choice' : 'Cookie settings'}
              </h2>
              <p id="cookie-desc" className="mt-1 text-sm leading-relaxed text-neutral-500">
                {firstTime ? 'Choose what this site may store. Either way, everything works the same.' : 'Update your choice. Changes apply right away.'}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2">
            {CATEGORIES.map(({ key, label, desc, Icon, locked }) => {
              const checked = locked ? true : analytics;
              return (
                <div key={key} className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-100 bg-neutral-50 p-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Icon size={16} className="shrink-0 text-neutral-400" aria-hidden="true" />
                    <div className="min-w-0">
                      <strong className="block text-sm font-semibold">{label}</strong>
                      <span className="text-xs leading-relaxed text-neutral-500">{desc}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    aria-label={label}
                    disabled={locked}
                    title={locked ? 'Always on' : undefined}
                    onClick={() => !locked && setAnalytics((v) => !v)}
                    className={`${switchBase} ${checked ? 'bg-gradient-to-r from-violet-600 to-pink-500' : 'bg-neutral-300'} ${
                      locked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={() => commit(true, true)} className="btn-accent h-11 !py-0 text-sm sm:flex-1">
              ACCEPT ALL
            </button>
            <button
              type="button"
              onClick={() => commit(false)}
              className="h-11 rounded-[12px] border border-neutral-200 bg-white text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 sm:flex-1"
            >
              Reject all
            </button>
          </div>
          <button
            type="button"
            onClick={() => commit(analytics)}
            className="mt-2 h-9 w-full rounded-full text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
          >
            Save my choices
          </button>
          <p className="mt-2 text-center text-xs text-neutral-400">You can change this any time from the footer.</p>
        </aside>
      )}
    </>
  );
}
