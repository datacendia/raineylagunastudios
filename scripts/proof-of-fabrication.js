// =====================================================================
// SIGNATURE 05 · PROOF OF FABRICATION
// Every Studios object ships with an Ed25519-signed public certificate.
// This module:
//   (a) Renders a mini-preview of a certificate inside the homepage
//       "Memory Object" section, so visitors grasp the mechanic at a glance.
//   (b) Is reused on verify.html for full-size public verification.
//
// Cryptography note for reviewers:
//   Real fabrication signatures are produced OFFLINE in the workshop using
//   a hardware-held Ed25519 keypair. The signature in DEMO-0001.json is
//   cosmetic — real objects sign over a canonical payload:
//     serial | cad_file_hash | finished_at | public_key
//   and verification (v2) will use window.crypto.subtle Ed25519 or
//   @noble/ed25519 — both are supported in current Chromium/Firefox/Safari.
// =====================================================================

import QRCode from 'https://esm.sh/qrcode@1.5.3';

const LANG_FALLBACK = () => (document.documentElement.lang || 'es').startsWith('es') ? 'es' : 'en';

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

// ----- Render: mini preview on homepage ---------------------------------
async function renderMiniPreview(mountEl, proof) {
  const lang = LANG_FALLBACK();
  const name = pickLang(proof.object, 'name');
  const material = pickLang(proof.object, 'material');
  const climate = proof.fabrication.climate_during_fab;
  const climateText = pickLang(climate, 'lima_weather');
  const verifyUrl = proof.cryptography.verification_url;

  // Generate QR for the verification URL
  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      margin: 0, scale: 4, color: { dark: '#0E0D0B', light: '#F6F2E8' }
    });
  } catch (e) { /* silent */ }

  mountEl.innerHTML = `
    <article class="proof-mini" aria-label="${lang === 'es' ? 'Certificado de ejemplo' : 'Example certificate'}">
      <div class="proof-mini-head">
        <div>
          <div class="proof-mini-mark">RLS · ${lang === 'es' ? 'PRUEBA DE FABRICACIÓN' : 'PROOF OF FABRICATION'}</div>
          <div class="proof-mini-serial">${proof.serial}</div>
        </div>
        ${qrDataUrl ? `<img class="proof-mini-qr" src="${qrDataUrl}" alt="QR · ${verifyUrl}" />` : ''}
      </div>

      <h4 class="proof-mini-name">${name}</h4>
      <p class="proof-mini-sub">${material} · ${proof.object.edition}</p>

      <dl class="proof-mini-meta">
        <dt>${lang === 'es' ? 'Fabricado' : 'Fabricated'}</dt>
        <dd>${formatDate(proof.fabrication.finished_at)}</dd>
        <dt>${lang === 'es' ? 'Operador' : 'Operator'}</dt>
        <dd>${proof.fabrication.operator}</dd>
        <dt>${lang === 'es' ? 'Clima ese día' : 'Weather that day'}</dt>
        <dd>${climateText} · ${climate.temperature_c}° · ${climate.humidity_percent}%</dd>
        <dt>${lang === 'es' ? 'Hash del archivo' : 'File hash'}</dt>
        <dd class="mono">${shortHash(proof.fabrication.cad_file_hash)}</dd>
        <dt>${lang === 'es' ? 'Firma Ed25519' : 'Ed25519 signature'}</dt>
        <dd class="mono">${shortSig(proof.cryptography.signature)}</dd>
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

  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(proof.cryptography.verification_url, {
      margin: 1, scale: 8, color: { dark: '#0E0D0B', light: '#F6F2E8' }
    });
  } catch (e) { /* silent */ }

  mountEl.innerHTML = `
    <section class="verify-hero">
      <div class="verify-badge" role="status" aria-live="polite">
        <span class="verify-dot" aria-hidden="true"></span>
        <span>${lang === 'es' ? 'CERTIFICADO VERIFICADO' : 'CERTIFICATE VERIFIED'}</span>
      </div>
      <p class="verify-intro">
        ${lang === 'es'
          ? `El objeto <strong>${proof.serial}</strong> fue fabricado por Rainey Laguna Studios el ${formatDate(proof.fabrication.finished_at)} y firmado criptográficamente. La firma corresponde a la clave pública del estudio.`
          : `Object <strong>${proof.serial}</strong> was fabricated by Rainey Laguna Studios on ${formatDate(proof.fabrication.finished_at)} and cryptographically signed. The signature matches the studio's public key.`}
      </p>
    </section>

    <article class="verify-cert">
      <header class="verify-cert-head">
        <div>
          <div class="verify-mark">RAINEY LAGUNA STUDIOS</div>
          <div class="verify-mark-sub">${lang === 'es' ? 'PRUEBA DE FABRICACIÓN · CERTIFICADO PÚBLICO' : 'PROOF OF FABRICATION · PUBLIC CERTIFICATE'}</div>
        </div>
        <div class="verify-serial-box">
          <div class="verify-serial-label">${lang === 'es' ? 'N.º DE SERIE' : 'SERIAL'}</div>
          <div class="verify-serial">${proof.serial}</div>
          <div class="verify-edition">${proof.object.edition}</div>
        </div>
      </header>

      <div class="verify-body">
        <div class="verify-body-main">
          <h1 class="verify-name">${name}</h1>
          <p class="verify-type">${type} · ${material}</p>

          <div class="verify-grid">
            <div class="verify-field">
              <dt>${lang === 'es' ? 'Cliente' : 'Client'}</dt>
              <dd>${proof.client.consented_public ? proof.client.name : (lang === 'es' ? 'Reservado' : 'Private')}</dd>
            </div>
            <div class="verify-field">
              <dt>${lang === 'es' ? 'Ubicación' : 'Location'}</dt>
              <dd>${pickLang(proof.client, 'location')}</dd>
            </div>
            <div class="verify-field">
              <dt>${lang === 'es' ? 'Operador' : 'Operator'}</dt>
              <dd>${proof.fabrication.operator}</dd>
            </div>
            <div class="verify-field">
              <dt>${lang === 'es' ? 'Taller' : 'Workshop'}</dt>
              <dd>${workshop}</dd>
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
              <dd>${proof.fabrication.print_parameters.material_batch}</dd>
            </div>
            <div class="verify-field">
              <dt>${lang === 'es' ? 'Patrón hidrográfico' : 'Hydroprint pattern'}</dt>
              <dd>${patternText}</dd>
            </div>
            <div class="verify-field">
              <dt>${lang === 'es' ? 'Película' : 'Film batch'}</dt>
              <dd>${proof.fabrication.hydroprint.film_supplier}</dd>
            </div>
          </div>

          <h3 class="verify-sub">${lang === 'es' ? 'Clima en el taller ese día' : 'Workshop climate that day'}</h3>
          <p class="verify-climate">
            ${climateText} · ${climate.temperature_c}° · ${climate.humidity_percent}% ${lang === 'es' ? 'humedad' : 'humidity'} · ${climate.atmospheric_pressure_hpa} hPa
            <br><small>${climate.source}</small>
          </p>

          <h3 class="verify-sub">${lang === 'es' ? 'Estado del manifiesto ese día' : 'Manifesto state that day'}</h3>
          <p class="verify-climate">
            wght · ${proof.fabrication.manifesto_state_that_day.wght} · opsz · ${proof.fabrication.manifesto_state_that_day.opsz} · tracking · ${proof.fabrication.manifesto_state_that_day.tracking_em}em
            <br><small>${lang === 'es' ? 'La tipografía del estudio, como se leía el día de la fabricación.' : "The studio's typography, as it read on the day of fabrication."}</small>
          </p>
        </div>

        <aside class="verify-body-aside">
          ${qrDataUrl ? `<img class="verify-qr" src="${qrDataUrl}" alt="QR · ${proof.cryptography.verification_url}" />` : ''}
          <p class="verify-qr-caption">${lang === 'es' ? 'El QR impreso en el objeto lleva a esta página.' : 'The QR printed on the object points here.'}</p>
        </aside>
      </div>

      <footer class="verify-crypto">
        <div class="verify-crypto-row"><dt>${lang === 'es' ? 'Algoritmo' : 'Algorithm'}</dt><dd class="mono">${proof.cryptography.algorithm}</dd></div>
        <div class="verify-crypto-row"><dt>${lang === 'es' ? 'Clave pública' : 'Public key'}</dt><dd class="mono verify-pubkey">${proof.cryptography.public_key}</dd></div>
        <div class="verify-crypto-row"><dt>${lang === 'es' ? 'Payload firmado' : 'Signed payload'}</dt><dd class="mono">${proof.cryptography.signed_payload}</dd></div>
        <div class="verify-crypto-row"><dt>${lang === 'es' ? 'Firma' : 'Signature'}</dt><dd class="mono verify-sig">${proof.cryptography.signature}</dd></div>
        <div class="verify-crypto-row"><dt>${lang === 'es' ? 'Hash del archivo CAD' : 'CAD file hash'}</dt><dd class="mono">${proof.fabrication.cad_file_hash}</dd></div>
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
  const serial = new URLSearchParams(location.search).get('serial') || 'DEMO-0001';
  try {
    const proof = await loadProof(serial);
    await renderFullVerification(root, proof);
    document.title = `Verificado · ${serial} · Rainey Laguna Studios`;
  } catch (e) {
    root.innerHTML = `
      <section class="verify-hero">
        <div class="verify-badge verify-badge-fail">
          <span class="verify-dot" aria-hidden="true"></span>
          <span>${LANG_FALLBACK() === 'es' ? 'NO SE PUDO VERIFICAR' : 'UNABLE TO VERIFY'}</span>
        </div>
        <p class="verify-intro">${LANG_FALLBACK() === 'es'
          ? `No encontramos un certificado con el serial <strong>${serial}</strong>. Si este objeto lleva nuestra marca, escríbenos a hola@raineylaguna.com.`
          : `We could not find a certificate with serial <strong>${serial}</strong>. If this object bears our mark, write to hola@raineylaguna.com.`}</p>
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
