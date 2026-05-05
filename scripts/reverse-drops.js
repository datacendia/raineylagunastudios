// =====================================================================
// scripts/reverse-drops.js
// SIGNATURE 04 (live drop half) · REVERSE COMMISSIONING
// Renders the current state of Studios's drop schedule:
//   · upcoming drop  → countdown + "join waitlist" CTA
//   · live drop      → grid of pre-fabricated pieces, each click-to-claim
//   · closed drop    → grid shown as sold, plus next-drop teaser
// Data: /data/drops.json
// =====================================================================
(function () {
  const root = document.getElementById('rcDrop');
  if (!root) return;

  const FORM_GLYPH = {
    mug: '◷', plate: '◯', vase: '⌬', coaster: '◫', panel: '▭'
  };
  const WA_BASE = 'https://wa.me/51912418482';

  const lang = () => document.body.getAttribute('data-lang') === 'en' ? 'en' : 'es';

  fetch('/data/drops.json')
    .then(r => r.json())
    .then(json => {
      const now = new Date();
      const drops = (json.drops || []).map(d => ({
        ...d,
        startsAt: new Date(d.starts),
        endsAt:   new Date(d.ends),
      }));

      // pick: live drop, else next upcoming, else last closed
      const live     = drops.find(d => d.startsAt <= now && d.endsAt >= now);
      const upcoming = drops.filter(d => d.startsAt > now).sort((a, b) => a.startsAt - b.startsAt)[0];
      const past     = drops.filter(d => d.endsAt < now).sort((a, b) => b.endsAt - a.endsAt)[0];

      const featured = live || upcoming || past;
      if (!featured) {
        root.innerHTML = `<div class="rc-drop-loading mono" style="font-size:11px;letter-spacing:2px;color:var(--bone-45);text-align:center;padding:32px 0">${lang()==='en'?'no drops scheduled yet':'sin tiradas programadas'}</div>`;
        return;
      }
      const meta = { waitlistSize: json.waitlist_size || 0 };
      render(featured, live ? 'live' : (upcoming ? 'upcoming' : 'closed'), meta);

      // re-render on language change so all copy swaps
      const mo = new MutationObserver(() => {
        render(featured, live ? 'live' : (upcoming ? 'upcoming' : 'closed'), meta);
      });
      mo.observe(document.body, { attributes: true, attributeFilter: ['data-lang'] });

      // tick countdown if upcoming
      if (upcoming && !live) {
        setInterval(() => {
          const cd = document.getElementById('rcCountdown');
          if (!cd) return;
          updateCountdown(upcoming.startsAt, cd);
        }, 1000);
      }
    })
    .catch(() => {
      root.innerHTML = `<div class="rc-drop-loading mono" style="font-size:11px;letter-spacing:2px;color:var(--bone-45);text-align:center;padding:32px 0">· data/drops.json unavailable ·</div>`;
    });

  function render(drop, state, meta) {
    const L = lang();
    const name    = L === 'en' ? drop.name_en   : drop.name_es;
    const tagline = L === 'en' ? drop.tagline_en : drop.tagline_es;
    const startsTxt = drop.startsAt.toLocaleDateString(L === 'en' ? 'en-GB' : 'es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
    const endsTxt   = drop.endsAt.toLocaleDateString(L === 'en' ? 'en-GB' : 'es-PE', { day: 'numeric', month: 'long' });

    let stateLabel = '';
    if (state === 'live')     stateLabel = L === 'en' ? '● live now' : '● en vivo';
    if (state === 'upcoming') stateLabel = L === 'en' ? 'next drop'  : 'próxima tirada';
    if (state === 'closed')   stateLabel = L === 'en' ? 'closed'     : 'cerrada';

    const head = `
      <div class="rc-drop-head">
        <span class="rc-drop-state ${state}">${stateLabel}</span>
        <h3 class="rc-drop-name">DROP · <em>${escapeHtml(name)}</em></h3>
      </div>
      <p class="rc-drop-tagline">${escapeHtml(tagline)}</p>
    `;

    let body = '';
    if (state === 'upcoming') {
      body = `
        <div class="rc-drop-countdown" id="rcCountdown" aria-live="polite"></div>
        <div class="rc-drop-meta">
          <strong>${escapeHtml(startsTxt)}</strong> · ${L === 'en' ? 'window' : 'ventana'} <strong>${(drop.endsAt - drop.startsAt) / (1000*60*60*24)} ${L === 'en' ? 'days' : 'días'}</strong> · ${drop.pieces.length} ${L === 'en' ? (drop.pieces.length === 1 ? 'piece' : 'pieces') : (drop.pieces.length === 1 ? 'pieza' : 'piezas')} · ${meta.waitlistSize} ${L === 'en' ? 'on waitlist' : 'en lista de espera'}
        </div>
        <div class="rc-drop-actions">
          <a class="primary" href="${waitlistLink(drop)}" target="_blank" rel="noopener">${L === 'en' ? 'Join waitlist →' : 'Entrar a la lista de espera →'}</a>
          <a href="#commission-preview-${drop.id}" onclick="document.getElementById('rcDropPreview').open=true;return false;">${L === 'en' ? 'Preview pieces ↓' : 'Vista previa de piezas ↓'}</a>
        </div>
        ${drop.pieces.length ? `
          <details id="rcDropPreview" style="margin-top:24px">
            <summary style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:2px;color:var(--bone-45);cursor:pointer;text-transform:uppercase">${L === 'en' ? `${drop.pieces.length} pieces preview` : `vista de ${drop.pieces.length} piezas`}</summary>
            <div class="rc-pieces" style="margin-top:14px">${drop.pieces.map(p => piece(p, drop, false)).join('')}</div>
          </details>
        ` : ''}
      `;
    } else if (state === 'live') {
      body = `
        <div class="rc-drop-meta">
          <strong>${escapeHtml(startsTxt)}</strong> → ${escapeHtml(endsTxt)} · ${drop.pieces.filter(p => p.status === 'available').length} / ${drop.pieces.length} ${L === 'en' ? 'available' : 'disponibles'}
        </div>
        <div class="rc-pieces">${drop.pieces.map(p => piece(p, drop, true)).join('')}</div>
      `;
    } else {
      body = `
        <div class="rc-drop-meta">
          <strong>${escapeHtml(startsTxt)}</strong> → ${escapeHtml(endsTxt)} · ${L === 'en' ? 'closed' : 'cerrada'} · ${drop.pieces.filter(p => p.status === 'available').length === 0 ? (L === 'en' ? 'all sold' : 'todo vendido') : ''}
        </div>
        <div class="rc-pieces">${drop.pieces.map(p => piece({ ...p, status: 'sold' }, drop, false)).join('')}</div>
        <div class="rc-drop-actions" style="margin-top:24px">
          <a class="primary" href="${waitlistLink(drop)}" target="_blank" rel="noopener">${L === 'en' ? 'Notify me of next drop →' : 'Avísame del próximo →'}</a>
        </div>
      `;
    }

    root.innerHTML = head + body;

    if (state === 'upcoming') {
      updateCountdown(drop.startsAt, document.getElementById('rcCountdown'));
    }
  }

  function piece(p, drop, claimable) {
    const L = lang();
    const name = L === 'en' ? p.name_en : p.name_es;
    const sold = p.status !== 'available';
    const claim = claimable && !sold
      ? `<a class="rc-piece-claim" href="${claimLink(p, drop)}" target="_blank" rel="noopener">${L === 'en' ? 'Claim →' : 'Reservar →'}</a>`
      : `<span class="rc-piece-claim sold-tag">${L === 'en' ? (sold ? 'sold' : 'preview') : (sold ? 'vendida' : 'vista previa')}</span>`;
    return `
      <div class="rc-piece${sold ? ' sold' : ''}">
        <div class="rc-piece-thumb"><span class="form-glyph">${FORM_GLYPH[p.form] || '◇'}</span></div>
        <span class="rc-piece-ref">${escapeHtml(p.ref)}</span>
        <div class="rc-piece-name">${escapeHtml(name)}</div>
        <div class="rc-piece-pattern">${escapeHtml(p.pattern)}</div>
        <div class="rc-piece-foot">
          <span class="rc-piece-price">S/ ${p.price_pen}</span>
          ${claim}
        </div>
      </div>`;
  }

  function updateCountdown(target, el) {
    if (!el) return;
    const L = lang();
    const diff = Math.max(0, target - new Date());
    const d = Math.floor(diff / 86400000);
    const h = Math.floor(diff / 3600000) % 24;
    const m = Math.floor(diff / 60000) % 60;
    const s = Math.floor(diff / 1000) % 60;
    const items = [
      { num: d, lbl: L === 'en' ? 'days'  : 'días' },
      { num: h, lbl: L === 'en' ? 'hours' : 'horas' },
      { num: m, lbl: L === 'en' ? 'min'   : 'min' },
      { num: s, lbl: L === 'en' ? 'sec'   : 'seg' },
    ];
    el.innerHTML = items.map(i => `
      <div class="rc-cd"><div class="num">${String(i.num).padStart(2, '0')}</div><div class="lbl">${i.lbl}</div></div>
    `).join('');
  }

  function claimLink(p, drop) {
    const L = lang();
    const lines = L === 'en'
      ? [
          `Hi Stuart — I want to claim a piece from drop "${drop.name_en}":`,
          ``,
          `· Ref: ${p.ref}`,
          `· Object: ${p.name_en}`,
          `· Price: S/ ${p.price_pen}`,
          `· Pattern: ${p.pattern}`,
          ``,
          `Is it still available?`
        ]
      : [
          `Hola Stuart — quiero reservar una pieza del drop "${drop.name_es}":`,
          ``,
          `· Ref: ${p.ref}`,
          `· Objeto: ${p.name_es}`,
          `· Precio: S/ ${p.price_pen}`,
          `· Patrón: ${p.pattern}`,
          ``,
          `¿Sigue disponible?`
        ];
    return WA_BASE + '?text=' + encodeURIComponent(lines.join('\n'));
  }

  function waitlistLink(drop) {
    const L = lang();
    const txt = L === 'en'
      ? `Hi Stuart — add me to the waitlist for drop "${drop.name_en}". Notify me ${drop.preview_drops_at ? 'when previews drop on ' + new Date(drop.preview_drops_at).toLocaleDateString('en-GB') + '.' : 'when the drop opens.'}`
      : `Hola Stuart — agrégame a la lista de espera para el drop "${drop.name_es}". Avísame ${drop.preview_drops_at ? 'cuando salga la vista previa el ' + new Date(drop.preview_drops_at).toLocaleDateString('es-PE') + '.' : 'cuando abra la tirada.'}`;
    return WA_BASE + '?text=' + encodeURIComponent(txt);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
})();
