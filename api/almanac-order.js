/**
 * POST /api/almanac-order
 *
 * Vercel serverless function that captures Lima Almanac preorders.
 *
 * Strategy: reuse the CRM lead-intake infra. Each order becomes a CRM lead
 * with niche="Almanac" so the operator triages and confirms Culqi cobro
 * from inside the CRM. This avoids running a second database here.
 *
 * Env:
 *   CRM_PUBLIC_API           https://crm.raineylaguna.com (or local for dev)
 *   CRM_LEAD_INTAKE_SECRET   shared secret with CRM /api/leads/public
 *
 * Stub mode: if either env var is missing, the function logs the order and
 * returns success so the page works in preview/dev. The operator can read
 * Vercel logs and append to data/almanac-orders.json manually.
 */

const RATE = new Map();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 4;

function rateLimited(ip) {
  const now = Date.now();
  const r = RATE.get(ip);
  if (!r || r.resetAt < now) {
    RATE.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  if (r.count >= MAX_PER_WINDOW) return true;
  r.count++;
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    'unknown';
  if (rateLimited(ip)) {
    return res.status(429).json({ error: 'Demasiadas solicitudes. Espera un minuto.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }
  }
  body = body || {};

  // Honeypot — silently succeed for bots
  if (body._company) return res.status(200).json({ ok: true });

  const name = String(body.name || '').trim();
  const email = body.email ? String(body.email).trim().toLowerCase() : '';
  const phone = body.phone ? String(body.phone).trim() : '';
  const address = String(body.address || '').trim();
  const dedication = body.dedication ? String(body.dedication).trim().slice(0, 80) : '';
  const edition = body.edition ? String(body.edition).slice(0, 20) : 'MMXXVI';
  const amount = Number(body.amount_pen) || 195;

  if (!name) return res.status(400).json({ error: 'Falta nombre.' });
  if (!email && !phone) return res.status(400).json({ error: 'Falta email o WhatsApp.' });
  if (!address) return res.status(400).json({ error: 'Falta dirección de envío.' });

  const order = {
    received_at: new Date().toISOString(),
    edition,
    name, email, phone, address, dedication,
    amount_pen: amount,
    source: 'studios:/almanac',
    ip,
  };

  const crmUrl = process.env.CRM_PUBLIC_API;
  const secret = process.env.CRM_LEAD_INTAKE_SECRET;

  if (!crmUrl || !secret) {
    console.log('[almanac-order:stub]', JSON.stringify(order));
    return res.status(200).json({ ok: true, mode: 'log-only' });
  }

  try {
    const r = await fetch(`${crmUrl}/api/leads/public`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Lead-Intake-Secret': secret,
      },
      body: JSON.stringify({
        name,
        email: email || null,
        phone: phone || null,
        district: 'Almanac',
        niche: 'Almanac',
        source: 'studios:almanac',
        notes: [
          `Almanac order · Edición ${edition} · S/ ${amount}`,
          `Dirección: ${address}`,
          dedication && `Dedicatoria: ${dedication}`,
        ].filter(Boolean).join('\n'),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) {
      console.error('[almanac-order] CRM rejected', r.status, await r.text());
      // Still log the order so it isn't lost
      console.log('[almanac-order:fallback]', JSON.stringify(order));
      return res.status(502).json({ error: 'CRM no disponible. Tu reserva quedó registrada en el log.' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[almanac-order] CRM error', err.message);
    console.log('[almanac-order:fallback]', JSON.stringify(order));
    return res.status(502).json({ error: 'Error contactando al CRM. Tu reserva quedó registrada.' });
  }
}
