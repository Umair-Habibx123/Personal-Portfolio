// Vercel serverless function
//   POST /api/analytics  record a visit (sent by the page once per load)
//   GET  /api/analytics  public totals: visitors, visits, countries
import { handleStats, handleTrack } from '../server/analytics.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const stats = await handleStats();
      if (!stats) return res.status(404).json({ ok: false });
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
      return res.status(200).json({ ok: true, ...stats });
    } catch (err) {
      console.error('[analytics] stats failed:', err.message);
      return res.status(500).json({ ok: false });
    }
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end();
  }
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = null;
    }
  }
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress;
  try {
    await handleTrack(body, { headers: req.headers, ip });
  } catch (err) {
    console.error('[analytics] track failed:', err.message);
  }
  res.setHeader('Cache-Control', 'no-store');
  return res.status(204).end();
}
