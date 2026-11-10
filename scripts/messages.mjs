#!/usr/bin/env node
// Builds a local SQLite database of every contact-form message.
//
//   npm run messages:sync          download new messages from the private repo into data/messages.db
//   npm run messages:list          show the 20 newest messages
//   npm run messages:list -- 50    show the 50 newest
//
// Reads GITHUB_TOKEN, GITHUB_REPO and GITHUB_BRANCH from .env (the same values
// the site uses). Needs Node 22.5+ for the built-in node:sqlite module.

import { existsSync, mkdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

if (existsSync('.env')) process.loadEnvFile('.env');

const DB_PATH = 'data/messages.db';
const { GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH = 'main' } = process.env;

mkdirSync('data', { recursive: true });
const db = new DatabaseSync(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id          TEXT PRIMARY KEY,
    path        TEXT UNIQUE NOT NULL,
    received_at TEXT NOT NULL,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    subject     TEXT,
    message     TEXT NOT NULL,
    user_agent  TEXT,
    smtp_sent   INTEGER NOT NULL DEFAULT 0,
    smtp_error  TEXT,
    synced_at   TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS messages_received ON messages (received_at DESC);
`);

async function gh(path, accept = 'application/vnd.github+json') {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}${path}`, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: accept,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'portfolio-messages-sync',
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub ${res.status} for ${path}: ${await res.text()}`);
  return accept.includes('raw') ? res.text() : res.json();
}

async function sync() {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    console.error('Set GITHUB_TOKEN and GITHUB_REPO in .env first (see .env.example).');
    process.exit(1);
  }
  const tree = await gh(`/git/trees/${encodeURIComponent(GITHUB_BRANCH)}?recursive=1`);
  if (!tree) {
    console.log('No messages yet (the repo or branch is empty).');
    return;
  }
  const files = tree.tree.filter((f) => f.type === 'blob' && /^messages\/.+\.json$/.test(f.path));
  const known = new Set(db.prepare('SELECT path FROM messages').all().map((r) => r.path));
  const fresh = files.filter((f) => !known.has(f.path));

  const insert = db.prepare(`
    INSERT OR IGNORE INTO messages
      (id, path, received_at, name, email, subject, message, user_agent, smtp_sent, smtp_error, synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  let added = 0;
  for (const f of fresh) {
    const m = JSON.parse(await gh(`/contents/${f.path}?ref=${encodeURIComponent(GITHUB_BRANCH)}`, 'application/vnd.github.raw+json'));
    insert.run(
      m.id,
      f.path,
      m.receivedAt,
      m.name,
      m.email,
      m.subject || null,
      m.message,
      m.userAgent || null,
      m.smtp?.sent ? 1 : 0,
      m.smtp?.error || null,
      new Date().toISOString(),
    );
    added++;
  }
  const total = db.prepare('SELECT COUNT(*) AS n FROM messages').get().n;
  const unsent = db.prepare('SELECT COUNT(*) AS n FROM messages WHERE smtp_sent = 0').get().n;
  console.log(`Synced ${added} new message(s). ${total} total in ${DB_PATH}.`);
  if (unsent) console.log(`⚠ ${unsent} message(s) were NOT emailed (SMTP failed). Run "npm run messages:list" to read them.`);
}

function list(limit) {
  const rows = db
    .prepare('SELECT received_at, name, email, subject, message, smtp_sent FROM messages ORDER BY received_at DESC LIMIT ?')
    .all(limit);
  if (!rows.length) return console.log('No messages in the local database. Run "npm run messages:sync" first.');
  for (const r of rows) {
    console.log('─'.repeat(70));
    console.log(`${r.received_at}  ${r.smtp_sent ? '✉ emailed' : '⚠ NOT emailed'}`);
    console.log(`${r.name} <${r.email}>${r.subject ? `  ·  ${r.subject}` : ''}`);
    console.log('');
    console.log(r.message);
  }
  console.log('─'.repeat(70));
}

const [cmd = 'sync', arg] = process.argv.slice(2);
if (cmd === 'sync') await sync();
else if (cmd === 'list') list(Number(arg) || 20);
else {
  console.error(`Unknown command "${cmd}". Use "sync" or "list".`);
  process.exit(1);
}
db.close();
