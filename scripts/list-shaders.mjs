#!/usr/bin/env node
// Writes docs/SHADERS.md: every shader in @paper-design/shaders, what it looks
// like, and the settings it takes, read from the library itself.
//
//   npm run shaders:list
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const pkgJson = join('node_modules', '@paper-design', 'shaders', 'package.json');
const { version } = JSON.parse(readFileSync(pkgJson, 'utf8'));
const dir = join(dirname(pkgJson), 'dist', 'shaders');

// Uniforms the site fills in by itself (time, size, position, colours)
const AUTO = new Set([
  'u_time', 'u_resolution', 'u_pixelRatio', 'u_originX', 'u_originY', 'u_worldWidth', 'u_worldHeight',
  'u_fit', 'u_scale', 'u_rotation', 'u_offsetX', 'u_offsetY', 'u_colors', 'u_colorsCount', 'u_noiseTexture', 'u_imageAspectRatio',
]);

// Choice lists (e.g. GrainGradientShapes) only exist at runtime
const paper = await import('@paper-design/shaders');
const enumsFor = (name) =>
  Object.entries(paper)
    .filter(([k, v]) => k.toLowerCase().startsWith(name.toLowerCase()) && !k.endsWith('Meta') && v && typeof v === 'object' && !Array.isArray(v))
    .filter(([, v]) => Object.values(v).length > 0 && Object.values(v).every((x) => typeof x === 'number'))
    .map(([k, v]) => `${k.slice(name.length)}: ${Object.entries(v).map(([a, b]) => `${a} = ${b}`).join(', ')}`);

const DOC_LINE = /- (u_\w+) \(([^)]+)\): (.+)/g;
const IFACE = /export interface \w+Uniforms[^{]*\{([\s\S]*?)\n\}/;
const IFACE_KEY = /^\s*(u_\w+)\??:/gm;

const rows = [];
for (const file of readdirSync(dir).filter((f) => f.endsWith('.d.ts')).sort()) {
  const src = readFileSync(join(dir, file), 'utf8');
  const name = src.match(/export declare const (\w+)FragmentShader/)?.[1];
  if (!name) continue;

  const doc = src.match(/\/\*\*([\s\S]*?)\*\//)?.[1] ?? '';
  const lines = doc.split(/\r?\n/).map((l) => l.replace(/^\s*\*\s?/, '').trim());
  const descEnd = lines.findIndex((l) => /uniforms:/i.test(l) || l.startsWith('SIZING NOTE'));
  const description = lines.slice(0, descEnd < 0 ? undefined : descEnd).filter(Boolean).join(' ');

  const docText = Object.fromEntries([...doc.matchAll(DOC_LINE)].map(([, u, type, text]) => [u, { type, text: text.trim() }]));
  const iface = src.match(IFACE)?.[1] ?? '';
  const uniforms = [...iface.matchAll(IFACE_KEY)].map(([, u]) => ({
    key: u.slice(2),
    type: docText[u]?.type ?? '',
    text: docText[u]?.text ?? '',
    auto: AUTO.has(u),
  }));

  rows.push({
    name,
    description,
    uniforms,
    enums: enumsFor(name),
    maxColors: src.match(/maxColorCount: (\d+)/)?.[1],
    needsImage: uniforms.some((u) => u.key === 'image'),
    sizing: doc.includes('v_patternUV') ? 'pattern' : 'object',
  });
}

const usable = rows.filter((r) => !r.needsImage);
const imageOnly = rows.filter((r) => r.needsImage);
const colourNote = (r) =>
  r.maxColors ? `up to ${r.maxColors}` : r.uniforms.some((u) => u.key.startsWith('color')) ? 'named' : '–';

let md = `# Shaders available for the site

Generated from \`@paper-design/shaders\` ${version} by \`npm run shaders:list\`.
Choose one per section in [\`src/data/shaders.json\`](../src/data/shaders.json):
put the **name** below in \`"shader"\`, and any of its settings in \`"uniforms"\`
(without the \`u_\`). Colours are hex strings, for example \`"#7c3aed"\`.

See them moving at <https://shaders.paper.design>.

| Shader | What it looks like | Settings | Colours |
|---|---|---|---|
`;
for (const r of usable) {
  const settings = r.uniforms.filter((u) => !u.auto).map((u) => `\`${u.key}\``).join(', ') || '–';
  md += `| **${r.name}** | ${r.description} | ${settings} | ${colourNote(r)} |\n`;
}

md += `\n## Settings, shader by shader\n`;
for (const r of usable) {
  md += `\n### ${r.name}\n\n${r.description}\n\n`;
  md += `Sizing: \`${r.sizing}\`${r.maxColors ? ` · up to ${r.maxColors} colours in \`"colors"\`` : ''}\n\n`;
  for (const u of r.uniforms.filter((x) => !x.auto)) md += `- \`${u.key}\`${u.type ? ` (${u.type})` : ''}: ${u.text}\n`;
  for (const e of r.enums) md += `- choices for ${e}\n`;
}

md += `\n## Image filters (not used here)\n\nThese work on a picture, so they don't suit a section background:\n\n`;
for (const r of imageOnly) md += `- **${r.name}**: ${r.description}\n`;

mkdirSync('docs', { recursive: true });
writeFileSync('docs/SHADERS.md', md);
console.log(`docs/SHADERS.md: ${usable.length} background shaders, ${imageOnly.length} image filters (library ${version}).`);
