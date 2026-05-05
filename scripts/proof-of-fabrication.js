// =====================================================================
// SIGNATURE 05 · PROOF OF FABRICATION
// Every Studios object ships with an Ed25519-signed public certificate.
// This module:
//   (a) Renders a mini-preview of a certificate inside the homepage
//       "Memory Object" section, so visitors grasp the mechanic at a glance.
//   (b) Is reused on verify.html for full-size public verification.
//
// Cryptography implementation:
//   Fabrication signatures are produced OFFLINE in the workshop using
//   a hardware-held Ed25519 keypair. This module verifies signatures
//   using the pinned studio public key and @noble/ed25519.
//   The canonical signed payload format is:
//     serial | cad_file_hash | finished_at | public_key
// =====================================================================

import QRCode from 'https://esm.sh/qrcode@1.5.3';
import { verify } from 'https://esm.sh/@noble/ed25519@2.1.0';

const LANG_FALLBACK = () => (document.documentElement.lang || 'es').startsWith('es') ? 'es' : 'en';

// Escape values that land inside HTML produced via innerHTML. Proof JSON
// files are studio-authored today, but the serial query param is visitor-
// supplied (verify.html?serial=...) and could be reflected into the error
// path; treating every interpolation as untrusted is the durable posture.
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
const _e = escapeHtml;

const pickLang = (obj, key) => {
  const lang = LANG_FALLBACK();
  return obj[`${key}_${lang}`] || obj[`${key}_es`] || obj[key] || '';
};

// ----- Utilities ---------------------------------------------------------
function formatDate(iso, opts = {}) {
  const lang = LANG_FALLBACK();
  const locale = lang === 'es' ? 'es-PE' : 'en-GB';
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone: 'America/Lima',
      day: '2-digit', month: 'short', year: 'numeric',
      ...opts
    }).format(new Date(iso));
  } catch (e) { return iso; }
}

function shortHash(h) {
  if (!h) return '—';
  const s = h.replace(/^sha256:/, '');
  return s.slice(0, 8) + '…' + s.slice(-8);
}

function shortSig(sig) {
  if (!sig) return '—';
  return sig.slice(0, 12) + '…' + sig.slice(-12);
}

// ----- Cryptographic verification -------------------------------------------
// Pinned public key for Rainey Laguna Studios Ed25519 signing key.
// This key must match the one used offline to sign fabrication proofs.
// NOTE: This is a placeholder for demonstration. The real studio public key
// will be deployed when production objects are signed.
const STUDIOS_PUBLIC_KEY = '3b6a27bcceb6a42d62a3a8d02a6f0d73653215771de243a63ac048a18b59da29';

// Demo serials that use placeholder signatures (not cryptographically verified)
const DEMO_SERIALS = ['DEMO-0001', 'DEMO-0002', 'DEMO-0003', 'DEMO-0006', 'DEMO-0007', 'DEMO-0011'];

// Construct the canonical payload that was signed.
// The signing process concatenates: serial | cad_file_hash | finished_at | public_key
function constructSignedPayload(proof) {
  return [
    proof.serial,
    proof.fabrication.cad_file_hash,
    proof.fabrication.finished_at,
    proof.cryptography.public_key
  ].join('|');
}

// Verify the Ed25519 signature using the pinned public key.
// Returns: 'valid' if signature verifies, 'invalid' if verification fails,
//          'demo' if the serial is a demo placeholder, 'error' on exception.
async function verifySignature(proof) {
  // Demo signatures are placeholders - skip cryptographic verification
  if (DEMO_SERIALS.includes(proof.serial)) {
    return 'demo';
  }

  try {
    const payload = constructSignedPayload(proof);
    const message = new TextEncoder().encode(payload);
    const signature = hexToBytes(proof.cryptography.signature);
    const publicKey = hexToBytes(STUDIOS_PUBLIC_KEY);
    const isValid = await verify(signature, message, publicKey);
    return isValid ? 'valid' : 'invalid';
  } catch (e) {
    console.warn('[proof-of-fabrication] Signature verification failed:', e);
    return 'error';
  }
}

