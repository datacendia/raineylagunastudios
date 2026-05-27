// =====================================================================
// scripts/lab-qr-snapshot.js
// SIGNATURE 02 · HYDROPRINT LAB · QR SNAPSHOT
//
// After a visitor customizes their object in the lab, they can press
// "QR snapshot" to capture their spec as:
//   1. A hi-res PNG of the rendered piece
//   2. A QR code encoding a URL with the spec embedded as base64-JSON
//
// The QR is the artifact: scan it with your phone, share it with a
// friend, hand it to us at the studio so we pre-load your spec on the
// in-house tablet. Closes the preview→sales loop with no infrastructure.
//
// Pure-DOM, no framework. Lazy-loads `qrcode` from jsDelivr only when
// the visitor actually presses the button, so the homepage payload
// stays unaffected.
// =====================================================================

(function () {
  const btnSelector = '#labQrBtn';
  const modalSelector = '#labQrModal';

  // Build the spec object by reading the lab DOM. This deliberately
  // mirrors the state shape used by wireLabControls() so we don't
  // have to expose internal state across module boundaries.
  function readSpec() {
    const pressed = (sel) => document.querySelector(sel + '[aria-pressed="true"]');
    const formEl = pressed('.lab-form');
    const patternEl = pressed('.lab-pattern');
    const colorEl = pressed('.lab-swatch');
    const finishEl = pressed('.lab-finish');
    const qtyEl = document.getElementById('labQty');
    const customName = document.getElementById('labUploadName')?.textContent?.trim();
    const customActive = customName && customName !== 'ninguno' && customName !== 'none';

    return {
      v: 1,
      form: formEl?.dataset.form ?? 'mug',
      pattern: customActive ? 'custom' : (patternEl?.dataset.patternId ?? null),
      customName: customActive ? customName : null,
      color: colorEl?.dataset.color?.replace(/^0x/i, '') ?? 'f6f2e8',
      finish: finishEl?.dataset.finish ?? 'satin',
      qty: Math.max(1, Math.min(500, parseInt(qtyEl?.value ?? '1', 10) || 1)),
      ts: new Date().toISOString().slice(0, 10),
    };
  }

  function buildShareUrl(spec) {
    const json = JSON.stringify(spec);
    // base64url encode so the URL is QR-friendly.
    const b64 = btoa(unescape(encodeURIComponent(json)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const origin = location.origin || 'https://raineylagunastudios.com';
    return `${origin}/?lab=${b64}#hydroprintLab`;
  }

  function specSummary(spec, lang) {
    const formLabels = {
      mug: { es: 'Taza · 350ml', en: 'Mug · 350ml' },
      plate: { es: 'Plato · 24cm', en: 'Plate · 24cm' },
      vase: { es: 'Florero · 22cm', en: 'Vase · 22cm' },
      coaster: { es: 'Posavasos x4', en: 'Coasters x4' },
      panel: { es: 'Panel 30×40', en: 'Panel 30×40' },
    };
    const finishLabels = {
      matte: { es: 'mate', en: 'matte' },
      satin: { es: 'satín', en: 'satin' },
      gloss: { es: 'brillo', en: 'gloss' },
    };
    const form = formLabels[spec.form]?.[lang] ?? spec.form;
    const finish = finishLabels[spec.finish]?.[lang] ?? spec.finish;
    const pattern = spec.pattern === 'custom'
      ? (lang === 'en' ? 'custom image' : 'imagen propia')
      : (spec.pattern ?? '—');
    return `${form} · #${spec.color} · ${finish} · ${pattern} · x${spec.qty}`;
  }

  let qrLib = null;
  async function loadQR() {
    if (qrLib) return qrLib;
    qrLib = await import('https://cdn.jsdelivr.net/npm/qrcode@1.5.3/+esm');
    return qrLib;
  }

  function ensureModal() {
    let modal = document.querySelector(modalSelector);
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'labQrModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'labQrModalTitle');
    modal.hidden = true;
    modal.innerHTML = `
      <div class="lab-qr-backdrop" data-close></div>
      <div class="lab-qr-card">
        <button type="button" class="lab-qr-close" aria-label="Cerrar" data-close>×</button>
        <h3 id="labQrModalTitle" class="lab-qr-title"
            data-es="Tu pieza, en un código"
            data-en="Your piece, in a code">Tu pieza, en un código</h3>
        <p class="lab-qr-sub mono"
           data-es="Escanea para abrir esta especificación en tu teléfono o compártela con quien quieras."
           data-en="Scan to open this spec on your phone, or share it with anyone."></p>
        <div class="lab-qr-grid">
          <figure class="lab-qr-snap">
            <img id="labQrSnapImg" alt="Render 3D">
            <figcaption class="mono" id="labQrSpecCaption"></figcaption>
          </figure>
          <figure class="lab-qr-code">
            <canvas id="labQrCanvas" width="320" height="320"></canvas>
            <figcaption class="mono">
              <a id="labQrUrl" href="#" target="_blank" rel="noopener"></a>
            </figcaption>
          </figure>
        </div>
        <div class="lab-qr-actions">
          <a class="btn-link" id="labQrDownloadSnap" download="rainey-laguna-spec.png"
             data-es="Descargar render" data-en="Download render">Descargar render</a>
          <a class="btn-link" id="labQrDownloadQr" download="rainey-laguna-qr.png"
             data-es="Descargar QR" data-en="Download QR">Descargar QR</a>
          <button type="button" class="btn-link" id="labQrCopyUrl"
                  data-es="Copiar enlace" data-en="Copy link">Copiar enlace</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Inject styles once.
    if (!document.getElementById('labQrStyles')) {
      const style = document.createElement('style');
      style.id = 'labQrStyles';
      style.textContent = `
        #labQrModal { position: fixed; inset: 0; z-index: 9999; display: flex;
          align-items: center; justify-content: center; padding: 24px; }
        #labQrModal[hidden] { display: none; }
        .lab-qr-backdrop { position: absolute; inset: 0; background: rgba(14,13,11,0.78);
          backdrop-filter: blur(6px); cursor: pointer; }
        .lab-qr-card { position: relative; background: #f6f2e8; color: #0e0d0b;
          border-radius: 14px; padding: 32px 32px 24px; max-width: 760px; width: 100%;
          box-shadow: 0 30px 80px rgba(0,0,0,0.4); animation: labQrIn .25s ease-out; }
        @keyframes labQrIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        .lab-qr-close { position: absolute; top: 12px; right: 14px; background: none;
          border: 0; font-size: 28px; line-height: 1; cursor: pointer; color: #0e0d0b; }
        .lab-qr-title { font-family: 'Fraunces', serif; font-style: italic; font-weight: 300;
          font-size: 30px; line-height: 1.1; margin: 0 0 6px; }
        .lab-qr-sub { font-size: 12px; color: rgba(14,13,11,0.7); margin: 0 0 22px;
          letter-spacing: 0.04em; }
        .lab-qr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; }
        @media (max-width: 600px) { .lab-qr-grid { grid-template-columns: 1fr; } }
        .lab-qr-snap, .lab-qr-code { margin: 0; text-align: center; }
        .lab-qr-snap img { width: 100%; aspect-ratio: 1; object-fit: cover;
          background: #0e0d0b; border-radius: 8px; }
        .lab-qr-code canvas { width: 100%; max-width: 320px; height: auto;
          background: #fff; border-radius: 8px; padding: 8px; box-sizing: border-box; }
        .lab-qr-snap figcaption, .lab-qr-code figcaption { font-size: 11px; margin-top: 8px;
          color: rgba(14,13,11,0.65); word-break: break-all; }
        .lab-qr-code figcaption a { color: rgba(14,13,11,0.85); text-decoration: underline;
          text-underline-offset: 3px; }
        .lab-qr-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 22px;
          padding-top: 18px; border-top: 1px solid rgba(14,13,11,0.12); }
        .lab-qr-actions .btn-link { font-size: 12px; padding: 8px 14px; border: 1px solid rgba(14,13,11,0.4);
          border-radius: 999px; background: transparent; cursor: pointer; color: #0e0d0b;
          text-decoration: none; letter-spacing: 0.06em; text-transform: uppercase; }
        .lab-qr-actions .btn-link:hover { background: #0e0d0b; color: #f6f2e8; }
        #labQrBtn { margin-top: 10px; width: 100%; }
      `;
      document.head.appendChild(style);
    }

    modal.addEventListener('click', (e) => {
      if (e.target.matches('[data-close]')) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.hidden) closeModal();
    });
    return modal;
  }

  function openModal() {
    const m = document.querySelector(modalSelector);
    if (m) m.hidden = false;
  }
  function closeModal() {
    const m = document.querySelector(modalSelector);
    if (m) m.hidden = true;
  }

  async function handleClick() {
    const lab = window.__hydroprintLab;
    if (!lab) return;
    ensureModal();

    const lang = document.body.getAttribute('data-lang') === 'en' ? 'en' : 'es';
    const spec = readSpec();
    const url = buildShareUrl(spec);
    const summary = specSummary(spec, lang);

    // Snapshot first (synchronous).
    const snapDataUrl = lab.snapshotHiRes ? lab.snapshotHiRes(1024, 1024) : lab.snapshot();
    const imgEl = document.getElementById('labQrSnapImg');
    if (imgEl) imgEl.src = snapDataUrl;

    const captionEl = document.getElementById('labQrSpecCaption');
    if (captionEl) captionEl.textContent = summary;

    const urlEl = document.getElementById('labQrUrl');
    if (urlEl) {
      urlEl.href = url;
      urlEl.textContent = url.length > 60 ? url.slice(0, 57) + '…' : url;
    }

    openModal();

    // QR (async, awaits CDN import). Render to existing canvas.
    try {
      const QR = await loadQR();
      const canvas = document.getElementById('labQrCanvas');
      await QR.toCanvas(canvas, url, {
        width: 320,
        margin: 1,
        color: { dark: '#0e0d0b', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });
      const qrDataUrl = canvas.toDataURL('image/png');
      const dl = document.getElementById('labQrDownloadQr');
      if (dl) dl.href = qrDataUrl;
    } catch (err) {
      console.warn('QR generation failed; falling back to URL only', err);
    }

    const dlSnap = document.getElementById('labQrDownloadSnap');
    if (dlSnap) dlSnap.href = snapDataUrl;

    const copyBtn = document.getElementById('labQrCopyUrl');
    if (copyBtn) {
      copyBtn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(url);
          const orig = copyBtn.textContent;
          copyBtn.textContent = lang === 'en' ? 'Copied' : 'Copiado';
          setTimeout(() => { copyBtn.textContent = orig; }, 1600);
        } catch {
          /* clipboard denied — user can still copy from the visible link */
        }
      };
    }
  }

  function init() {
    const btn = document.querySelector(btnSelector);
    if (!btn) return;
    btn.addEventListener('click', handleClick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
