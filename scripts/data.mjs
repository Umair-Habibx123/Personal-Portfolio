#!/usr/bin/env node
// Everything the site saves to the private GitHub backup repo, in one local
// database you can read, report on, and later move to PostgreSQL.
//
//   npm run data:sync                    download new contact messages, AI chats and open questions
//   npm run data:report                  summary + tables of the latest of each
//   npm run data:messages [-- 50]        contact messages, newest first
//   npm run data:chats                   conversations, newest first
//   npm run data:chats -- <conversation> one conversation, every turn in full
//   npm run data:questions               questions the AI couldn't answer (open first)
//   npm run data:answered -- <id>        mark an open question as handled
//   npm run data:export                  write data/export/*.sql (PostgreSQL) and *.csv
//
// Local database: data/messages.db (SQLite, built into Node 22.5+).
// Reads GITHUB_TOKEN, GITHUB_REPO and GITHUB_BRANCH from .env.

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

if (existsSync('.env')) process.loadEnvFile('.env');
const { GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH = 'main' } = process.env;
const DB_PATH = process.env.DATA_DB || 'data/messages.db'; // DATA_DB: use another file (e.g. for testing)
mkdirSync('data', { recursive: true });
const db = new DatabaseSync(DB_PATH);

// ── schema (SQLite) ─────────────────────────────────────────────────────────
// Table names match the contact form's original database so old data stays.
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY, path TEXT UNIQUE NOT NULL, received_at TEXT NOT NULL,
    name TEXT NOT NULL, email TEXT NOT NULL, subject TEXT, message TEXT NOT NULL,
    user_agent TEXT, smtp_sent INTEGER NOT NULL DEFAULT 0, smtp_error TEXT, synced_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS chats (
    path TEXT PRIMARY KEY, conversation_id TEXT NOT NULL, turn INTEGER NOT NULL, at TEXT NOT NULL,
    question TEXT NOT NULL, answer TEXT NOT NULL, model TEXT, synced_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS questions (
    path TEXT PRIMARY KEY, conversation_id TEXT NOT NULL, turn INTEGER NOT NULL, visitor_id TEXT,
    at TEXT NOT NULL, question TEXT NOT NULL, answer TEXT, status TEXT NOT NULL DEFAULT 'open',
    handled_at TEXT, synced_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS messages_received ON messages (received_at DESC);
  CREATE INDEX IF NOT EXISTS chats_at ON chats (at DESC);
  CREATE INDEX IF NOT EXISTS chats_conversation ON chats (conversation_id, turn);
  CREATE INDEX IF NOT EXISTS questions_at ON questions (at DESC);
`);
const addColumn = (table, col, type) => {
  if (!db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === col)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
};
addColumn('messages', 'verified', 'INTEGER NOT NULL DEFAULT 0');
addColumn('chats', 'visitor_id', 'TEXT');

// ── GitHub ──────────────────────────────────────────────────────────────────
async function gh(path, accept = 'application/vnd.github+json') {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}${path}`, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: accept, 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'portfolio-data-sync' },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub ${res.status} for ${path}: ${await res.text()}`);
  return accept.includes('raw') ? res.text() : res.json();
}
const readFile = async (path) => JSON.parse(await gh(`/contents/${path}?ref=${encodeURIComponent(GITHUB_BRANCH)}`, 'application/vnd.github.raw+json'));

async function sync() {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    console.error('Set GITHUB_TOKEN and GITHUB_REPO in .env first (see .env.example).');
    process.exit(1);
  }
  const tree = await gh(`/git/trees/${encodeURIComponent(GITHUB_BRANCH)}?recursive=1`);
  if (!tree) return console.log('Nothing yet: the backup repo or branch is empty.');
  const files = (dir) => tree.tree.filter((f) => f.type === 'blob' && f.path.startsWith(`${dir}/`) && f.path.endsWith('.json'));
  const now = new Date().toISOString();

  const kinds = [
    {
      label: 'contact messages',
      table: 'messages',
      dir: 'messages',
      insert: db.prepare(`INSERT OR IGNORE INTO messages (id, path, received_at, name, email, subject, message, user_agent, smtp_sent, smtp_error, synced_at, verified)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),
      row: (m, path) => [m.id, path, m.receivedAt, m.name, m.email, m.subject || null, m.message, m.userAgent || null, m.smtp?.sent ? 1 : 0, m.smtp?.error || null, now, m.verified ? 1 : 0],
    },
    {
      label: 'chat turns',
      table: 'chats',
      dir: 'chats',
      insert: db.prepare('INSERT OR IGNORE INTO chats (path, conversation_id, turn, at, question, answer, model, synced_at, visitor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'),
      row: (c, path) => [path, c.conversationId, c.turn, c.at, c.question, c.answer, c.model || null, now, c.visitorId || null],
    },
    {
      label: 'open questions',
      table: 'questions',
      dir: 'questions',
      insert: db.prepare('INSERT OR IGNORE INTO questions (path, conversation_id, turn, visitor_id, at, question, answer, status, synced_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'),
      row: (q, path) => [path, q.conversationId, q.turn, q.visitorId || null, q.at, q.question, q.answer || null, q.status || 'open', now],
    },
  ];
  for (const k of kinds) {
    const known = new Set(db.prepare(`SELECT path FROM ${k.table}`).all().map((r) => r.path));
    const fresh = files(k.dir).filter((f) => !known.has(f.path));
    for (const f of fresh) k.insert.run(...k.row(await readFile(f.path), f.path));
    const total = db.prepare(`SELECT COUNT(*) AS n FROM ${k.table}`).get().n;
    console.log(`${String(fresh.length).padStart(4)} new ${k.label.padEnd(17)} ${total} total`);
  }
  const unsent = db.prepare('SELECT COUNT(*) AS n FROM messages WHERE smtp_sent = 0').get().n;
  if (unsent) console.log(`\n⚠ ${unsent} contact message(s) were NOT emailed (SMTP failed). Read them with: npm run data:messages`);
  const open = db.prepare("SELECT COUNT(*) AS n FROM questions WHERE status = 'open'").get().n;
  if (open) console.log(`\n${open} open question(s) for you. See them with: npm run data:questions`);
  console.log(`\nSaved to ${DB_PATH}`);
}