// Convert hex string to Uint8Array
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// ----- Render: mini preview on homepage ---------------------------------
async function renderMiniPreview(mountEl, proof) {
  const lang = LANG_FALLBACK();
  const name = pickLang(proof.object, 'name');
  const material = pickLang(proof.object, 'material');
  const climate = proof.fabrication.climate_during_fab;
  const climateText = pickLang(climate, 'lima_weather');
  const verifyUrl = proof.cryptography.verification_url;

  // Verify the Ed25519 signature
  const sigStatus = await verifySignature(proof);

  // Generate QR for the verification URL
  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      margin: 0, scale: 4, color: { dark: '#0E0D0B', light: '#F6F2E8' }
    });
  } catch (e) { /* silent */ }

  // Determine verification display
  let verificationClass = 'proof-demo';
  let verificationText = lang === 'es' ? 'Demo (firma placeholder)' : 'Demo (placeholder signature)';
  if (sigStatus === 'valid') {
    verificationClass = 'proof-valid';
    verificationText = lang === 'es' ? '✓ Válido' : '✓ Valid';
  } else if (sigStatus === 'invalid') {
    verificationClass = 'proof-invalid';
    verificationText = lang === 'es' ? '✗ Inválido' : '✗ Invalid';
  } else if (sigStatus === 'error') {
    verificationClass = 'proof-invalid';
    verificationText = lang === 'es' ? 'Error de verificación' : 'Verification error';
  }

  mountEl.innerHTML = `
    <article class="proof-mini" aria-label="${lang === 'es' ? 'Certificado de ejemplo' : 'Example certificate'}">
      <div class="proof-mini-head">
        <div>
          <div class="proof-mini-mark">RLS · ${lang === 'es' ? 'PRUEBA DE FABRICACIÓN' : 'PROOF OF FABRICATION'}</div>
          <div class="proof-mini-serial">${_e(proof.serial)}</div>
        </div>
        ${qrDataUrl ? `<img class="proof-mini-qr" src="${qrDataUrl}" alt="QR · ${_e(verifyUrl)}" />` : ''}
      </div>

      <h4 class="proof-mini-name">${_e(name)}</h4>
      <p class="proof-mini-sub">${_e(material)} · ${_e(proof.object.edition)}</p>

      <dl class="proof-mini-meta">
        <dt>${lang === 'es' ? 'Fabricado' : 'Fabricated'}</dt>
        <dd>${formatDate(proof.fabrication.finished_at)}</dd>
        <dt>${lang === 'es' ? 'Operador' : 'Operator'}</dt>
        <dd>${_e(proof.fabrication.operator)}</dd>
        <dt>${lang === 'es' ? 'Clima ese día' : 'Weather that day'}</dt>
        <dd>${_e(climateText)} · ${_e(climate.temperature_c)}° · ${_e(climate.humidity_percent)}%</dd>
        <dt>${lang === 'es' ? 'Hash del archivo' : 'File hash'}</dt>
        <dd class="mono">${_e(shortHash(proof.fabrication.cad_file_hash))}</dd>
        <dt>${lang === 'es' ? 'Firma Ed25519' : 'Ed25519 signature'}</dt>
        <dd class="mono">${_e(shortSig(proof.cryptography.signature))}</dd>
        <dt>${lang === 'es' ? 'Verificación' : 'Verification'}</dt>
        <dd class="${verificationClass}">${verificationText}</dd>
      </dl>

      <div class="proof-mini-foot">
        <a href="verify.html?serial=${encodeURIComponent(proof.serial)}" class="proof-verify-link">
          ${lang === 'es' ? 'Verificar este certificado →' : 'Verify this certificate →'}
        </a>
      </div>
    </article>
  `;
}

