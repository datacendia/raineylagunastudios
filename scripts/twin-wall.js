// =====================================================================
// SIGNATURE 06 · THE FABRICATION TWIN WALL
// Every object the studio makes is fabricated twice. One goes to the
// client. The other joins this wall. This module renders the live wall
// state from data/twins.json as a CSS grid, with empty cells visible so
// the wall always reads as "growing."
// =====================================================================

const LANG = () => (document.documentElement.lang || 'es').startsWith('es') ? 'es' : 'en';

// Escape any text that lands inside HTML produced via innerHTML. The wall
// reads from data/twins.json which is a controlled artefact today, but the
// pipeline is open to client-supplied photo URLs and names; treating every
// JSON field as untrusted is the only durable posture.
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// Validate an image URL before letting it land inside a CSS url(). Only
// allow http(s) absolute URLs and root-relative paths; reject javascript:,
// data: (with the lone exception of data:image/* if you ever need it),
// quotes, parentheses, semicolons, or anything that could break out of the
// CSS string. Returns "" on rejection so the caller falls back to color.
function safeImageUrl(raw) {
  if (typeof raw !== 'string' || !raw) return '';
  if (/[\s'"();\\]/.test(raw)) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('/') || raw.startsWith('./') || raw.startsWith('../')) return raw;
  return '';
}

function formatDate(iso) {
  try {
    const locale = LANG() === 'es' ? 'es-PE' : 'en-GB';
    return new Intl.DateTimeFormat(locale, {
      timeZone: 'America/Lima', day: '2-digit', month: 'short', year: 'numeric'
    }).format(new Date(iso));
  } catch { return iso; }
}

async function loadManifest() {
  const res = await fetch('data/twins.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error('twins manifest missing');
  return await res.json();
}

function renderWall(mount, manifest) {
  const lang = LANG();
  const capacity = manifest.wall_meta.capacity || 48;
  const twins = manifest.twins || [];
  const occupied = twins.length;
  const remaining = Math.max(0, capacity - occupied);

  // Statement + meta strip
  const statement = lang === 'es' ? manifest.wall_meta.statement_es : manifest.wall_meta.statement_en;
  const workshop  = lang === 'es' ? manifest.wall_meta.workshop_es : manifest.wall_meta.workshop_en;

  // Cells
  const cellMarkup = [];
  for (const t of twins) {
    const name = t.consented_public ? t.client : (lang === 'es' ? 'Reservado' : 'Private');
    const obj  = lang === 'es' ? t.object_es : t.object_en;
    const mat  = lang === 'es' ? t.material_es : t.material_en;
    const date = formatDate(t.fabricated_on);
    const href = t.proof_serial ? `verify.html?serial=${encodeURIComponent(t.proof_serial)}` : null;
    const safeImg = safeImageUrl(t.image_url);
    // Restrict fallback_color to a hex literal so it cannot break out of the
    // style attribute via "}; expression(..." or stray quotes.
    const fallback = /^#[0-9a-fA-F]{3,8}$/.test(t.fallback_color || '') ? t.fallback_color : '#3a3631';
    const bg = safeImg
      ? `background-image:url('${safeImg}');background-size:cover;background-position:center;`
      : `background:${fallback};`;

    const inner = `
      <span class="twin-fill" style="${bg}"></span>
      <span class="twin-meta">
        <span class="twin-client">${escapeHtml(name)}</span>
        <span class="twin-obj">${escapeHtml(obj)}</span>
        <span class="twin-date">${escapeHtml(date)} · ${escapeHtml(mat)}</span>
      </span>
      <span class="twin-serial mono">${escapeHtml(t.serial || '')}</span>
    `;
    cellMarkup.push(href
      ? `<a class="twin-cell twin-cell--filled" href="${escapeHtml(href)}">${inner}</a>`
      : `<div class="twin-cell twin-cell--filled">${inner}</div>`);
  }
  for (let i = 0; i < remaining; i++) {
    cellMarkup.push(`<div class="twin-cell twin-cell--empty" aria-hidden="true"></div>`);
  }

  mount.innerHTML = `
    <div class="twin-statement">
      <p class="twin-quote">${escapeHtml(statement)}</p>
      <div class="twin-stat">
        <span class="twin-stat-num">${String(occupied).padStart(3, '0')}</span>
        <span class="twin-stat-cap"> / ${String(capacity).padStart(3, '0')}</span>
        <span class="twin-stat-lbl">${lang === 'es' ? 'piezas en el muro' : 'pieces on the wall'}</span>
      </div>
    </div>
    <div class="twin-wall-grid" role="grid" aria-label="${lang === 'es' ? 'Muro del gemelo' : 'Twin wall'}">
      ${cellMarkup.join('')}
    </div>
    <p class="twin-foot mono">
      ${lang === 'es' ? 'Última fotografía del muro' : 'Wall last photographed'}: ${escapeHtml(formatDate(manifest.wall_meta.last_photographed))} · ${escapeHtml(workshop)}
    </p>
  `;
}

async function init() {
  const mount = document.getElementById('twinWall');
  if (!mount) return;
  try {
    const manifest = await loadManifest();
    renderWall(mount, manifest);
    // Re-render on language toggle
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#langEs, #langEn')) return;
      setTimeout(() => renderWall(mount, manifest), 20);
    });
  } catch (e) {
    console.warn('[twin-wall]', e);
    mount.innerHTML = `<p class="mono" style="color:var(--bone-45);font-size:11px">— wall manifest unavailable —</p>`;
  }
}

init();
