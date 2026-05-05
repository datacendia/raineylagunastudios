// =====================================================================
// scripts/memory-object.js
// SIGNATURE 04 · THE OBJECT THAT REMEMBERS YOU
// Every Studios object ships with an embedded NFC chip. Tapping it with
// a phone opens a private page showing: order date, Lima weather that
// day, the manifesto's typographic weighting from that day, a 30-second
// timelapse of the specific object being fabricated.
// v0.2 is a demo — the "tap" button reveals a sample memory page so
// visitors can experience the mechanic without owning a physical piece.
// =====================================================================

// Sample memory fixture — this is "what one visitor would see if they
// tapped their object." In production each object has its own record.
const SAMPLE = {
  serial: 'RLS-LMJ9T-4X7K',
  productNumber: 47,
  productName: {
    es: 'Taza Conquistadores N.º 047',
    en: 'Conquistadores Mug №047',
  },
  orderDate: {
    es: '23 marzo 2026 · 14:07 (Lima)',
    en: '23 March 2026 · 14:07 (Lima)',
  },
  orderBlurb: {
    es: 'Encargada un lunes de garúa.',
    en: 'Ordered on a drizzle Monday.',
  },
  weather: {
    condition: { es: 'garúa persistente', en: 'persistent drizzle' },
    temp: 17,
    humidity: 89,
    cloud: 100,
    wind: 4,
  },
  typography: {
    wght: 468,
    opsz: 10,
    note: {
      es: 'El manifiesto estuvo más denso ese día — la humedad cerró el ojo de cada letra. Tu objeto fue hecho en una tarde en que el estudio leía despacio.',
      en: 'The manifesto was denser that day — humidity closed the eye of every letter. Your object was made on an afternoon when the studio was reading slowly.',
    },
  },
  fabrication: {
    printedAt: { es: '24 marzo 2026 · 09:12', en: '24 March 2026 · 09:12' },
    durationMin: 186,
    hydroprintSet: { es: 'Archivo #047 — tinta vermellón sobre cerámica cruda', en: 'File #047 — vermilion ink on raw ceramic' },
    operator: 'Stuart Rainey',
  },
  shipDate: { es: '26 marzo 2026', en: '26 March 2026' },
};

// ----- wire up --------------------------------------------------------------
function init() {
  const tapBtn   = document.getElementById('nfcTap');
  const memPage  = document.getElementById('memoryPage');
  const resetBtn = document.getElementById('memoryReset');
  if (!tapBtn || !memPage) return;

  let revealed = false;

  tapBtn.addEventListener('click', () => {
    if (revealed) return;
    revealed = true;
    tapBtn.setAttribute('aria-expanded', 'true');

    // Fake NFC "scanning" pulse for theatre — 800ms before reveal.
    tapBtn.classList.add('nfc-tap--scanning');
    setTimeout(() => {
      tapBtn.classList.remove('nfc-tap--scanning');
      render();
      memPage.hidden = false;
      requestAnimationFrame(() => memPage.classList.add('memory-page--in'));
    }, 820);
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      memPage.classList.remove('memory-page--in');
      memPage.hidden = true;
      revealed = false;
      tapBtn.setAttribute('aria-expanded', 'false');
    });
  }

  // Re-render on language change.
  const langObserver = new MutationObserver(() => { if (revealed) render(); });
  langObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  function render() {
    const lang = (document.documentElement.lang || 'es').startsWith('es') ? 'es' : 'en';
    const s = SAMPLE;

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

    set('memProductName', s.productName[lang]);
    set('memSerial',      s.serial);
    set('memOrderDate',   s.orderDate[lang]);
    set('memOrderBlurb',  s.orderBlurb[lang]);

    set('memWxCond',      s.weather.condition[lang]);
    set('memWxTemp',      s.weather.temp + '°C');
    set('memWxHum',       s.weather.humidity + '%');
    set('memWxCloud',     s.weather.cloud + '%');
    set('memWxWind',      s.weather.wind + ' km/h');

    set('memTypeWght',    'wght · ' + s.typography.wght);
    set('memTypeOpsz',    'opsz · ' + s.typography.opsz);
    set('memTypeNote',    s.typography.note[lang]);

    // Apply that day's typography to the manifesto echo so the visitor
    // actually SEES the typography as it was that day — not just reads about it.
    const echo = document.getElementById('memTypeEcho');
    if (echo) {
      echo.style.fontVariationSettings = `"wght" ${s.typography.wght}, "opsz" ${s.typography.opsz}, "SOFT" 60`;
    }

    set('memFabDate',     s.fabrication.printedAt[lang]);
    set('memFabDuration', s.fabrication.durationMin + ' min');
    set('memFabFile',     s.fabrication.hydroprintSet[lang]);
    set('memFabOperator', s.fabrication.operator);
    set('memShipDate',    s.shipDate[lang]);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