// ----- Render: full-size verification on verify.html --------------------
async function renderFullVerification(mountEl, proof) {
  const lang = LANG_FALLBACK();
  const name = pickLang(proof.object, 'name');
  const type = pickLang(proof.object, 'type');
  const material = pickLang(proof.object, 'material');
  const workshop = pickLang(proof.fabrication, 'workshop');
  const climate = proof.fabrication.climate_during_fab;
  const climateText = pickLang(climate, 'lima_weather');
  const patternText = pickLang(proof.fabrication.hydroprint, 'pattern_name');

  // Verify the Ed25519 signature
  const sigStatus = await verifySignature(proof);

  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(proof.cryptography.verification_url, {
      margin: 1, scale: 8, color: { dark: '#0E0D0B', light: '#F6F2E8' }
    });
  } catch (e) { /* silent */ }

  // Determine verification badge and message
  let badgeClass = '';
  let badgeText = lang === 'es' ? 'CERTIFICADO VERIFICADO' : 'CERTIFICATE VERIFIED';
  let introText = lang === 'es'
    ? `El objeto <strong>${_e(proof.serial)}</strong> fue fabricado por Rainey Laguna Studios el ${_e(formatDate(proof.fabrication.finished_at))} y firmado criptográficamente. La firma corresponde a la clave pública del estudio.`
    : `Object <strong>${_e(proof.serial)}</strong> was fabricated by Rainey Laguna Studios on ${_e(formatDate(proof.fabrication.finished_at))} and cryptographically signed. The signature matches the studio's public key.`;

  if (sigStatus === 'demo') {
    badgeClass = 'verify-badge-demo';
    badgeText = lang === 'es' ? 'DEMOSTRACIÓN' : 'DEMONSTRATION';
    introText = lang === 'es'
      ? `Este es un certificado de demostración. La firma criptográfica en objetos de producción será verificada con la clave pública del estudio.`
      : `This is a demonstration certificate. The cryptographic signature on production objects will be verified against the studio's public key.`;
  } else if (sigStatus === 'invalid') {
    badgeClass = 'verify-badge-fail';
    badgeText = lang === 'es' ? 'FIRMA INVÁLIDA' : 'INVALID SIGNATURE';
    introText = lang === 'es'
      ? `La firma criptográfica del objeto <strong>${_e(proof.serial)}</strong> no pudo verificarse contra la clave pública del estudio. Este certificado puede no ser auténtico.`
      : `The cryptographic signature for object <strong>${_e(proof.serial)}</strong> could not be verified against the studio's public key. This certificate may not be authentic.`;
  } else if (sigStatus === 'error') {
    badgeClass = 'verify-badge-fail';
    badgeText = lang === 'es' ? 'ERROR DE VERIFICACIÓN' : 'VERIFICATION ERROR';
    introText = lang === 'es'
      ? `Ocurrió un error al verificar la firma del objeto <strong>${_e(proof.serial)}</strong>.`
      : `An error occurred while verifying the signature for object <strong>${_e(proof.serial)}</strong>.`;
  }

  mountEl.innerHTML = `
    <section class="verify-hero">
      <div class="verify-badge ${badgeClass}" role="status" aria-live="polite">
        <span class="verify-dot" aria-hidden="true"></span>
        <span>${badgeText}</span>
      </div>
      <p class="verify-intro">${introText}</p>
    </section>

    <article class="verify-cert">
      <header class="verify-cert-head">
        <div>
          <div class="verify-mark">RAINEY LAGUNA STUDIOS</div>
          <div class="verify-mark-sub">${lang === 'es' ? 'PRUEBA DE FABRICACIÓN · CERTIFICADO PÚBLICO' : 'PROOF OF FABRICATION · PUBLIC CERTIFICATE'}</div>
        </div>
        <div class="verify-serial-box">
          <div class="verify-serial-label">${lang === 'es' ? 'N.º DE SERIE' : 'SERIAL'}</div>
          <div class="verify-serial">${_e(proof.serial)}</div>
          <div class="verify-edition">${_e(proof.object.edition)}</div>
        </div>
      </header>

      <div class="verify-body">
        <div class="verify-body-main">
          <h1 class="verify-name">${_e(name)}</h1>
          <p class="verify-type">${_e(type)} · ${_e(material)}</p>

          <div class="verify-grid">
            <div class="verify-field">
              <dt>${lang === 'es' ? 'Cliente' : 'Client'}</dt>
              <dd>${_e(proof.client.consented_public ? proof.client.name : (lang === 'es' ? 'Reservado' : 'Private'))}</dd>
            </div>
            <div class="verify-field">
              <dt>${lang === 'es' ? 'Ubicación' : 'Location'}</dt>
              <dd>${_e(pickLang(proof.client, 'location'))}</dd>
            </div>
            <div class="verify-field">
              <dt>${lang === 'es' ? 'Operador' : 'Operator'}</dt>
              <dd>${_e(proof.fabrication.operator)}</dd>
            </div>
            <div class="verify-field">
              <dt>${lang === 'es' ? 'Taller' : 'Workshop'}</dt>
              <dd>${_e(workshop)}</dd>
            </div>
            <div class="verify-field">
              <dt>${lang === 'es' ? 'Inicio' : 'Started'}</dt>
              <dd>${formatDate(proof.fabrication.started_at, { hour: '2-digit', minute: '2-digit' })}</dd>
            </div>
            <div class="verify-field">
              <dt>${lang === 'es' ? 'Fin' : 'Finished'}</dt>
              <dd>${formatDate(proof.fabrication.finished_at, { hour: '2-digit', minute: '2-digit' })}</dd>
            </div>
          </div>

          <h3 class="verify-sub">${lang === 'es' ? 'Parámetros de fabricación' : 'Fabrication parameters'}</h3>
          <div class="verify-grid">
            <div class="verify-field">
              <dt>${lang === 'es' ? 'Altura de capa' : 'Layer height'}</dt>
              <dd>${proof.fabrication.print_parameters.layer_height_mm} mm</dd>
            </div>
            <div class="verify-field">
              <dt>${lang === 'es' ? 'Temperatura' : 'Temperature'}</dt>
              <dd>${proof.fabrication.print_parameters.nozzle_temp_c}° / ${proof.fabrication.print_parameters.bed_temp_c}°</dd>
            </div>
            <div class="verify-field">
              <dt>${lang === 'es' ? 'Relleno' : 'Infill'}</dt>
              <dd>${proof.fabrication.print_parameters.infill_percent}%</dd>
            </div>
            <div class="verify-field">
              <dt>${lang === 'es' ? 'Lote de material' : 'Material batch'}</dt>
              <dd>${_e(proof.fabrication.print_parameters.material_batch)}</dd>
            </div>
            <div class="verify-field">
              <dt>${lang === 'es' ? 'Patrón hidrográfico' : 'Hydroprint pattern'}</dt>
              <dd>${_e(patternText)}</dd>
            </div>
            <div class="verify-field">
              <dt>${lang === 'es' ? 'Película' : 'Film batch'}</dt>
              <dd>${_e(proof.fabrication.hydroprint.film_supplier)}</dd>
            </div>
          </div>

          <h3 class="verify-sub">${lang === 'es' ? 'Clima en el taller ese día' : 'Workshop climate that day'}</h3>
          <p class="verify-climate">
            ${_e(climateText)} · ${_e(climate.temperature_c)}° · ${_e(climate.humidity_percent)}% ${lang === 'es' ? 'humedad' : 'humidity'} · ${_e(climate.atmospheric_pressure_hpa)} hPa
            <br><small>${_e(climate.source)}</small>
          </p>

          <h3 class="verify-sub">${lang === 'es' ? 'Estado del manifiesto ese día' : 'Manifesto state that day'}</h3>
          <p class="verify-climate">
            wght · ${proof.fabrication.manifesto_state_that_day.wght} · opsz · ${proof.fabrication.manifesto_state_that_day.opsz} · tracking · ${proof.fabrication.manifesto_state_that_day.tracking_em}em
            <br><small>${lang === 'es' ? 'La tipografía del estudio, como se leía el día de la fabricación.' : "The studio's typography, as it read on the day of fabrication."}</small>
          </p>
        </div>

        <aside class="verify-body-aside">
          ${qrDataUrl ? `<img class="verify-qr" src="${qrDataUrl}" alt="QR · ${_e(proof.cryptography.verification_url)}" />` : ''}
          <p class="verify-qr-caption">${lang === 'es' ? 'El QR impreso en el objeto lleva a esta página.' : 'The QR printed on the object points here.'}</p>
        </aside>
      </div>

      <footer class="verify-crypto">
        <div class="verify-crypto-row"><dt>${lang === 'es' ? 'Algoritmo' : 'Algorithm'}</dt><dd class="mono">${_e(proof.cryptography.algorithm)}</dd></div>
        <div class="verify-crypto-row"><dt>${lang === 'es' ? 'Clave pública' : 'Public key'}</dt><dd class="mono verify-pubkey">${_e(proof.cryptography.public_key)}</dd></div>
        <div class="verify-crypto-row"><dt>${lang === 'es' ? 'Payload firmado' : 'Signed payload'}</dt><dd class="mono">${_e(proof.cryptography.signed_payload)}</dd></div>
        <div class="verify-crypto-row"><dt>${lang === 'es' ? 'Firma' : 'Signature'}</dt><dd class="mono verify-sig">${_e(proof.cryptography.signature)}</dd></div>
        <div class="verify-crypto-row"><dt>${lang === 'es' ? 'Hash del archivo CAD' : 'CAD file hash'}</dt><dd class="mono">${_e(proof.fabrication.cad_file_hash)}</dd></div>
        <div class="verify-crypto-row"><dt>${lang === 'es' ? 'Firmado' : 'Signed at'}</dt><dd>${formatDate(proof.cryptography.signed_at, { hour: '2-digit', minute: '2-digit' })}</dd></div>
      </footer>
    </article>

    <section class="verify-meaning">
      <h2>${lang === 'es' ? 'Qué significa esto' : 'What this means'}</h2>
      <p>
        ${lang === 'es'
          ? 'Cualquier persona puede verificar, ahora y dentro de diez años, que este objeto específico fue fabricado en nuestro taller, en la fecha registrada, con el archivo exacto que firmamos. Las copias no verificables no son nuestras.'
          : 'Anyone can verify, now and ten years from now, that this specific object was fabricated in our workshop, on the recorded date, from the exact file we signed. Unverifiable copies are not ours.'}
      </p>
      <p>
        ${lang === 'es'
          ? 'Ningún otro estudio de diseño en Perú firma sus objetos. Nosotros lo hacemos porque creemos que la fabricación es parte del significado, no un detalle técnico.'
          : 'No other design studio in Peru signs its objects. We do it because we believe fabrication is part of the meaning, not a technical detail.'}
      </p>
    </section>
  `;
}