// ── display helpers ─────────────────────────────────────────────────────────
const clean = (t) => (t || '').replace(/\[\[[^\]]*\]\]/g, '').replace(/\s+/g, ' ').trim();
const short = (t, n = 60) => {
  const s = clean(t);
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
};
const when = (iso) => (iso || '').replace('T', ' ').slice(0, 16);
const empty = (what) => console.log(`No ${what} yet. Run "npm run data:sync" first.`);
const section = (title) => console.log(`\n${title}\n${'─'.repeat(title.length)}`);

function messagesTable(limit) {
  const rows = db.prepare('SELECT received_at, name, email, subject, message, verified, smtp_sent FROM messages ORDER BY received_at DESC LIMIT ?').all(limit);
  if (!rows.length) return empty('contact messages');
  console.table(
    rows.map((r) => ({
      when: when(r.received_at),
      name: short(r.name, 22),
      email: r.email,
      verified: r.verified ? 'yes' : 'no',
      emailed: r.smtp_sent ? 'yes' : 'NO',
      subject: short(r.subject || '-', 26),
      message: short(r.message, 48),
    })),
  );
}

function messagesFull(limit) {
  const rows = db.prepare('SELECT received_at, name, email, subject, message, verified, smtp_sent FROM messages ORDER BY received_at DESC LIMIT ?').all(limit);
  if (!rows.length) return empty('contact messages');
  for (const r of rows) {
    console.log('─'.repeat(72));
    console.log(`${when(r.received_at)}  ${r.name} <${r.email}>${r.verified ? '  ✓ verified' : ''}${r.smtp_sent ? '' : '  ⚠ not emailed'}`);
    if (r.subject) console.log(`Subject: ${r.subject}`);
    console.log(`\n${r.message}\n`);
  }
}

function conversationsTable(limit) {
  const rows = db
    .prepare(
      `SELECT conversation_id, MIN(at) AS started, MAX(at) AS last, COUNT(*) AS turns, MAX(visitor_id) AS visitor,
              (SELECT question FROM chats c2 WHERE c2.conversation_id = c.conversation_id ORDER BY turn LIMIT 1) AS first_question
         FROM chats c GROUP BY conversation_id ORDER BY last DESC LIMIT ?`,
    )
    .all(limit);
  if (!rows.length) return empty('AI chats');
  console.table(
    rows.map((r) => ({
      conversation: r.conversation_id,
      started: when(r.started),
      turns: r.turns,
      visitor: r.visitor ? r.visitor.slice(0, 10) : '-',
      'first question': short(r.first_question, 56),
    })),
  );
  console.log('Read one in full: npm run data:chats -- <conversation>');
}

