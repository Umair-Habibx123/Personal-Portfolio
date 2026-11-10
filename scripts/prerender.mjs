#!/usr/bin/env node
// After `vite build`, renders the page to HTML at build time and puts it into
// dist/index.html, so visitors see the hero before any JavaScript runs.
// Runs as part of `npm run build`.
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const { render } = await import(pathToFileURL(resolve('.ssr/entry-server.js')).href);
const file = 'dist/index.html';
const html = readFileSync(file, 'utf8');
const marker = '<div id="root"></div>';
if (!html.includes(marker)) throw new Error(`${file}: no empty #root to fill`);
writeFileSync(file, html.replace(marker, `<div id="root">${render()}</div>`));
rmSync('.ssr', { recursive: true, force: true });
console.log(`Pre-rendered ${file} (${Math.round(readFileSync(file).length / 1024)} KB)`);