// ----- Init --------------------------------------------------------------
async function loadProof(serial) {
  const safe = (serial || '').replace(/[^A-Z0-9\-]/gi, '').toUpperCase();
  if (!safe) throw new Error('no serial');
  const res = await fetch(`data/proofs/${safe}.json`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`proof ${safe} not found`);
  return await res.json();
}

// Mount a mini preview wherever an element has data-proof-preview="SERIAL"
async function initMiniPreviews() {
  const hosts = document.querySelectorAll('[data-proof-preview]');
  for (const host of hosts) {
    const serial = host.getAttribute('data-proof-preview');
    try {
      const proof = await loadProof(serial);
      await renderMiniPreview(host, proof);
    } catch (e) {
      host.innerHTML = `<p class="proof-mini-err">—</p>`;
      console.warn('[proof-of-fabrication]', e);
    }
  }
}

// Mount the full verification if verify.html has <main id="verify-root">
async function initFullVerify() {
  const root = document.getElementById('verify-root');
  if (!root) return;
  const rawSerial = new URLSearchParams(location.search).get('serial') || 'DEMO-0001';
  // Sanitize the serial we display before any successful loadProof so the
  // catch-path message can't reflect arbitrary characters.
  const serial = rawSerial.replace(/[^A-Z0-9\-]/gi, '').slice(0, 64).toUpperCase() || 'DEMO-0001';
  try {
    const proof = await loadProof(serial);
    await renderFullVerification(root, proof);
    // document.title is text content (no HTML parsing) but we keep the
    // sanitized form for consistency.
    document.title = `Verificado · ${serial} · Rainey Laguna Studios`;
  } catch (e) {
    root.innerHTML = `
      <section class="verify-hero">
        <div class="verify-badge verify-badge-fail">
          <span class="verify-dot" aria-hidden="true"></span>
          <span>${LANG_FALLBACK() === 'es' ? 'NO SE PUDO VERIFICAR' : 'UNABLE TO VERIFY'}</span>
        </div>
        <p class="verify-intro">${LANG_FALLBACK() === 'es'
          ? `No encontramos un certificado con el serial <strong>${_e(serial)}</strong>. Si este objeto lleva nuestra marca, escríbenos a hola@raineylaguna.com.`
          : `We could not find a certificate with serial <strong>${_e(serial)}</strong>. If this object bears our mark, write to hola@raineylaguna.com.`}</p>
      </section>`;
  }
}

// Run both (idempotent — one will be a no-op depending on page)
initMiniPreviews();
initFullVerify();

// Re-render on language toggle
document.addEventListener('click', (e) => {
  const t = e.target.closest('#langEs, #langEn');
  if (!t) return;
  // Let the i18n handler set <html lang> first, then re-render.
  setTimeout(() => { initMiniPreviews(); initFullVerify(); }, 20);
});
