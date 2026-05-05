// =====================================================================
// SIGNATURE 06 · THE FABRICATION TWIN WALL
// Every object the studio makes is fabricated twice. One goes to the
// client. The other joins this wall. This module renders the live wall
// state from data/twins.json as a CSS grid, with empty cells visible so
// the wall always reads as "growing."
// =====================================================================

const LANG = () => (document.documentElement.lang || 'es').startsWith('es') ? 'es' : 'en';

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
    const bg = t.image_url
      ? `background-image:url('${t.image_url}');background-size:cover;background-position:center;`
      : `background:${t.fallback_color || '#3a3631'};`;

    const inner = `
      <span class="twin-fill" style="${bg}"></span>
      <span class="twin-meta">
        <span class="twin-client">${name}</span>
        <span class="twin-obj">${obj}</span>
        <span class="twin-date">${date} · ${mat}</span>
      </span>
      <span class="twin-serial mono">${t.serial || ''}</span>
    `;
    cellMarkup.push(href
      ? `<a class="twin-cell twin-cell--filled" href="${href}">${inner}</a>`
      : `<div class="twin-cell twin-cell--filled">${inner}</div>`);
  }
  for (let i = 0; i < remaining; i++) {
    cellMarkup.push(`<div class="twin-cell twin-cell--empty" aria-hidden="true"></div>`);
  }

  mount.innerHTML = `
    <div class="twin-statement">
      <p class="twin-quote">${statement}</p>
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
      ${lang === 'es' ? 'Última fotografía del muro' : 'Wall last photographed'}: ${formatDate(manifest.wall_meta.last_photographed)} · ${workshop}
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
