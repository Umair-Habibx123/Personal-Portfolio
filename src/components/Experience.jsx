import { useState } from 'react';
import { GraduationCap, Download, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import site, { img } from '../lib/site';
import { Heading, Reveal, ResumeLink } from './ui';

/** One stop on the original alternating timeline. */
function TimelineItem({ side, date, icon, iconBg, children, index }) {
  const left = side === 'left';
  return (
    <li className="group relative grid grid-cols-[56px_1fr] gap-5 lg:grid-cols-[1fr_72px_1fr] lg:gap-8">
      {/* date, on the opposite side on large screens */}
      <div className={`hidden items-start pt-6 lg:flex ${left ? 'order-3 justify-start' : 'order-1 justify-end'}`}>
        {date && <p className="rounded-full bg-white/85 px-4 py-1.5 font-beckman text-[16px] font-bold tracking-[1px] text-jet shadow-sm backdrop-blur">{date}</p>}
      </div>

      <div className="order-1 flex justify-center lg:order-2">
        <span style={iconBg ? { background: iconBg } : undefined} className="relative z-10 grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-[#eaeaec] shadow-[0_0_0_4px_#afafafd2] lg:h-[72px] lg:w-[72px]">
          {icon}
        </span>
      </div>

      <Reveal x={left ? -40 : 40} y={0} delay={index * 0.05} className={`order-2 ${left ? 'lg:order-1' : 'lg:order-3'}`}>
        <div className="relative rounded-2xl bg-[#eaeaec] p-6 text-jet shadow-[rgba(0,0,0,0.1)_0px_10px_15px_-3px,rgba(0,0,0,0.05)_0px_4px_6px_-2px] sm:p-7">
          <span
            className={`absolute top-7 hidden h-0 w-0 border-y-[8px] border-y-transparent lg:block ${
              left ? '-right-[8px] border-l-[8px] border-l-[#eaeaec]' : '-left-[8px] border-r-[8px] border-r-[#eaeaec]'
            }`}
          />
          <p className="mb-2 font-beckman text-[15px] font-bold text-dim lg:hidden">{date}</p>
          {children}
        </div>
      </Reveal>
    </li>
  );
}

function Role({ role, first }) {
  const [open, setOpen] = useState(first);
  return (
    <div className="border-t border-black/10 pt-4 first:border-0 first:pt-0">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-start justify-between gap-3 text-left">
        <span>
          <span className="block font-beckman text-[20px] font-bold tracking-[1px] text-jetLight sm:text-[22px]">{role.title}</span>
          <span className="mt-1 flex flex-wrap items-center gap-2">
            <span className="chip border-pink-500/30 bg-pink-500/10 text-pink-600">{role.type}</span>
            <span className="font-mono text-[11px] text-dim">{role.period}</span>
          </span>
        </span>
        <ChevronDown size={20} className={`mt-1 shrink-0 text-dim transition ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <ul className="mt-4 space-y-2">
              {role.points.map((p) => (
                <li key={p.slice(0, 30)} className="flex gap-3 text-[14px] leading-relaxed text-jetGray">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {role.tags.map((t) => (
                <span key={t} className="chip border-black/10 bg-white text-jet">
                  {t}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Experience() {
  const { experience: section } = site;
  const experience = section.jobs;
  const { education } = section;
  const sides = (i) => (i % 2 === 0 ? 'left' : 'right');

  return (
    <section id="experience" className="relative overflow-hidden bg-night">
      {/* Original: light abstract panel with the big rounded corners */}
      <div
        className="rounded-br-[90px] rounded-tl-[90px] bg-cover bg-center sm:rounded-br-[150px] sm:rounded-tl-[150px]"
        style={{ backgroundImage: `linear-gradient(135deg, rgba(244,244,246,0.5) 60%, rgba(10,10,10,0.2) 100%), url(${img('backgrounds/white-abstract.webp')})` }}
      >
        <div className="rounded-br-[80px] rounded-tl-[90px] bg-[linear-gradient(137deg,rgba(244,244,246,0.6)_60%,rgba(10,10,10,0.85)_60%)] py-24 sm:rounded-br-[130px] sm:rounded-tl-[150px] sm:py-32">
          <div className="container-x">
            <Heading eyebrow={section.eyebrow} title={section.title} />

            <ol className="relative mt-16 space-y-10 before:absolute before:bottom-0 before:left-[27px] before:top-0 before:w-1 before:rounded-full before:bg-[linear-gradient(180deg,rgba(66,66,66,0.8)_40%,rgba(234,234,236,0.45)_100%)] lg:before:left-1/2 lg:before:-translate-x-1/2">
              {experience.map((job, i) => (
                <TimelineItem
                  key={job.company}
                  index={i}
                  side={sides(i)}
                  iconBg={job.logoBg}
                  date={`${job.roles[job.roles.length - 1].period.split('–')[0].trim()} – ${job.roles[0].period.split('–')[1].trim()}`}
                  icon={<img src={img(job.logo)} alt={`${job.company} logo`} className="h-[70%] w-[70%] object-contain grayscale transition duration-500 group-hover:grayscale-0" loading="lazy" />}
                >
                  <p className="font-overcame text-[22px] tracking-[1px] text-taupe">{job.company}</p>
                  <p className="mb-4 font-mono text-[11px] text-dim">{job.location}</p>
                  <div className="space-y-4">
                    {job.roles.map((r, ri) => (
                      <Role key={r.title} role={r} first={i === 0 && ri === 0} />
                    ))}
                  </div>
                </TimelineItem>
              ))}

              <TimelineItem
                index={experience.length}
                side={sides(experience.length)}
                date={education.period}
                icon={<GraduationCap size={26} className="text-jetLight" aria-hidden="true" />}
              >
                <p className="font-beckman text-[20px] font-bold tracking-[1px] text-jetLight">{education.degree}</p>
                <p className="text-[15px] font-semibold text-jetGray">{education.school}</p>
                <p className="mt-2 text-gradient font-display text-2xl font-extrabold">{education.grade}</p>
                <p className="mt-1 text-sm text-jetGray">{education.note}</p>
              </TimelineItem>

              {/* Original: resume at the end of the timeline */}
              <TimelineItem
                index={experience.length + 1}
                side={sides(experience.length + 1)}
                date=""
                icon={<span className="grid h-full w-full place-items-center bg-jetLight text-white"><Download size={24} aria-hidden="true" /></span>}
              >
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-beckman text-[20px] font-bold tracking-[1px] text-jetLight">The full story</p>
                  <ResumeLink className="btn-dark">
                    MY RESUME <Download size={18} aria-hidden="true" />
                  </ResumeLink>
                </div>
              </TimelineItem>
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
