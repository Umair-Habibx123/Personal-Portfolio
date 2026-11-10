// Vercel serverless function: POST /api/contact
import { handleContact } from '../server/contact.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress;
  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body;
  const { status, json } = await handleContact(body, { ip, userAgent: req.headers['user-agent'] });
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(json);
}

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
