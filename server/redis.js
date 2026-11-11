// Tiny client for Upstash Redis (REST), used for visit analytics and to
// restore a visitor's chat. No SDK: one fetch per batch of commands.
//
// Env: UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN, or the KV_REST_API_URL
// + KV_REST_API_TOKEN names Vercel adds when Upstash is installed from its
// Marketplace, or an Upstash REDIS_URL / KV_URL. Without them every call is skipped (returns null).

/** REST URL + token from whichever variables are set. */
function creds(env) {
  let url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  let token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  // Only a connection URL (rediss://default:<token>@<host>.upstash.io:6379)?
  // For Upstash its password is also the REST token.
  if ((!url || !token) && (env.REDIS_URL || env.KV_URL)) {
    try {
      const u = new URL(env.REDIS_URL || env.KV_URL);
      if (u.hostname.endsWith('.upstash.io') && u.password) {
        url = `https://${u.hostname}`;
        token = decodeURIComponent(u.password);
      }
    } catch {
      /* not a URL */
    }
  }
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}

export function redisConfigured(env = process.env) {
  return Boolean(creds(env));
}

/** Runs several commands in one request. Returns their results, or null if Redis isn't set up. */
export async function redis(env, commands) {
  const c = creds(env);
  if (!c) return null;
  const res = await fetch(`${c.url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${c.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands.map((cmd) => cmd.map(String))),
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
