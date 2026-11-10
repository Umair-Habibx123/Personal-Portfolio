import { forwardRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Github, Download, Plus } from 'lucide-react';
import site, { img, srcSet } from '../lib/site';
import { Aurora, Heading, Reveal, trackPointer } from './ui';

/** The original pineapple "LIVE DEMO" button. */
function LiveButton({ href, name }) {
  const [hover, setHover] = useState(false);
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={`Live demo: ${name}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      className="btn border border-white/20 bg-night/70 !px-3 !py-2.5 text-timberWolf backdrop-blur hover:border-transparent hover:bg-accent hover:text-white"
    >
      <img src={img(hover ? 'icons/pineappleHover.webp' : 'icons/pineapple.webp')} alt="" width="28" height="28" className="h-7 w-7 object-contain" />
      LIVE DEMO
    </a>
  );
}

const ProjectCard = forwardRef(function ProjectCard({ project, active, onOpen }, ref) {
  const { links = {} } = project;
  return (
    <motion.article
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={trackPointer}
      className={`spotlight group relative overflow-hidden rounded-[24px] shadow-card ${active ? 'min-h-[480px]' : 'h-[300px]'} sm:h-[460px] sm:min-h-0 ${
        active ? 'sm:col-span-2 ring-2 ring-pink-500/70' : 'col-span-1'
      }`}
    >
      <img
        src={img(project.image)}
        srcSet={srcSet(project.image)}
        sizes={active ? '(min-width: 640px) 50vw, 100vw' : '(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'}
        alt={`${project.name} preview`}
        loading="lazy"
        decoding="async"
        className={`absolute inset-0 h-full w-full object-cover transition duration-700 ${active ? 'scale-100' : 'scale-110 grayscale-[60%] group-hover:grayscale-0'}`}
      />
      <div className={`absolute inset-0 transition duration-500 ${active ? 'bg-gradient-to-t from-night from-[38%] via-night/75 to-night/5' : 'bg-night/40 group-hover:bg-night/15'}`} />

      {!active ? (
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Open ${project.name}`}
          className="absolute inset-0 z-20 flex h-full w-full items-center justify-center text-left"
        >
          <h3 className="px-6 text-center font-beckman text-[22px] font-extrabold uppercase tracking-[1px] text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.85)] sm:text-[26px] lg:absolute lg:bottom-6 lg:left-[3.4rem] lg:origin-bottom-left lg:-rotate-90 lg:whitespace-nowrap lg:px-0 lg:text-left lg:text-[21px]">
            {project.name}
          </h3>
          <span className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-night/70 text-white transition group-hover:rotate-90 group-hover:bg-accent">
            <Plus size={18} aria-hidden="true" />
          </span>
          {project.featured && (
            <span className="absolute left-4 top-4 rounded-full bg-accent px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-white">Featured</span>
          )}
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="absolute inset-x-0 bottom-0 z-20 p-6 sm:p-8"
        >
          {links.github && (
            <a
              href={links.github}
              target="_blank"
              rel="noreferrer"
              aria-label={`Source code: ${project.name}`}
              className="absolute right-5 top-[-3.5rem] grid h-11 w-11 place-items-center rounded-full bg-night/90 text-white transition hover:bg-accent sm:right-6"
            >
              <Github size={20} />
            </a>
          )}
          <p className="font-mono text-[11px] uppercase tracking-widest text-pink-300">{project.category.join(' · ')}</p>
          <h3 className="mt-1 font-beckman text-[24px] font-bold uppercase text-timberWolf sm:text-[32px]">{project.name}</h3>
          <p className="mt-2 max-w-3xl font-poppins text-[13px] leading-[22px] tracking-[0.5px] text-silver sm:text-[14px] sm:leading-[24px]">{project.summary}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {project.tags.map((t) => (
              <span key={t} className="chip border-white/15 bg-white/10 text-white">
                {t}
              </span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {links.live && <LiveButton href={links.live} name={project.name} />}
            {links.apk && (
              <a href={links.apk} target="_blank" rel="noreferrer" className="btn-accent !px-4 !py-2.5" aria-label={`Download APK: ${project.name}`}>
                <Download size={16} aria-hidden="true" /> DOWNLOAD APK
              </a>
            )}
            {links.github && (
              <a href={links.github} target="_blank" rel="noreferrer" className="btn-glass !px-4 !py-2.5">
                <Github size={16} aria-hidden="true" /> CODE
              </a>
            )}
          </div>
        </motion.div>
      )}
    </motion.article>
  );
});

export default function Projects() {
  const { projects: section } = site;
  const projects = section.items;
  const projectFilters = section.filters;
  const [filter, setFilter] = useState('All');
  const shown = projects.filter((p) => filter === 'All' || p.category.includes(filter));
  const [activeName, setActiveName] = useState(projects[0]?.name);
  const active = shown.some((p) => p.name === activeName) ? activeName : shown[0]?.name;

  return (
    <section id="projects" className="relative overflow-hidden bg-night py-24 sm:py-32">
      <Aurora section="projects" />
      <div className="container-x relative">
        <Heading eyebrow={section.eyebrow} title={section.title} dark />
        <Reveal>
          <p className="mt-4 max-w-3xl text-[18px] leading-[30px] text-taupe">{section.intro}</p>
        </Reveal>

        <div role="tablist" aria-label="Filter projects" className="glass-dark mt-10 inline-flex flex-wrap gap-1 rounded-full p-1">
          {projectFilters.map((f) => {
            const count = f === 'All' ? projects.length : projects.filter((p) => p.category.includes(f)).length;
            return (
              <button
                key={f}
                role="tab"
                aria-selected={filter === f}
                onClick={() => setFilter(f)}
                className={`relative rounded-full px-5 py-2 font-beckman text-sm uppercase tracking-[1px] transition ${filter === f ? 'text-white' : 'text-taupe hover:text-white'}`}
              >
                {filter === f && (
                  <motion.span layoutId="filter-pill" className="absolute inset-0 -z-10 rounded-full bg-accent" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                )}
                {f} <span className="ml-1 font-mono text-[11px] opacity-60">{count}</span>
              </button>
            );
          })}
        </div>

        <motion.div layout className="mt-10 grid grid-flow-dense auto-rows-auto grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {shown.map((p) => (
              <ProjectCard key={p.name} project={p} active={p.name === active} onOpen={() => setActiveName(p.name)} />
            ))}
          </AnimatePresence>
        </motion.div>

        <p className="mt-12 text-center text-taupe">
          More on{' '}
          <a href={site.links.github} target="_blank" rel="noreferrer" className="font-semibold text-white underline decoration-pink-500 decoration-2 underline-offset-4 hover:text-pink-300">
            GitHub
          </a>
        </p>
      </div>
    </section>
  );
}