function conversation(id) {
  const rows = db.prepare('SELECT turn, at, question, answer, model FROM chats WHERE conversation_id = ? ORDER BY turn').all(id);
  if (!rows.length) return console.log(`No conversation "${id}". List them with: npm run data:chats`);
  console.log(`Conversation ${id} · ${rows.length} turn(s) · started ${when(rows[0].at)}`);
  for (const r of rows) {
    console.log('─'.repeat(72));
    console.log(`#${r.turn}  ${when(r.at)}  (${r.model || 'model?'})`);
    console.log(`Visitor: ${r.question}`);
    console.log(`AI:      ${clean(r.answer)}`);
  }
}

function questionsTable(limit = 50) {
  const rows = db
    .prepare("SELECT rowid AS id, at, status, question, conversation_id FROM questions ORDER BY status = 'open' DESC, at DESC LIMIT ?")
    .all(limit);
  if (!rows.length) return console.log('No unanswered questions.');
  console.table(rows.map((r) => ({ id: r.id, when: when(r.at), status: r.status, question: short(r.question, 70), conversation: r.conversation_id })));
  console.log('Mark one as handled: npm run data:answered -- <id>');
}

function markAnswered(id) {
  const r = db.prepare("UPDATE questions SET status = 'answered', handled_at = ? WHERE rowid = ?").run(new Date().toISOString(), Number(id));
  console.log(r.changes ? `Question ${id} marked as answered (in your local database).` : `No question with id ${id}.`);
}

function report() {
  const n = (sql) => db.prepare(sql).get().n;
  const since = new Date(Date.now() - 7 * 864e5).toISOString();
  section('Summary');
  console.table([
    { what: 'Contact messages', total: n('SELECT COUNT(*) AS n FROM messages'), 'last 7 days': n(`SELECT COUNT(*) AS n FROM messages WHERE received_at >= '${since}'`) },
    { what: 'AI conversations', total: n('SELECT COUNT(DISTINCT conversation_id) AS n FROM chats'), 'last 7 days': n(`SELECT COUNT(DISTINCT conversation_id) AS n FROM chats WHERE at >= '${since}'`) },
    { what: 'AI questions asked', total: n('SELECT COUNT(*) AS n FROM chats'), 'last 7 days': n(`SELECT COUNT(*) AS n FROM chats WHERE at >= '${since}'`) },
    { what: 'Unanswered (open)', total: n("SELECT COUNT(*) AS n FROM questions WHERE status = 'open'"), 'last 7 days': n(`SELECT COUNT(*) AS n FROM questions WHERE status = 'open' AND at >= '${since}'`) },
  ]);
  const popular = db
    .prepare('SELECT lower(trim(question)) AS q, COUNT(*) AS times FROM chats GROUP BY q HAVING times > 1 ORDER BY times DESC LIMIT 8')
    .all();
  if (popular.length) {
    section('Most asked AI questions');
    console.table(popular.map((r) => ({ question: short(r.q, 70), times: r.times })));
  }
  section('Latest contact messages');
  messagesTable(10);
  section('Latest AI conversations');
  conversationsTable(10);
  section('Questions the AI could not answer');
  questionsTable(10);
}

