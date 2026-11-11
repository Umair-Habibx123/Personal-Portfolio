// Tiny client for Upstash Redis (REST), used for visit analytics and to
// restore a visitor's chat. No SDK: one fetch per batch of commands.
//
// Env: UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN, or the KV_REST_API_URL
// + KV_REST_API_TOKEN names Vercel adds when Upstash is installed from its
// Marketplace. Without them every call is skipped (returns null).

export function redisConfigured(env = process.env) {
  return Boolean((env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL) && (env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN));
}

/** Runs several commands in one request. Returns their results, or null if Redis isn't set up. */
export async function redis(env, commands) {
  if (!redisConfigured(env)) return null;
  const url = (env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL).replace(/\/$/, '');
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands.map((c) => c.map(String))),
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`Redis responded ${res.status}`);
  const out = await res.json();
  return out.map((r) => {
    if (r.error) throw new Error(`Redis: ${r.error}`);
    return r.result;
  });
}

export const VISITOR_RE = /^[a-z0-9]{12,40}$/;
