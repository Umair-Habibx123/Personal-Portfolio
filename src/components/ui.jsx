import { motion } from 'framer-motion';
import site from '../lib/site';
import ShaderBackground from './ShaderBackground';

/** Link to the resume: downloads the PDF from data/resume, or opens the fallback URL. */
export function ResumeLink({ children, ...props }) {
  const { resume, resumeIsFile, resumeFileName } = site.links;
  return resumeIsFile ? (
    <a href={resume} download={resumeFileName} {...props}>
      {children}
    </a>
  ) : (
    <a href={resume} target="_blank" rel="noreferrer" {...props}>
      {children}
    </a>
  );
}

/** Fades and lifts its children into view once, when scrolled to. */
export function Reveal({ children, delay = 0, y = 24, x = 0, className, as = 'div' }) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Tag>
  );
}

/**
 * The original section heading ("INTRODUCTION" / "Overview."), with the
 * full stop in the new accent gradient.
 */
export function Heading({ eyebrow, title, dark = false, className = '' }) {
  const text = title.endsWith('.') ? title.slice(0, -1) : title;
  return (
    <Reveal className={className}>
      <p className="section-sub flex items-center gap-3">
        <span className="h-[2px] w-8 bg-accent" />
        {eyebrow}
      </p>
      <h2 className={`section-head mt-1 ${dark ? 'text-timberWolf' : 'text-eerieBlack'}`}>
        {text}
        <span className="text-gradient">.</span>
      </h2>
    </Reveal>
  );
}

/** Sets --x / --y on the element so .spotlight can follow the cursor. */
export function trackPointer(e) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`);
}

/**
 * Background for dark sections: CSS colour glows (instant, and the fallback),
 * with the section's shader from shaders.json fading in on top.
 */
export function Aurora({ className = '', section }) {
  const shader = section ? site.shaders[section] : null;
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="absolute -left-[10%] top-[-20%] h-[45vmax] w-[45vmax] animate-aurora rounded-full bg-violet-600/25 blur-[110px]" />
      <div className="absolute -right-[10%] bottom-[-25%] h-[40vmax] w-[40vmax] animate-aurora rounded-full bg-pink-500/20 blur-[110px]" style={{ animationDelay: '-9s' }} />
      {shader?.shader && <ShaderBackground config={shader} />}
      <div className="grain absolute inset-0 opacity-[0.07] mix-blend-overlay" />
    </div>
  );
}
