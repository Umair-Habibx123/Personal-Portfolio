// Contact form backend, shared by the Vercel function (api/contact.js) and the
// local dev server (vite.config.js).
//
// Two steps, so bots and fake addresses never reach you:
//
//   1. "start": the visitor submits the form. We email THEM a 6-digit code and
//      hand back a signed token holding the pending message. Nothing is
//      delivered yet.
//   2. "verify": they type the code. If it matches, the message is delivered:
//        - saved as its own JSON file in your PRIVATE GitHub repo
//          (`npm run messages:sync` turns those into data/messages.db), and
//        - emailed to you over SMTP.
//      The visitor sees success if at least one of the two worked.
//
// No database is needed: the token is signed (HMAC), so it can't be forged or
// edited, and it expires after 10 minutes. The GitHub file name comes from the
// token, so submitting the same token twice can't create a duplicate.
// ("resend" issues a fresh code for the same pending message.)

import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { renderCodeEmail, renderEmail } from './email-template.js';

const LIMITS = { name: 100, email: 200, subject: 150, message: 5000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_FILL_MS = 3000; // faster than this is a bot
const CODE_TTL_MS = 10 * 60 * 1000;
const WINDOW_MS = 10 * 60 * 1000;
// Per server instance: a light brake against abuse, not a wall.
const LIMIT = { start: 5, verify: 12, resend: 3, perEmail: 3, perToken: 6 };
const hits = new Map();

const clean = (v, max) =>
  String(v ?? '')
    .replace(/\r\n?/g, '\n')
    .trim()
    .slice(0, max);
const oneLine = (v) => v.replace(/[\r\n\t]+/g, ' ');
const b64u = (buf) => Buffer.from(buf).toString('base64url');
const reply = (status, json) => ({ status, json });

/** true when `key` has been used more than `max` times in the last 10 minutes */
function limited(key, max) {
  if (!key) return false;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > max;
}

function validate(body) {
  const msg = {
    name: oneLine(clean(body.name, LIMITS.name)),
    email: oneLine(clean(body.email, LIMITS.email)).toLowerCase(),
    subject: oneLine(clean(body.subject, LIMITS.subject)),
    message: clean(body.message, LIMITS.message),
  };
  if (msg.name.length < 2) return { error: 'Please enter your name.' };
  if (!EMAIL_RE.test(msg.email)) return { error: 'Please enter a valid email address.' };
  if (msg.message.length < 10) return { error: 'Your message is too short.' };
  return { msg };
}

// ── signing ────────────────────────────────────────────────────────────────
// CONTACT_SECRET is best; without it, a key is derived from secrets the site
// already has, so verification still works.
function signingKey(env) {
  const base = env.CONTACT_SECRET || `${env.SMTP_PASS ?? ''}|${env.GITHUB_TOKEN ?? ''}`;
  if (base.length < 16) throw new Error('No CONTACT_SECRET (or SMTP/GitHub secrets) to sign with');
  return crypto.createHash('sha256').update(`contact-form:${base}`).digest();
}
const hmac = (key, text) => crypto.createHmac('sha256', key).update(text).digest();
const sameBytes = (a, b) => a.length === b.length && crypto.timingSafeEqual(a, b);

function issueToken(pending, key) {
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  const payload = { ...pending, exp: Date.now() + CODE_TTL_MS, codeHash: b64u(hmac(key, `${pending.id}:${code}`)) };
  const body = b64u(JSON.stringify(payload));
  return { code, token: `${body}.${b64u(hmac(key, body))}`, expiresIn: CODE_TTL_MS / 1000 };
}

function readToken(token, key) {
  const [body, sig] = String(token ?? '').split('.');
  if (!body || !sig || !sameBytes(Buffer.from(sig, 'base64url'), hmac(key, body))) return null;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

// ── delivery ───────────────────────────────────────────────────────────────
function transport(env) {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) throw new Error('SMTP is not configured');
  const port = Number(env.SMTP_PORT || 465);
  return nodemailer.createTransport({
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
}
const siteUrl = (env) => env.SITE_URL || 'https://umairhabib.vercel.app';
const from = (env, name) => ({ name, address: env.MAIL_FROM || env.SMTP_USER });

/** The verification code, to the VISITOR. It contains nothing they typed except the code. */
async function sendCode(email, code, env) {
  await transport(env).sendMail({
    from: from(env, 'Umair Habib · Portfolio'),
    to: email,
    subject: `${code} is your verification code`,
    text: `Your code is ${code}\n\nEnter it on the contact form to send your message. It expires in 10 minutes.\nIf you didn't use the contact form on ${siteUrl(env)}, ignore this email.`,
    html: renderCodeEmail({ code, siteUrl: siteUrl(env) }),
  });
}

/** The verified message, to YOU. */
async function sendToOwner(record, env) {
  if (!env.MAIL_TO) throw new Error('MAIL_TO is not set');
  const text = [
    `Name:     ${record.name}`,
    `Email:    ${record.email} (verified)`,
    `Subject:  ${record.subject || '-'}`,
    `Sent:     ${record.receivedAt}`,
    `ID:       ${record.id}`,
    '',
    record.message,
  ].join('\n');
  await transport(env).sendMail({
    from: from(env, 'Portfolio contact form'),
    to: env.MAIL_TO,
    replyTo: { name: record.name, address: record.email },
    subject: `Portfolio: ${record.subject || 'New message'} (from ${record.name})`,
    text,
    html: renderEmail(record, { siteUrl: siteUrl(env) }),
  });
}

/** Saves to the private repo. Returns "saved" or "duplicate" (that file already exists). */
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
  if (res.status === 422) return 'duplicate'; // same token used twice
  if (!res.ok) throw new Error(`GitHub responded ${res.status}`);
  return 'saved';
}

// ── steps ──────────────────────────────────────────────────────────────────
async function start(body, { ip, userAgent, env }) {
  // Bots: answer "ok" so they move on, but send nothing.
  const tooFast = Number(body.startedAt) && Date.now() - Number(body.startedAt) < MIN_FILL_MS;
  if (body.hpx || tooFast) {
    console.warn(`[contact] dropped as a bot (${body.hpx ? 'hidden field filled' : 'sent too fast'})`);
    return reply(200, { ok: true, step: 'verify', token: null, expiresIn: 600 });
  }

  if (limited(`start:${ip}`, LIMIT.start)) return reply(429, { ok: false, error: 'Too many messages. Please try again in a few minutes.' });
  const { msg, error } = validate(body);
  if (error) return reply(400, { ok: false, error });
  if (limited(`email:${msg.email}`, LIMIT.perEmail)) {
    return reply(429, { ok: false, error: 'Several codes were already sent to this address. Please wait a few minutes.' });
  }

  const pending = {
    id: crypto.randomBytes(4).toString('hex'),
    receivedAt: new Date().toISOString(),
    ...msg,
    userAgent: clean(userAgent, 200) || null,
  };
  const key = signingKey(env);
  const { code, token, expiresIn } = issueToken(pending, key);
  try {
    await sendCode(msg.email, code, env);
  } catch (err) {
    console.error(`[contact ${pending.id}] verification email failed:`, err.message);
    return reply(502, { ok: false, error: "I couldn't send a verification code to that address right now." });
  }
  return reply(200, { ok: true, step: 'verify', token, expiresIn, email: msg.email });
}

async function resend(body, { ip, env }) {
  if (limited(`resend:${ip}`, LIMIT.resend)) return reply(429, { ok: false, error: 'Please wait a few minutes before asking for another code.' });
  const key = signingKey(env);
  const old = readToken(body.token, key);
  if (!old) return reply(400, { ok: false, error: 'This form has expired. Please send your message again.' });
  if (limited(`email:${old.email}`, LIMIT.perEmail)) return reply(429, { ok: false, error: 'Please wait a few minutes before asking for another code.' });
  const { exp, codeHash, ...pending } = old; // eslint-disable-line no-unused-vars
  const { code, token, expiresIn } = issueToken(pending, key);
  try {
    await sendCode(pending.email, code, env);
  } catch (err) {
    console.error(`[contact ${pending.id}] resend failed:`, err.message);
    return reply(502, { ok: false, error: "I couldn't send a new code right now." });
  }
  return reply(200, { ok: true, step: 'verify', token, expiresIn, email: pending.email });
}

async function verify(body, { ip, env }) {
  if (limited(`verify:${ip}`, LIMIT.verify)) return reply(429, { ok: false, error: 'Too many attempts. Please wait a few minutes.' });
  const key = signingKey(env);
  const pending = readToken(body.token, key);
  if (!pending) return reply(400, { ok: false, error: 'This form has expired. Please send your message again.' });
  if (Date.now() > pending.exp) return reply(400, { ok: false, error: 'That code has expired. Ask for a new one.', expired: true });
  if (limited(`token:${pending.id}`, LIMIT.perToken)) return reply(429, { ok: false, error: 'Too many wrong codes. Ask for a new one.', expired: true });

  const code = String(body.code ?? '').replace(/\D/g, '');
  if (code.length !== 6 || !sameBytes(Buffer.from(pending.codeHash, 'base64url'), hmac(key, `${pending.id}:${code}`))) {
    return reply(400, { ok: false, error: "That code isn't right. Check the email and try again." });
  }

  const { exp, codeHash, ...msg } = pending; // eslint-disable-line no-unused-vars
  const record = { ...msg, verified: true, verifiedAt: new Date().toISOString(), smtp: { sent: false, error: null } };

  // Save first: if this exact message was already saved, it was delivered before.
  let saved = false;
  try {
    if ((await saveToGitHub(record, env)) === 'duplicate') return reply(200, { ok: true, id: record.id });
    saved = true;
  } catch (err) {
    console.error(`[contact ${record.id}] GitHub backup failed:`, err.message);
  }

  try {
    await sendToOwner(record, env);
    record.smtp.sent = true;
  } catch (err) {
    record.smtp.error = String(err.message || err).slice(0, 300);
    console.error(`[contact ${record.id}] email to owner failed:`, record.smtp.error);
  }

  if (!record.smtp.sent && !saved) {
    console.error(`[contact ${record.id}] NOT DELIVERED`, JSON.stringify(record)); // last resort: in the logs
    return reply(502, { ok: false, error: "Sorry, I couldn't receive your message right now." });
  }
  return reply(200, { ok: true, id: record.id });
}

/**
 * @param {object} body  parsed JSON: { step: 'start' | 'verify' | 'resend', ... }
 * @param {{ ip?: string, userAgent?: string, env?: object }} meta
 * @returns {Promise<{ status: number, json: object }>}
 */
export async function handleContact(body, { ip, userAgent, env = process.env } = {}) {
  if (!body || typeof body !== 'object') return reply(400, { ok: false, error: 'Invalid request.' });
  try {
    if (body.step === 'verify') return await verify(body, { ip, env });
    if (body.step === 'resend') return await resend(body, { ip, env });
    return await start(body, { ip, userAgent, env });
  } catch (err) {
    console.error('[contact] failed:', err.message);
    return reply(500, { ok: false, error: "Sorry, the contact form isn't working right now." });
  }
}
