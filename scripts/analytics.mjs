// Private visit analytics for the live site (reads Redis using .env).
//
//   npm run analytics            totals, countries, sources, devices, last 14 days
//   npm run analytics -- recent  the latest 30 visits (with city)
//   npm run analytics -- visitor <id>   one visitor's details and their latest chat
import { redis, redisConfigured } from '../server/redis.js';

try {
  process.loadEnvFile?.('.env');
} catch {
  /* no .env */
}
const env = process.env;
if (!redisConfigured(env)) {
  console.error('Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL / KV_REST_API_TOKEN) to .env first.');
  process.exit(1);
}

const pairs = (flat = []) => {
  const out = [];
  for (let i = 0; i < flat.length; i += 2) out.push([flat[i], Number(flat[i + 1])]);
  return out;
};
let names;
const country = (c) => {
  try {
    names ??= new Intl.DisplayNames(['en'], { type: 'region' });
    return c === 'XX' ? 'Unknown' : names.of(c);
  } catch {
    return c;
  }
};
const table = (title, rows, label = (k) => k) => {
  console.log(`\n${title}`);
  if (!rows.length) return console.log('  (none yet)');
  const total = rows.reduce((a, [, n]) => a + n, 0);
  for (const [k, n] of rows) console.log(`  ${String(label(k)).padEnd(26)} ${String(n).padStart(6)}  ${((n / total) * 100).toFixed(0).padStart(3)}%`);
};

const [cmd, arg] = process.argv.slice(2);

if (cmd === 'recent') {
  const [log] = await redis(env, [['LRANGE', 'pf:log', 0, 29]]);
  for (const line of (log || []).reverse()) {
    const v = JSON.parse(line);
    const where = [v.city, v.region, country(v.country)].filter(Boolean).join(', ');
    console.log(`${v.at.replace('T', ' ').slice(0, 16)}  ${where.padEnd(34)} ${v.device.padEnd(8)} ${v.browser.padEnd(10)} ${(v.referrer || v.source).padEnd(18)} ${v.visitorId}`);
  }
} else if (cmd === 'visitor') {
  const [info, chat] = await redis(env, [
    ['HGETALL', `pf:visitor:${arg}`],
    ['GET', `pf:chat:${arg}`],
  ]);
  console.log(Object.fromEntries(pairs(info).map(([k], i) => [k, info[i * 2 + 1]])));
  if (chat) {
    const c = JSON.parse(chat);
    console.log(`\nLatest chat (${c.updatedAt}):`);
    for (const m of c.messages) console.log(`${m.role === 'user' ? 'Q' : 'A'}: ${m.text.replace(/\[\[[^\]]*\]\]/g, '').trim()}\n`);
  }
} else {
  const days = Array.from({ length: 14 }, (_, i) => new Date(Date.now() - i * 864e5).toISOString().slice(0, 10)).reverse();
  const r = await redis(env, [
    ['GET', 'pf:visits'],
    ['PFCOUNT', 'pf:uniq'],
    ['GET', 'pf:since'],
    ['ZREVRANGE', 'pf:countries', 0, 19, 'WITHSCORES'],
    ['ZREVRANGE', 'pf:sources', 0, -1, 'WITHSCORES'],
    ['ZREVRANGE', 'pf:referrers', 0, 14, 'WITHSCORES'],
    ['ZREVRANGE', 'pf:devices', 0, -1, 'WITHSCORES'],
    ['ZREVRANGE', 'pf:browsers', 0, -1, 'WITHSCORES'],
    ['ZREVRANGE', 'pf:os', 0, -1, 'WITHSCORES'],
    ...days.flatMap((d) => [
      ['HGET', `pf:day:${d}`, 'visits'],
      ['PFCOUNT', `pf:dayu:${d}`],
    ]),
  ]);
  console.log(`Visits ${r[0] || 0} · unique visitors ${r[1] || 0} · since ${r[2] || '-'}`);
  table('Countries', pairs(r[3]), country);
  table('Sources', pairs(r[4]));
  table('Referrers', pairs(r[5]));
  table('Devices', pairs(r[6]));
  table('Browsers', pairs(r[7]));
  table('Operating systems', pairs(r[8]));
  console.log('\nLast 14 days            visits  visitors');
  days.forEach((d, i) => {
    const v = Number(r[9 + i * 2] || 0);
    console.log(`  ${d}            ${String(v).padStart(6)}  ${String(r[10 + i * 2] || 0).padStart(8)}  ${'#'.repeat(Math.min(v, 40))}`);
  });
}
