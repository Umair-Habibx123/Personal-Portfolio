// Gathers the small JSON files in src/data into one object for the components.
import profile from '../data/profile.json';
import links from '../data/links.json';
import seo from '../data/seo.json';
import nav from '../data/navigation.json';
import about from '../data/about.json';
import skills from '../data/skills.json';
import marquee from '../data/marquee.json';
import projectsSection from '../data/projects.json';
import experienceSection from '../data/experience.json';
import contact from '../data/contact.json';
import footer from '../data/footer.json';
import shaders from '../data/shaders.json';
// The published resume PDF (or null), chosen in links.json; see vite.config.js
import resumeUrl from 'virtual:resume';

const byFileName = (modules) =>
  Object.keys(modules)
    .sort()
    .map((k) => modules[k]);

const projects = byFileName(import.meta.glob('../data/projects/*.json', { eager: true, import: 'default' }));
const jobs = byFileName(import.meta.glob('../data/experience/*.json', { eager: true, import: 'default' }));

// Every image under src/assets/img, keyed by its path inside that folder
const files = import.meta.glob('../assets/img/**/*.{png,jpg,jpeg,webp,svg,gif}', { eager: true, import: 'default' });
const images = Object.fromEntries(Object.entries(files).map(([path, url]) => [path.replace('../assets/img/', ''), url]));

export function img(name) {
  if (!name) return undefined;
  const url = images[name];
  if (!url && import.meta.env.DEV) console.warn(`[data] image not found: src/assets/img/${name}`);
  return url;
}

const whatsappUrl = links.whatsapp?.number
  ? `https://wa.me/${links.whatsapp.number.replace(/\D/g, '')}${
      links.whatsapp.message ? `?text=${encodeURIComponent(links.whatsapp.message)}` : ''
    }`
  : null;

/**
 * srcset for an image that has smaller copies saved next to it as
 * "name@640.webp" (made by the optimisation step). Browsers pick the
 * smallest one that is sharp enough, so phones download a fraction.
 */
export function srcSet(name) {
  const full = images[name];
  if (!full) return undefined;
  const dot = name.lastIndexOf('.');
  const smaller = Object.keys(images)
    .filter((k) => k.startsWith(`${name.slice(0, dot)}@`) && k.endsWith(name.slice(dot)))
    .map((k) => [images[k], Number(k.match(/@(\d+)\./)[1])]);
  if (!smaller.length) return undefined;
  const widths = smaller.map(([url, w]) => `${url} ${w}w`);
  return [...widths, `${full} ${IMAGE_WIDTHS[name] ?? 1280}w`].join(', ');
}

// Real widths of the full-size images (for srcset)
const IMAGE_WIDTHS = {
  'people/umair.webp': 1114,
};

const site = {
  profile,
  stats: profile.stats,
  links: {
    ...links,
    whatsapp: whatsappUrl,
    resume: resumeUrl || links.resume?.fallbackUrl,
    resumeIsFile: Boolean(resumeUrl),
    resumeFileName: links.resume?.file,
  },
  seo,
  nav,
  about,
  skills,
  marquee,
  projects: { ...projectsSection, items: projects },
  experience: { ...experienceSection, jobs },
  contact,
  footer,
  shaders,
};

export default site;
