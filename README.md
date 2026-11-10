# Umair Habib · Portfolio

My portfolio site: **[umairhabib.vercel.app](https://umairhabib.vercel.app)**. Built with React, Vite and Tailwind CSS, hosted on Vercel's free plan.

The design mixes my original site (black-and-white world map, diagonal light/dark hero, 3D technology balls, expandable project cards, the alternating timeline) with newer touches: a violet → pink → amber accent, animated shader backgrounds and a working contact form.

## Edit the content

All text, links, projects and jobs are small JSON files in [`src/data/`](src/data). There's one file per section, one per project and one per company. [`src/data/README.md`](src/data/README.md) explains which file controls what. No code changes are needed to update the site.

- **Resume:** put PDFs in `data/resume/`. Only the file named in `src/data/links.json` → `resume.file` is published (now `Umair Habib - Resume.pdf`), so older versions can stay in the folder.
- **Images:** put them in `src/assets/img/` and refer to them by path, for example `"projects/attendy.webp"`. Optionally save a smaller copy next to it as `name@640.webp`, and phones will download that instead.

## Shaders

The dark sections have animated backgrounds from [Paper Shaders](https://shaders.paper.design) (`@paper-design/shaders`, the same library as the Next.js base template). Which shader goes where is set in [`src/data/shaders.json`](src/data/shaders.json):

| Section | Shader | Notes |
|---|---|---|
| Technologies | **meshGradient** | Blended over the skyline photo at 70% (`"blend": "screen"`) |
| Projects | **meshGradient** | Full strength, different starting point (`seed: 2`) |
| Contact | **meshGradient** | Full strength, different starting point (`seed: 3`) |

**All 20 shaders you can use, with every setting:** [docs/SHADERS.md](docs/SHADERS.md). To change one, set `"shader"` to a name from that list and put its settings under `"uniforms"`. Set `"shader": null` to turn a section's shader off. Regenerate the list after updating the library with `npm run shaders:list`.

Shaders load only when a dark section comes near the screen, render at low resolution and pause off screen. Visitors who turn off animations in their system settings, or whose browser lacks WebGL, see a soft CSS glow instead.

## Contact form

`POST /api/contact` (a Vercel function, [`api/contact.js`](api/contact.js)) does two things for every message:

1. **Emails it to you over SMTP** (nodemailer).
2. **Saves it as its own JSON file in a private GitHub repo**, so nothing is lost if SMTP fails.

The visitor sees "Message sent" if either step worked. They see an error only if both failed. Spam protection is a hidden field, a minimum fill time and a per-IP rate limit.

**Setup:** copy `.env.example` to `.env` (the comments there explain every value) and add the same variables in Vercel → Settings → Environment Variables.

**Read your messages in a local SQLite file:**

```bash
npm run messages:sync   # downloads new messages into data/messages.db
npm run messages:list   # prints the newest 20 (npm run messages:list -- 50 for more)
```

## Run it

Needs Node.js 22.5 or newer.

```bash
npm install
npm run dev        # http://localhost:5173 (the contact form works locally with your .env)
npm run build      # production build in dist/, with the page pre-rendered to HTML
npm run preview    # serve that build locally
```

## Performance

The site is built to load fast on a free plan:

- **Pre-rendered HTML:** the page is rendered at build time ([`scripts/prerender.mjs`](scripts/prerender.mjs)), so the hero appears before any JavaScript runs. The hero's entrance animation is CSS, for the same reason.
- **Split, cached JavaScript:** React and the animation library are separate files that stay cached across deploys. three.js (the 3D balls) and the shader library load only when their sections come near the screen. The 3D balls load on desktop only and share one canvas, which pauses off screen.
- **Images:** all WebP. Phones download the `@640` copies. Below-the-fold images load lazily, and the hero downloads one world map, not both.
- **Fonts:** self-hosted. The original display fonts are trimmed to Latin characters and converted to WOFF2 (164 KB → 34 KB).
- **Ads:** AdSense loads only after the page has finished loading and gone idle.
- **Caching:** everything in `/assets` is cached for a year (file names change when the content does).

## Project structure

```
api/contact.js          Vercel function for the contact form
server/contact.js       the form logic (also used by the dev server)
scripts/                messages sync, shader list, pre-rendering
src/data/               all site content (JSON)
src/components/         one component per section
src/assets/img/         images; fonts are in src/fonts/
docs/SHADERS.md         every available shader and its settings
data/resume/            resume PDFs (one is published)
```
