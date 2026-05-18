/**
 * Tests for `api/health.js` — the Vercel-style serverless health
 * endpoint.
 *
 * The function is invoked the same way Vercel invokes it: a `req`
 * with `method` plus a minimal `res` shim that captures status,
 * headers, and body. We don't spin up an HTTP server — we just call
 * the exported function directly.
 *
 * The repo is `"type": "commonjs"` (the runtime needs CJS for the
 * Vercel functions runtime). Vitest 4 only loads ESM, so this test
 * file uses `.mjs` and `createRequire` to import the CJS handler
 * exactly the way Vercel does at request time.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const handler = require('./health.js');

/**
 * Build a minimal Vercel-style res mock. Captures the final status
 * code, set headers, and body so assertions can inspect everything
 * the route actually emitted.
 */
function makeRes() {
  const headers = {};
  let statusCode = 0;
  let body = '';
  return {
    headers,
    get statusCode() { return statusCode; },
    get body() { return body; },
    setHeader(name, value) { headers[name.toLowerCase()] = value; },
    status(code) { statusCode = code; return this; },
    json(obj) { body = JSON.stringify(obj); return this; },
    end(data) { if (data !== undefined) body = data; return this; },
  };
}

const ENV_KEYS = ['CRM_PUBLIC_API', 'CRM_LEAD_INTAKE_SECRET', 'VERCEL_GIT_COMMIT_SHA'];
let saved;

beforeEach(() => {
  saved = {};
  for (const k of ENV_KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  vi.restoreAllMocks();
});

describe('GET /api/health (studios)', () => {
  it('returns 200 + ok=true with no env configured', async () => {
    const req = { method: 'GET' };
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    const parsed = JSON.parse(res.body);
    expect(parsed.ok).toBe(true);
    expect(parsed.service).toBe('raineylagunastudios');
    expect(parsed.version).toBe('unknown');
    expect(parsed.checks.crm).toEqual({ ok: true, required: false, configured: false });
    expect(parsed.checks.crm_configured.configured).toBe(false);
  });

  it('sets cache-control: no-store and x-robots-tag: noindex', async () => {
    // Health endpoints must never be cached by edge / CDN, and must
    // never be indexed. A regression here would cause an uptime monitor
    // to read stale "ok" responses minutes after a real outage.
    const req = { method: 'GET' };
    const res = makeRes();
    await handler(req, res);
    expect(res.headers['cache-control']).toMatch(/no-store/);
    expect(res.headers['x-robots-tag']).toMatch(/noindex/);
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('reports configured=true and probes when CRM_PUBLIC_API is set', async () => {
    process.env.CRM_PUBLIC_API = 'https://crm.example.test';
    process.env.CRM_LEAD_INTAKE_SECRET = 'shhh';
    // Mock fetch to a 200 so the probe succeeds without network.
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    const req = { method: 'GET' };
    const res = makeRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    const parsed = JSON.parse(res.body);
    expect(parsed.checks.crm_configured.configured).toBe(true);
    expect(parsed.checks.crm_secret_configured.configured).toBe(true);
    expect(parsed.checks.crm.ok).toBe(true);
    expect(parsed.checks.crm.configured).toBe(true);

    // Verify we never sent the secret on the probe.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl, calledOpts] = fetchMock.mock.calls[0];
    expect(calledUrl).toBe('https://crm.example.test/api/health');
    const sentHeaders = (calledOpts && calledOpts.headers) || {};
    const headerNames = Object.keys(sentHeaders).map((h) => h.toLowerCase());
    expect(headerNames).not.toContain('authorization');
    expect(headerNames).not.toContain('x-lead-intake-secret');
  });

  it('reports crm.ok=false when the probe returns a non-2xx', async () => {
    process.env.CRM_PUBLIC_API = 'https://crm.example.test';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 502 }));

    const req = { method: 'GET' };
    const res = makeRes();
    await handler(req, res);

    // The crm probe is not flagged required, so the overall ok stays
    // true; only the inner check reflects the outage.
    expect(res.statusCode).toBe(200);
    const parsed = JSON.parse(res.body);
    expect(parsed.ok).toBe(true);
    expect(parsed.checks.crm.ok).toBe(false);
    expect(parsed.checks.crm.error).toMatch(/502/);
  });

  it('rejects non-GET methods with 405', async () => {
    // Defensive: the route does no work for POST/PUT/etc., so reject
    // them early with the canonical 405 + Allow header.
    const req = { method: 'POST' };
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
    expect(res.headers['allow']).toBe('GET, HEAD');
  });

  it('echoes VERCEL_GIT_COMMIT_SHA into version when set', async () => {
    process.env.VERCEL_GIT_COMMIT_SHA = 'cafe1234';
    const req = { method: 'GET' };
    const res = makeRes();
    await handler(req, res);
    const parsed = JSON.parse(res.body);
    expect(parsed.version).toBe('cafe1234');
  });
});