// ── export for PostgreSQL ───────────────────────────────────────────────────
const PG_SCHEMA = `-- Portfolio data, exported from the local SQLite database.
-- Import into PostgreSQL with:  psql "$DATABASE_URL" -f this-file.sql
-- Safe to run again: existing rows are skipped (ON CONFLICT DO NOTHING).

CREATE TABLE IF NOT EXISTS contact_messages (
  id          text PRIMARY KEY,
  received_at timestamptz NOT NULL,
  name        text NOT NULL,
  email       text NOT NULL,
  subject     text,
  message     text NOT NULL,
  verified    boolean NOT NULL DEFAULT false,
  emailed     boolean NOT NULL DEFAULT false,
  email_error text,
  user_agent  text,
  source_path text UNIQUE
);
CREATE INDEX IF NOT EXISTS contact_messages_received ON contact_messages (received_at DESC);

CREATE TABLE IF NOT EXISTS chat_turns (
  conversation_id text NOT NULL,
  turn            integer NOT NULL,
  visitor_id      text,
  asked_at        timestamptz NOT NULL,
  question        text NOT NULL,
  answer          text NOT NULL,
  model           text,
  source_path     text UNIQUE,
  PRIMARY KEY (conversation_id, turn)
);
CREATE INDEX IF NOT EXISTS chat_turns_asked ON chat_turns (asked_at DESC);

CREATE TABLE IF NOT EXISTS open_questions (
  conversation_id text NOT NULL,
  turn            integer NOT NULL,
  visitor_id      text,
  asked_at        timestamptz NOT NULL,
  question        text NOT NULL,
  ai_reply        text,
  status          text NOT NULL DEFAULT 'open',
  handled_at      timestamptz,
  source_path     text UNIQUE,
  PRIMARY KEY (conversation_id, turn)
);
`;

const sqlVal = (v) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return String(v);
  return `'${String(v).replace(/'/g, "''")}'`;
};
const csvVal = (v) => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function exportAll() {
  const tables = [
    {
      name: 'contact_messages',
      cols: ['id', 'received_at', 'name', 'email', 'subject', 'message', 'verified', 'emailed', 'email_error', 'user_agent', 'source_path'],
      rows: db.prepare('SELECT * FROM messages ORDER BY received_at').all().map((r) => [r.id, r.received_at, r.name, r.email, r.subject, r.message, !!r.verified, !!r.smtp_sent, r.smtp_error, r.user_agent, r.path]),
    },
    {
      name: 'chat_turns',
      cols: ['conversation_id', 'turn', 'visitor_id', 'asked_at', 'question', 'answer', 'model', 'source_path'],
      rows: db.prepare('SELECT * FROM chats ORDER BY at').all().map((r) => [r.conversation_id, r.turn, r.visitor_id, r.at, r.question, r.answer, r.model, r.path]),
    },
    {
      name: 'open_questions',
      cols: ['conversation_id', 'turn', 'visitor_id', 'asked_at', 'question', 'ai_reply', 'status', 'handled_at', 'source_path'],
      rows: db.prepare('SELECT * FROM questions ORDER BY at').all().map((r) => [r.conversation_id, r.turn, r.visitor_id, r.at, r.question, r.answer, r.status, r.handled_at, r.path]),
    },
  ];
  const dir = process.env.DATA_EXPORT_DIR || 'data/export';
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  let sql = PG_SCHEMA;
  for (const t of tables) {
    sql += `\n-- ${t.name}: ${t.rows.length} row(s)\n`;
    for (const row of t.rows) sql += `INSERT INTO ${t.name} (${t.cols.join(', ')}) VALUES (${row.map(sqlVal).join(', ')}) ON CONFLICT DO NOTHING;\n`;
    writeFileSync(`${dir}/${t.name}.csv`, '﻿' + [t.cols.join(','), ...t.rows.map((r) => r.map(csvVal).join(','))].join('\r\n') + '\r\n');
  }
  writeFileSync(`${dir}/portfolio-${stamp}.sql`, sql);
  console.table(tables.map((t) => ({ table: t.name, rows: t.rows.length, csv: `${dir}/${t.name}.csv` })));
  console.log(`PostgreSQL file: ${dir}/portfolio-${stamp}.sql`);
  console.log('Import it with:  psql "$DATABASE_URL" -f ' + `${dir}/portfolio-${stamp}.sql`);
}

// ── commands ────────────────────────────────────────────────────────────────
const [cmd = 'report', arg] = process.argv.slice(2);
const commands = {
  sync,
  report,
  messages: () => (arg === 'full' ? messagesFull(20) : messagesTable(Number(arg) || 20)),
  'messages-full': () => messagesFull(Number(arg) || 20),
  chats: () => (arg ? conversation(arg) : conversationsTable(30)),
  questions: () => questionsTable(Number(arg) || 50),
  answered: () => (arg ? markAnswered(arg) : console.log('Which one? npm run data:answered -- <id>  (ids are in npm run data:questions)')),
  export: exportAll,
};
if (!commands[cmd]) {
  console.error(`Unknown command "${cmd}". Use one of: ${Object.keys(commands).join(', ')}`);
  process.exit(1);
}
await commands[cmd]();
db.close();
