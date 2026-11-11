import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const readJson = (f) => JSON.parse(readFileSync(new URL(`./src/data/${f}`, import.meta.url), 'utf8'));

const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** Fills %SEO_*% placeholders in index.html from the data files. */
function seoFromData() {
  const seo = readJson('seo.json');
  const profile = readJson('profile.json');
  const links = readJson('links.json');
  const values = {
    SEO_TITLE: seo.title,
    SEO_DESCRIPTION: seo.description,
    SITE_URL: links.website,
    NAME: profile.name,
    JOB_TITLE: profile.role,
    COMPANY: profile.company,
    SAME_AS: JSON.stringify([links.github, links.linkedin]),
  };
  return {
    name: 'seo-from-data',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) =>
        html.replace(/%(\w+)%/g, (m, k) => (k in values ? (k === 'SAME_AS' ? values[k] : escapeHtml(values[k])) : m)),
    },
  };
}

/**
 * `import resumeUrl from 'virtual:resume'` gives the URL of the ONE resume
 * named in links.json -> resume.file, from data/resume/. Other versions in
 * that folder are never bundled. If the file is missing it is null and the
 * site falls back to resume.fallbackUrl.
 */
function resumeFromFolder() {
  const id = 'virtual:resume';
  const RESOLVED = String.fromCharCode(0) + id; // Vite convention for virtual modules
  return {
    name: 'resume-from-folder',
    resolveId: (s) => (s === id ? RESOLVED : null),
    load(s) {
      if (s !== RESOLVED) return null;
      const name = readJson('links.json').resume?.file;
      const file = name && resolve('data/resume', name);
      if (!file || !existsSync(file)) {
        this.warn(`Resume not found at data/resume/${name}. Using resume.fallbackUrl instead.`);
        return 'export default null;';
      }
      this.addWatchFile(file);
      return `export { default } from ${JSON.stringify(file.split(String.fromCharCode(92)).join('/') + '?url')};`;
    },
  };
}

/** Runs /api/contact locally during `npm run dev`, using your .env values. */
function devContactApi(env) {
  return {
    name: 'dev-contact-api',
    configureServer(server) {
      server.middlewares.use('/api/contact', async (req, res) => {
        const send = (status, json) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(json));
        };
        if (req.method !== 'POST') return send(405, { ok: false, error: 'Method not allowed.' });
        let raw = '';
        for await (const chunk of req) raw += chunk;
        let body = null;
        try {
          body = JSON.parse(raw);
        } catch {
          /* handled below */
        }
        const { handleContact } = await server.ssrLoadModule('/server/contact.js');
        const { status, json } = await handleContact(body, {
          ip: req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
          env: { ...process.env, ...env },
        });
        send(status, json);
      });
    },
  };
}

/** Runs /api/chat locally during `npm run dev` (streams like the Vercel function). */
function devChatApi(env) {
  return {
    name: 'dev-chat-api',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res) => {
        if (req.method === 'GET') {
          const { handleChatHistory } = await server.ssrLoadModule('/server/chat.js');
          const visitor = new URL(req.originalUrl, 'http://x').searchParams.get('visitor') || '';
          const out = await handleChatHistory(visitor, { env: { ...process.env, ...env } }).catch(() => ({ ok: false, status: 500 }));
          res.statusCode = out.status || 200;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify(out));
        }
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end();
        }
        let raw = '';
        for await (const chunk of req) raw += chunk;
        let body = null;
        try {
          body = JSON.parse(raw);
        } catch {
          /* handled by handleChat */
        }
        const { handleChat } = await server.ssrLoadModule('/server/chat.js');
        await handleChat(body, { ip: req.socket.remoteAddress, userAgent: req.headers['user-agent'], env: { ...process.env, ...env } }, {
          json: (status, obj) => {
            res.statusCode = status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(obj));
          },
          start: () => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          },
          write: (t) => res.write(t),
          end: () => res.end(),
        });
      });
    },
  };
}

/** /api/analytics locally: stats can be read, but visits from localhost are never recorded. */
function devAnalyticsApi(env) {
  return {
    name: 'dev-analytics-api',
    configureServer(server) {
      server.middlewares.use('/api/analytics', async (req, res) => {
        const mod = await server.ssrLoadModule('/server/analytics.js');
        const allEnv = { ...process.env, ...env };
        if (req.method === 'GET') {
          const stats = await mod.handleStats({ env: allEnv }).catch(() => null);
          res.statusCode = stats ? 200 : 404;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify(stats ? { ok: true, ...stats } : { ok: false }));
        }
        for await (const _ of req); // drain the body
        res.statusCode = 204; // local visits are ignored
        res.end();
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), seoFromData(), resumeFromFolder(), devContactApi(loadEnv(mode, process.cwd(), '')), devChatApi(loadEnv(mode, process.cwd(), '')), devAnalyticsApi(loadEnv(mode, process.cwd(), ''))],
  // three.js is split into its own lazily-loaded chunk (desktop only)
  build: {
    chunkSizeWarningLimit: 900,
    // Small images as real files (cached), not base64 text repeated in the HTML and JS
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        // Libraries in their own files: they rarely change, so browsers keep
        // them cached across deploys and only re-download the site's own code.
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return undefined;
          if (/[\/](react|react-dom|scheduler)[\/]/.test(id)) return 'react';
          if (/[\/](framer-motion|motion-dom|motion-utils)[\/]/.test(id)) return 'motion';
          return undefined;
        },
      },
    },
  },
}));
