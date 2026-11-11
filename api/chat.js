// Vercel serverless function
//   POST /api/chat               ask a question (the answer streams back as plain text)
//   GET  /api/chat?visitor=<id>  the visitor's latest conversation
import { handleChat, handleChatHistory } from '../server/chat.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // the visitor's latest conversation, to reload the chat
    try {
      const out = await handleChatHistory(String(req.query?.visitor || ''));
      res.setHeader('Cache-Control', 'no-store');
      return res.status(out.status || 200).json(out);
    } catch (err) {
      console.error('[chat] history failed:', err.message);
      return res.status(500).json({ ok: false });
    }
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress;
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = null;
    }
  }
  await handleChat(body, { ip, userAgent: req.headers['user-agent'] }, {
    json: (status, obj) => {
      res.setHeader('Cache-Control', 'no-store');
      res.status(status).json(obj);
    },
    start: () => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('X-Accel-Buffering', 'no');
    },
    write: (text) => res.write(text),
    end: () => res.end(),
  });
}
