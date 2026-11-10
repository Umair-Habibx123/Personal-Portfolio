// Contact form backend, shared by the Vercel function (api/contact.js) and the
// local dev server (vite.config.js).
//
// For every valid message it does two things, independently:
//   1. emails it to you over SMTP (nodemailer), and
//   2. saves it as its own JSON file in a PRIVATE GitHub repo, so nothing is
//      lost if SMTP fails. `npm run messages:sync` turns those files into a
//      local SQLite database (data/messages.db).
// The visitor sees success if at least one of the two worked.

import crypto from 'node:crypto';
import nodemailer from 'nodemailer';

const LIMITS = { name: 100, email: 200, subject: 150, message: 5000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_FILL_MS = 3000; // faster than this is a bot
const RATE = { windowMs: 10 * 60 * 1000, max: 5 };
const hits = new Map(); // ip -> timestamps (per server instance; a light brake, not a wall)

const clean = (v, max) =>
  String(v ?? '')
    .replace(/\r\n?/g, '\n')
    .trim()
    .slice(0, max);
const oneLine = (v) => v.replace(/[\r\n\t]+/g, ' ');

function rateLimited(ip) {
  if (!ip) return false;
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE.windowMs);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE.max;
}

function validate(body) {
  const msg = {
    name: oneLine(clean(body.name, LIMITS.name)),
    email: oneLine(clean(body.email, LIMITS.email)),
    subject: oneLine(clean(body.subject, LIMITS.subject)),
    message: clean(body.message, LIMITS.message),
  };
  if (msg.name.length < 2) return { error: 'Please enter your name.' };
  if (!EMAIL_RE.test(msg.email)) return { error: 'Please enter a valid email address.' };
  if (msg.message.length < 10) return { error: 'Your message is too short.' };
  return { msg };
}

async function sendEmail(record, env) {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.MAIL_TO) {
    throw new Error('SMTP is not configured');
  }
  const port = Number(env.SMTP_PORT || 465);
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: env.SMTP_SECURE ? env.SMTP_SECURE === 'true' : port === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  const subject = `Portfolio: ${record.subject || 'New message'} (from ${record.name})`;
  const text = [
    `Name:    ${record.name}`,
    `Email:   ${record.email}`,
    `Subject: ${record.subject || '-'}`,
    `Sent:    ${record.receivedAt}`,
    `ID:      ${record.id}`,
    '',
    record.message,
  ].join('\n');
  await transport.sendMail({
    from: { name: 'Portfolio contact form', address: env.MAIL_FROM || env.SMTP_USER },
    to: env.MAIL_TO,
    replyTo: { name: record.name, address: record.email },
    subject,
    text,
  });
}

async function saveToGitHub(record, env) {
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) throw new Error('GitHub backup is not configured');
  const [y, m] = record.receivedAt.slice(0, 7).split('-');
  const stamp = record.receivedAt.replace(/[:.]/g, '-');
  const path = `messages/${y}/${m}/${stamp}_${record.id}.json`;
  const res = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'portfolio-contact-form',
    },
    body: JSON.stringify({
      message: `New message ${record.id}`,
      content: Buffer.from(JSON.stringify(record, null, 2) + '\n').toString('base64'),
      branch: env.GITHUB_BRANCH || 'main',
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`GitHub responded ${res.status}`);
}

/**
 * @param {object} body  parsed JSON from the form
 * @param {{ ip?: string, userAgent?: string, env?: object }} meta
 * @returns {Promise<{ status: number, json: object }>}
 */
export async function handleContact(body, { ip, userAgent, env = process.env } = {}) {
  if (!body || typeof body !== 'object') return { status: 400, json: { ok: false, error: 'Invalid request.' } };

  // Bots: answer "ok" so they move on, but store nothing.
  const tooFast = Number(body.startedAt) && Date.now() - Number(body.startedAt) < MIN_FILL_MS;
  if (body.company || tooFast) return { status: 200, json: { ok: true } };

  if (rateLimited(ip)) {
    return { status: 429, json: { ok: false, error: 'Too many messages. Please try again in a few minutes.' } };
  }

  const { msg, error } = validate(body);
  if (error) return { status: 400, json: { ok: false, error } };

  const record = {
    id: crypto.randomBytes(4).toString('hex'),
    receivedAt: new Date().toISOString(),
    ...msg,
    userAgent: clean(userAgent, 200) || null,
    smtp: { sent: false, error: null },
  };

  try {
    await sendEmail(record, env);
    record.smtp.sent = true;
  } catch (err) {
    record.smtp.error = String(err.message || err).slice(0, 300);
    console.error(`[contact ${record.id}] email failed:`, record.smtp.error);
  }

  let saved = false;
  try {
    await saveToGitHub(record, env);
    saved = true;
  } catch (err) {
    console.error(`[contact ${record.id}] GitHub backup failed:`, err.message);
  }

  if (!record.smtp.sent && !saved) {
    // Last resort: the full message is in the server logs.
    console.error(`[contact ${record.id}] NOT DELIVERED`, JSON.stringify(record));
    return {
      status: 502,
      json: { ok: false, error: "Sorry, I couldn't receive your message right now." },
    };
  }
  return { status: 200, json: { ok: true, id: record.id } };
}
