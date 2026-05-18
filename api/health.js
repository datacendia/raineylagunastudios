/**
 * GET /api/health — liveness + readiness probe for raineylagunastudios.
 *
 * The studios site is a static HTML deployment on Vercel; the only
 * server-side code is this directory's set of small functions. A
 * dedicated health endpoint gives the uptime monitor a single URL to
 * watch (UptimeRobot, BetterStack, etc.) and matches the universal
 * shape used by `raineylaguna-next`, `vigia`, and `raineylaguna-crm`:
 *
 *     {
 *       ok: boolean,
 *       ts: ISO-8601 string,
 *       service: "raineylagunastudios",
 *       version: string | "unknown",
 *       uptimeSeconds: number,
 *       checks: { [name]: { ok, required, configured?, durationMs?, error? } }
 *     }
 *
 * What we probe:
 *   - process responsive: trivially true if this code runs
 *   - CRM bridge reachable (if CRM_PUBLIC_API is configured): HEAD/GET
 *     against the CRM's own /api/health with a 1s budget. Never sends
 *     the shared secret; never POSTs.
 *
 * What we deliberately don't probe:
 *   - Resend, Culqi, Twilio: this site doesn't call them directly.
 *     Their health is the CRM/vigia services' concern.
 *   - The static asset build: Vercel's deploy succeeds or fails before
 *     this function is even reachable.
 *
 * Security:
 *   - No request inputs are reflected back.
 *   - No secrets are echoed; only `configured: bool` presence.
 *   - Endpoint is unauthenticated by design (uptime monitors require
 *     anonymous access).
 *   - `Cache-Control: no-store` so a stale "ok" is never served.
 *   - `X-Robots-Tag: noindex, nofollow` so search engines don't index
 *     the probe URL.
 *
 * Status code: 200 when `ok === true`, otherwise 503.
 */

'use strict';

/**
 * Run an async probe with a hard timeout. Coerces any throw or
 * timeout into `{ ok: false, error }` so the health endpoint never
 * itself fails.
 */
async function probe(required, fn, timeoutMs) {
  const start = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs || 1000);
  try {
    await fn(ctrl.signal);
    return { ok: true, required: required, durationMs: Date.now() - start };
  } catch (err) {
    // Strip stacks; truncate. Never surface arbitrary upstream text in
    // case it ever contained credentials.
    const name = (err && err.name) || 'Error';
    const message = err && err.message ? String(err.message).slice(0, 120) : '';
    return {
      ok: false,
      required: required,
      durationMs: Date.now() - start,
      error: message ? name + ': ' + message : name,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Optional CRM bridge probe. Hits the CRM's own /api/health (also
 * unauthenticated) so a misconfigured `CRM_PUBLIC_API` env (typo, dead
 * URL, expired DNS) is surfaced fast without any side-effects.
 */
async function pingCrm(signal) {
  const base = process.env.CRM_PUBLIC_API;
  if (!base) throw new Error('CRM_PUBLIC_API not set');
  // Resolve relative to the CRM origin; trim trailing slash to avoid
  // accidental `//api/health`.
  const trimmed = base.replace(/\/+$/, '');
  const res = await fetch(trimmed + '/api/health', {
    method: 'GET',
    signal: signal,
    cache: 'no-store',
  });
  // 200/204 acceptable; 405 indicates the route exists but disallows
  // GET (which we wouldn't expect for /api/health, but treat as "alive"
  // anyway since reachability is the point).
  if (!res.ok && res.status !== 405) {
    throw new Error('CRM /api/health responded ' + res.status);
  }
}

module.exports = async function handler(req, res) {
  // Only GET is meaningful; reject everything else explicitly so we
  // don't waste a probe budget on accidental POSTs.
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('allow', 'GET, HEAD');
    res.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }

  const checks = {};

  // Configured-presence checks (cheap; synchronous).
  checks.crm_configured = {
    ok: true,
    required: false,
    configured: Boolean(process.env.CRM_PUBLIC_API),
  };
  checks.crm_secret_configured = {
    ok: true,
    required: false,
    configured: Boolean(process.env.CRM_LEAD_INTAKE_SECRET),
  };

  // Optional async probe.
  if (process.env.CRM_PUBLIC_API) {
    const result = await probe(false, pingCrm, 1000);
    // Mark as configured since we actually attempted the probe.
    result.configured = true;
    checks.crm = result;
  } else {
    checks.crm = { ok: true, required: false, configured: false };
  }

  // Overall ok: every required check must pass. None are flagged
  // required for the studios site (it degrades gracefully when the CRM
  // is offline — the form falls back to a mailto: link). Structure is
  // here so flipping a single boolean is the only change needed.
  const ok = Object.keys(checks).every(function (k) {
    return !checks[k].required || checks[k].ok;
  });

  const body = {
    ok: ok,
    ts: new Date().toISOString(),
    service: 'raineylagunastudios',
    // Vercel injects VERCEL_GIT_COMMIT_SHA on every deployment.
    version: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    uptimeSeconds: Math.round(process.uptime()),
    checks: checks,
  };

  res.setHeader('cache-control', 'no-store, max-age=0');
  res.setHeader('x-robots-tag', 'noindex, nofollow');
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.status(ok ? 200 : 503).end(JSON.stringify(body, null, 2));
};
