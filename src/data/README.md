# Site content

Everything the site shows is in these JSON files. Edit one, save, and the dev server updates.

| File | What it holds |
|---|---|
| `profile.json` | Name, role, location, photo, the hero text and the four stat cards |
| `links.json` | Email, GitHub, LinkedIn, WhatsApp number, and which resume file is published |
| `seo.json` | Page title and description for Google and link previews |
| `navigation.json` | Menu items (the `id` must match a section) |
| `about.json` | The Overview section and its four cards |
| `skills.json` | The 3D balls (`balls`) and the grouped skill lists (`groups`) |
| `marquee.json` | The scrolling strip under the hero |
| `projects.json` | Projects heading, intro and filter tabs |
| `projects/*.json` | **One file per project.** The number at the start sets the order |
| `experience.json` | Experience heading and your education |
| `experience/*.json` | **One file per company.** The number at the start sets the order |
| `contact.json` | Contact section text |
| `footer.json` | Footer quote and note |
| `shaders.json` | The animated shader behind each dark section. All options: [`docs/SHADERS.md`](../../docs/SHADERS.md) |

## Images

Images are referred to by their path inside `src/assets/img/`, for example
`"projects/attendy.webp"`. To add a project image, put it in
`src/assets/img/projects/` and use its name.

## Adding a project

Copy any file in `projects/`, rename it (for example `10-my-app.json`) and edit it.
`category` must use the names in `projects.json` → `filters`. Leave out any link
you don't have (`live`, `apk`, `github`).

## Resume

Put PDFs in `data/resume/` (in the project root, not here). Only the file named in
`links.json` → `resume.file` is published; keep older versions in the same folder
under any other name.
