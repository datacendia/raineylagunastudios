// =====================================================================
// scripts/reverse-commissioning.js
// SIGNATURE 03 · REVERSE COMMISSIONING
// Visitors don't approach us with a brief — we approach them.
// Type your business name + category and the studio returns a formatted,
// unsolicited critique-and-proposal in the house brief template.
// In v0.2 this is deterministic templating with rich category libraries;
// v0.3 will replace the templater with a real LLM wired to Vigía data.
// =====================================================================

// ----- Category knowledge base ----------------------------------------------
const KB = {
  cafe: {
    label: { es: 'Café / Cafetería', en: 'Café / Coffeeshop' },
    observations: {
      es: [
        'Los cafés de especialidad en Lima compiten en el mismo espacio visual desde 2021: pizarra negra con tiza blanca, logo en Futura o Mrs Eaves, filtros V60 y balanza en la barra frontal. {NAME} tiene la oportunidad de salir de esa plantilla — no por ser distinto por distinto, sino por tener un punto de vista propio.',
        'La diferenciación en cafetería limeña ya casi no pasa por el origen del grano. Los buenos cafés compran a los mismos beneficios en Junín y Cajamarca. Pasa por cómo la marca llega a la mesa: la taza, el posavasos, la bolsa para llevar, el papel donde se entrega la cuenta.',
        'Vemos que {NAME} opera en un distrito con densidad alta de cafés de especialidad (estimamos 6–9 competidores directos en un radio de 500m). Los tres vecinos más cercanos tienen presencia digital similar. La diferencia real se hará en el plano físico — lo que el cliente toca, huele y se lleva.',
      ],
      en: [
        'Specialty coffee in Lima has been competing in the same visual territory since 2021: black chalkboard, Futura or Mrs Eaves logo, V60 filters and a pour-over scale at the front bar. {NAME} has a chance to step out of that template — not to be different for the sake of it, but to own a point of view.',
        'Differentiation in Lima coffee almost no longer happens at the bean — the good shops all buy from the same Junín and Cajamarca cooperatives. It happens in how the brand reaches the table: the cup, the coaster, the takeaway bag, the paper the bill is printed on.',
        "We see {NAME} operates in a district dense with specialty cafés (estimated 6–9 direct competitors within 500m). The three closest neighbours have similar digital presence. The real difference will be made in the physical plane — what the customer touches, smells, and takes home.",
      ],
    },
    problems: {
      es: [
        'Logotipo que nació en Instagram y no aguanta impreso por debajo de 40mm — común cuando la marca se diseñó primero para el móvil.',
        'Cartas plastificadas que se ensucian en tres semanas, se terminan corrigiendo a lápiz, y pierden dignidad visual rápido.',
        'Tazas genéricas de proveedor importado, sin marca propia — la experiencia de marca se corta en la fachada.',
        'Packaging para llevar que no se distingue del genérico blanco: vaso sin detalle, banda de papel barato, sin ningún objeto que cuente la historia fuera del local.',
        'Señalética hecha en vinilo por el mismo proveedor que le imprime la placa al gimnasio de al lado — cero diferenciación táctil.',
      ],
      en: [
        'Logo born on Instagram that breaks below 40mm in print — common when the brand was designed phone-first.',
        'Laminated menus that get dirty in three weeks, end up corrected in pencil, and lose visual dignity fast.',
        'Generic imported cups without house branding — the brand experience stops at the facade.',
        "Takeaway packaging indistinguishable from the generic white: cup with no detail, cheap paper sleeve, nothing that carries the story outside the shop.",
        'Signage cut in vinyl by the same supplier who did the gym next door — zero tactile differentiation.',
      ],
    },
    program: {
      es: [
        { phase: 'Identidad de raíz — logo, sistema tipográfico, paleta, voz', time: '4 semanas', cost: 'S/ 2,500' },
        { phase: 'Carta impresa + papelería (tiraje inicial 500 uds)', time: '2 semanas', cost: 'S/ 1,200' },
        { phase: 'Taza propia hidroprinteada (40 uds iniciales) + posavasos', time: '3 semanas', cost: 'S/ 1,800' },
      ],
      en: [
        { phase: 'Brand from the root — logo, type system, palette, voice', time: '4 weeks', cost: 'S/ 2,500' },
        { phase: 'Printed menu + stationery (initial run 500 units)', time: '2 weeks', cost: 'S/ 1,200' },
        { phase: 'House-hydroprinted mug (initial 40 units) + coasters', time: '3 weeks', cost: 'S/ 1,800' },
      ],
    },
    total: { es: 'S/ 5,500 – S/ 7,800', en: 'S/ 5,500 – S/ 7,800' },
    timeline: { es: '9 semanas de punta a punta', en: '9 weeks end to end' },
  },

  restaurant: {
    label: { es: 'Restaurante', en: 'Restaurant' },
    observations: {
      es: [
        'Los restaurantes independientes en Lima ganan o pierden en dos superficies: la carta y el plato. {NAME} probablemente invierte rigor en el segundo. La pregunta es cuánto ha invertido en el primero.',
        'Observamos un patrón limeño: carta elaborada con cariño, impresa por Ripley en bond 120g, plastificada con laminadora de bazar. El contenido es del chef; la fabricación no. Ese hueco es nuestro terreno.',
        'En un distrito con este perfil, el 70% de las decisiones de cena se toman antes de cruzar la puerta — por Instagram, Google o boca a boca. La carta física importa, pero la primera carta que el comensal ve es la digital. {NAME} necesita consistencia entre las dos.',
      ],
      en: [
        "Independent restaurants in Lima win or lose on two surfaces: the menu and the plate. {NAME} probably puts rigour into the second. Question is how much has gone into the first.",
        "We see a pattern across Lima: menus crafted carefully by the chef, printed at Ripley on 120g bond, laminated at a bazaar. The content is the chef's; the fabrication isn't. That gap is our territory.",
        "In a district with this profile, 70% of dinner decisions are made before the door — on Instagram, Google, word of mouth. The physical menu matters, but the first menu the diner sees is digital. {NAME} needs consistency between the two.",
      ],
    },
    problems: {
      es: [
        'Carta impresa con tipografía distinta a la de la fachada — el comensal no siente que está en la misma marca.',
        'Platos servidos sobre vajilla genérica de proveedor mayorista — misma blanca redonda que el restaurante de la cuadra.',
        'Uniforme del personal sin identidad visual — delantales negros lisos, logo estampado por el mismo proveedor que le hace las camisetas al call center.',
        'Packaging de delivery que llega despedazado y sin marca — 40% del volumen total se entrega sin ninguna experiencia visual de marca.',
      ],
      en: [
        'Printed menu in a typeface that does not match the facade — diner does not feel they are in the same brand.',
        'Plates served on generic wholesale tableware — same round white as the restaurant on the next block.',
        'Staff uniform with no visual identity — plain black aprons, logo printed by the same vendor who makes call-centre T-shirts.',
        'Delivery packaging arriving crushed and unbranded — up to 40% of total volume delivered with zero brand experience.',
      ],
    },
    program: {
      es: [
        { phase: 'Auditoría y rediseño de identidad completa', time: '5 semanas', cost: 'S/ 3,200' },
        { phase: 'Sistema de carta + papelería + señalética', time: '3 semanas', cost: 'S/ 1,800' },
        { phase: 'Packaging de delivery + vajilla hidroprinteada de firma', time: '4 semanas', cost: 'S/ 2,400' },
      ],
      en: [
        { phase: 'Audit and full identity redesign', time: '5 weeks', cost: 'S/ 3,200' },
        { phase: 'Menu system + stationery + signage', time: '3 weeks', cost: 'S/ 1,800' },
        { phase: 'Delivery packaging + house-hydroprinted signature tableware', time: '4 weeks', cost: 'S/ 2,400' },
      ],
    },
    total: { es: 'S/ 7,400 – S/ 9,800', en: 'S/ 7,400 – S/ 9,800' },
    timeline: { es: '12 semanas de punta a punta', en: '12 weeks end to end' },
  },

  fitness: {
    label: { es: 'Gimnasio / Estudio de fitness', en: 'Gym / Fitness studio' },
    observations: {
      es: [
        'El boutique fitness limeño (crossfit, yoga, pilates, funcional) vive una paradoja: la experiencia física es premium, pero la marca visual suele ser de stock — pantallas con logos genéricos, pintura negra, neón rojo, nombres en inglés. {NAME} puede tener un punto de vista propio sin abandonar el género.',
        'Desde 2024 observamos que los estudios que mejor crecen en Lima son los que traducen su filosofía en objetos: toallas con firma, botellas reutilizables de marca, mochilas de tela con tejido propio. El fitness se come el merchandising.',
        'La diferenciación de {NAME} no va a venir del equipamiento — todos comprarán eventualmente los mismos racks de Rogue. Va a venir del sistema visual y de los objetos que el alumno se lleva a casa.',
      ],
      en: [
        "Lima boutique fitness (crossfit, yoga, pilates, functional) lives a paradox: the physical experience is premium, the visual brand is usually stock — screens with generic logos, black paint, red neon, English names. {NAME} can hold a point of view without abandoning the genre.",
        "Since 2024 we have seen the studios that grow best in Lima are the ones that translate their philosophy into objects: signature towels, branded reusable bottles, cloth bags with their own weave. Fitness eats merchandising.",
        "{NAME}'s differentiation won't come from equipment — everyone eventually buys the same Rogue racks. It comes from the visual system and the objects the member takes home.",
      ],
    },
    problems: {
      es: [
        'Logo hecho por un ex-alumno diseñador que ya no vive en el país — sin archivos editables, sin sistema, imposible de actualizar.',
        'Polos y merchandising encargados a proveedor de confección masiva — la tela delata y la marca no llega al nivel de aspiración del servicio.',
        'Comunicación interna (horarios, clases, reglas) resuelta en Canva por el recepcionista — inconsistencia que el miembro premium nota de inmediato.',
        'Sin objeto físico de marca para entregar al alumno nuevo — se pierde el ritual de onboarding que los buenos estudios sí tienen.',
      ],
      en: [
        'Logo done by an ex-member designer who no longer lives in the country — no editable files, no system, impossible to update.',
        'Shirts and merchandise commissioned from mass-apparel suppliers — fabric gives it away and the brand falls short of the aspiration of the service.',
        'Internal comms (schedules, class names, rules) done in Canva by the receptionist — an inconsistency the premium member notices immediately.',
        "No physical brand object to give the new member — the onboarding ritual the best studios do is missing here.",
      ],
    },
    program: {
      es: [
        { phase: 'Reconstrucción de identidad — logo, sistema, archivo maestro', time: '4 semanas', cost: 'S/ 2,800' },
        { phase: 'Kit de onboarding del miembro (botella hidroprinteada + pin 3D + manual impreso)', time: '3 semanas', cost: 'S/ 2,200' },
        { phase: 'Comunicación interna + señalética + ropa de staff', time: '3 semanas', cost: 'S/ 1,500' },
      ],
      en: [
        { phase: 'Identity rebuild — logo, system, master archive', time: '4 weeks', cost: 'S/ 2,800' },
        { phase: 'Member onboarding kit (hydroprinted bottle + 3D pin + printed manual)', time: '3 weeks', cost: 'S/ 2,200' },
        { phase: 'Internal comms + signage + staff apparel', time: '3 weeks', cost: 'S/ 1,500' },
      ],
    },
    total: { es: 'S/ 6,500 – S/ 9,200', en: 'S/ 6,500 – S/ 9,200' },
    timeline: { es: '10 semanas de punta a punta', en: '10 weeks end to end' },
  },

  wellness: {
    label: { es: 'Spa / Wellness / Estética', en: 'Spa / Wellness / Aesthetics' },
    observations: {
      es: [
        'El wellness limeño (spa, estética, terapias) compite por un mismo cliente que busca calma. La paradoja: muchas marcas del sector gritan visualmente — rosas saturados, letras script, fotografía de stock. Lo que se vende (silencio, cuidado) es lo opuesto a cómo se comunica.',
        'Observamos que los espacios wellness que mejor retienen clientes en Lima son los que cuidan el olfato, el tacto del papel, la textura del empaque. No el feed de Instagram. El lujo reservado y consistente pesa más que el brillo.',
        'Para {NAME}, la oportunidad está en diseñar el silencio — una marca que no necesita gritar porque sabe lo que vale.',
      ],
      en: [
        "Lima wellness (spa, aesthetics, therapies) competes for a customer seeking calm. The paradox: many sector brands visually shout — saturated pinks, script type, stock photography. What is sold (silence, care) is the opposite of how it is communicated.",
        "We see that the wellness spaces best retaining customers in Lima are the ones that care about scent, paper touch, packaging texture. Not the Instagram feed. Reserved consistent luxury weighs more than shine.",
        "For {NAME}, the opportunity is in designing the silence — a brand that doesn't need to shout because it knows what it's worth.",
      ],
    },
    problems: {
      es: [
        'Logo con degradado y tipografía script que se lee bien en Instagram pero se pierde en papel texturizado.',
        'Packaging del producto de tratamiento en cajas genéricas con sticker pegado — el cliente premium lo nota y lo registra.',
        'Tarjetas de citas impresas en papel bond 90g — no tienen peso ni tacto, se doblan en la cartera.',
        'Recepción sin objeto firma — el cliente no se lleva nada físico que recuerde la experiencia y la comparta.',
      ],
      en: [
        'Logo with gradient and script type that reads well on Instagram but is lost on textured paper.',
        'Treatment-product packaging in generic boxes with stuck-on stickers — the premium customer notices and remembers.',
        'Appointment cards printed on 90g bond — no weight, no touch, folded in the wallet within an hour.',
        'Reception without signature object — the client takes nothing physical that remembers the experience and shares it.',
      ],
    },
    program: {
      es: [
        { phase: 'Rediseño de identidad hacia el lujo reservado', time: '5 semanas', cost: 'S/ 3,200' },
        { phase: 'Packaging premium (caja impresa + papel envoltorio propio)', time: '4 semanas', cost: 'S/ 2,800' },
        { phase: 'Objeto firma hidroprinteado + papelería', time: '3 semanas', cost: 'S/ 1,900' },
      ],
      en: [
        { phase: 'Identity redesign toward reserved luxury', time: '5 weeks', cost: 'S/ 3,200' },
        { phase: 'Premium packaging (printed box + house wrapping paper)', time: '4 weeks', cost: 'S/ 2,800' },
        { phase: 'Hydroprinted signature object + stationery', time: '3 weeks', cost: 'S/ 1,900' },
      ],
    },
    total: { es: 'S/ 7,900 – S/ 10,400', en: 'S/ 7,900 – S/ 10,400' },
    timeline: { es: '12 semanas de punta a punta', en: '12 weeks end to end' },
  },

  boutique: {
    label: { es: 'Boutique / Retail', en: 'Boutique / Retail' },
    observations: {
      es: [
        'El retail boutique limeño compite en un espacio emocional: el cliente quiere sentir que descubrió algo. Ese descubrimiento se construye con la fachada, la bolsa que se lleva, la etiqueta del producto — capas que muchas tiendas dejan al azar.',
        'Vemos una divergencia clara entre boutiques que invierten en interiorismo pero no en marca gráfica, y boutiques que invierten en marca gráfica pero no en interiorismo. Las que crecen son las que hacen ambas cosas con coherencia.',
        'Para {NAME}, la apuesta está en el viaje completo: desde cómo se ve el Instagram al cómo se abre la bolsa en casa. Un sistema, no piezas sueltas.',
      ],
      en: [
        "Lima boutique retail competes in an emotional space: the customer wants to feel they discovered something. That discovery is built from facade, bag, product tag — layers many stores leave to chance.",
        "We see a clear split between boutiques that invest in interiors but not in graphic brand, and those that invest in graphic brand but not in interiors. The ones that grow do both coherently.",
        "For {NAME} the bet is the full journey: from how Instagram looks to how the bag is opened at home. A system, not loose pieces.",
      ],
    },
    problems: {
      es: [
        'Bolsa de la tienda genérica de proveedor — el cliente se va con Zara en la mano aunque compró una pieza única.',
        'Etiquetas de producto impresas con impresora de oficina — se sienten de bazar.',
        'Fachada bien trabajada pero sin firma tipográfica — la tienda compite visualmente con un vecino y pierde la batalla del recuerdo.',
        'Sin objeto de fidelización — el cliente recurrente no recibe nada que marque su permanencia.',
      ],
      en: [
        'Generic supplier bags — the customer leaves holding a Zara-style bag despite buying a one-off piece.',
        'Product tags printed on office inkjet — they feel bazaar-grade.',
        'Well-worked facade but no typographic signature — the store competes visually with a neighbour and loses the memory battle.',
        'No loyalty object — the returning customer receives nothing that marks their return.',
      ],
    },
    program: {
      es: [
        { phase: 'Sistema de marca + firma tipográfica propia', time: '4 semanas', cost: 'S/ 2,600' },
        { phase: 'Packaging completo (bolsa + etiqueta + tissue + tarjeta)', time: '3 semanas', cost: 'S/ 2,000' },
        { phase: 'Objeto de fidelización hidroprinteado (pin, llavero o placa)', time: '3 semanas', cost: 'S/ 1,400' },
      ],
      en: [
        { phase: 'Brand system + house typographic signature', time: '4 weeks', cost: 'S/ 2,600' },
        { phase: 'Full packaging (bag + tag + tissue + card)', time: '3 weeks', cost: 'S/ 2,000' },
        { phase: 'Hydroprinted loyalty object (pin, keyring, or plaque)', time: '3 weeks', cost: 'S/ 1,400' },
      ],
    },
    total: { es: 'S/ 6,000 – S/ 8,200', en: 'S/ 6,000 – S/ 8,200' },
    timeline: { es: '10 semanas de punta a punta', en: '10 weeks end to end' },
  },

  school: {
    label: { es: 'Escuela / Taller / Educación', en: 'School / Workshop / Education' },
    observations: {
      es: [
        'La educación independiente en Lima (talleres, escuelas pequeñas, cursos) vende confianza. Esa confianza se construye con consistencia visual durante meses y años, no con una campaña.',
        'Observamos que los proyectos educativos que crecen son los que tratan a cada documento — el certificado, el syllabus, el recordatorio de clase — como parte de una conversación continua con la marca. No como PDFs sueltos.',
        'Para {NAME}, la identidad no termina en el logo. Termina en el tacto del certificado que el alumno enmarca en casa.',
      ],
      en: [
        "Independent education in Lima (workshops, small schools, courses) sells trust. That trust is built with visual consistency over months and years, not a campaign.",
        "We see the educational projects that grow are those that treat every document — the certificate, the syllabus, the class reminder — as part of a continuous conversation with the brand. Not loose PDFs.",
        "For {NAME}, identity does not end at the logo. It ends at the feel of the certificate the student frames at home.",
      ],
    },
    problems: {
      es: [
        'Certificados impresos en papel fotocopia — el documento no da peso al logro del alumno.',
        'Comunicación por WhatsApp sin plantilla visual — cada mensaje se ve distinto.',
        'Material impreso del curso (manuales, worksheets) hecho en Word — la credibilidad pedagógica se resiente.',
        'Sin objeto físico de pertenencia — los egresados no tienen nada tangible que los una a la comunidad.',
      ],
      en: [
        "Certificates printed on photocopy paper — the document gives no weight to the student's achievement.",
        'WhatsApp communication without visual template — each message looks different.',
        'Printed course material (manuals, worksheets) made in Word — pedagogical credibility suffers.',
        'No physical belonging object — graduates have nothing tangible that ties them to the community.',
      ],
    },
    program: {
      es: [
        { phase: 'Identidad + sistema documental completo', time: '4 semanas', cost: 'S/ 2,400' },
        { phase: 'Certificado, syllabus, worksheet — imprentados, no PDF', time: '3 semanas', cost: 'S/ 1,600' },
        { phase: 'Objeto de pertenencia para egresados (pin 3D + placa de pared)', time: '3 semanas', cost: 'S/ 1,500' },
      ],
      en: [
        { phase: 'Identity + complete document system', time: '4 weeks', cost: 'S/ 2,400' },
        { phase: 'Certificate, syllabus, worksheet — printed, not PDF', time: '3 weeks', cost: 'S/ 1,600' },
        { phase: 'Belonging object for graduates (3D pin + wall plaque)', time: '3 weeks', cost: 'S/ 1,500' },
      ],
    },
    total: { es: 'S/ 5,500 – S/ 7,400', en: 'S/ 5,500 – S/ 7,400' },
    timeline: { es: '10 semanas de punta a punta', en: '10 weeks end to end' },
  },
};

// ----- templating -----------------------------------------------------------
function pick(arr, seed) {
  // Deterministic pick so the same name + category always yields the same brief.
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
}

function renderBrief(name, category, lang) {
  const kb = KB[category];
  if (!kb) return null;

  const obs = pick(kb.observations[lang], name).replace(/{NAME}/g, `<strong>${escapeHtml(name)}</strong>`);
  const problems = kb.problems[lang].slice(0, 4);
  const program = kb.program[lang];
  const total = kb.total[lang];
  const timeline = kb.timeline[lang];
  const today = new Date().toLocaleDateString(lang === 'es' ? 'es-PE' : 'en-GB', {
    day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Lima',
  });

  const i18n = lang === 'es' ? {
    to: 'PARA',
    from: 'DE',
    date: 'FECHA',
    ref: 'REF',
    preamble: 'Esto es un briefing no solicitado. Ustedes no nos contactaron. Nosotros les escribimos primero. Pueden descartarlo — sin ofensa.',
    obsH: 'OBSERVACIÓN',
    probH: 'LO QUE PROBABLEMENTE NO ESTÁ FUNCIONANDO',
    progH: 'LO QUE HARÍAMOS',
    invH: 'INVERSIÓN APROXIMADA',
    plazoH: 'PLAZO TOTAL',
    footer: 'Generado automáticamente por el sistema del estudio usando señales públicas. Stuart revisa toda respuesta antes de contestar. Nada obliga a nadie. Si quieren conversar, responden.',
    cta1: 'Continuar la conversación',
    cta2: 'Gracias, pero no',
    regen: 'Regenerar briefing',
  } : {
    to: 'TO',
    from: 'FROM',
    date: 'DATE',
    ref: 'REF',
    preamble: "This is an unsolicited brief. You did not contact us. We wrote first. You can discard it — no offense taken.",
    obsH: 'OBSERVATION',
    probH: 'WHAT PROBABLY ISN\'T WORKING',
    progH: 'WHAT WE WOULD DO',
    invH: 'ESTIMATED INVESTMENT',
    plazoH: 'TOTAL TIMELINE',
    footer: 'Generated automatically by the studio system from public signals. Stuart reviews every response before answering. No obligation either way. If you want to talk, reply.',
    cta1: 'Continue the conversation',
    cta2: 'Thanks, but no',
    regen: 'Regenerate brief',
  };

  const ref = 'RLS-' + hash(name + category).toString(36).toUpperCase().slice(0, 6);

  return `
    <header class="rc-doc-head">
      <div class="rc-meta">
        <div><span class="k">${i18n.to}</span><span class="v">${escapeHtml(name)}</span></div>
        <div><span class="k">${i18n.from}</span><span class="v">Rainey Laguna Studios</span></div>
        <div><span class="k">${i18n.date}</span><span class="v">${today.toUpperCase()}</span></div>
        <div><span class="k">${i18n.ref}</span><span class="v">${ref}</span></div>
      </div>
      <p class="rc-preamble">${i18n.preamble}</p>
    </header>

    <section class="rc-block">
      <h3 class="rc-h">${i18n.obsH}</h3>
      <p class="rc-body">${obs}</p>
    </section>

    <section class="rc-block">
      <h3 class="rc-h">${i18n.probH}</h3>
      <ul class="rc-problems">
        ${problems.map(p => `<li>${escapeHtml(p.replace(/{NAME}/g, name))}</li>`).join('')}
      </ul>
    </section>

    <section class="rc-block">
      <h3 class="rc-h">${i18n.progH}</h3>
      <ol class="rc-program">
        ${program.map((p, i) => `
          <li>
            <span class="rc-phase-n">FASE ${String(i + 1).padStart(2, '0')}</span>
            <span class="rc-phase-name">${escapeHtml(p.phase)}</span>
            <span class="rc-phase-time">${escapeHtml(p.time || '')}</span>
            <span class="rc-phase-cost">${escapeHtml(p.cost || '')}</span>
          </li>
        `).join('')}
      </ol>
    </section>

    <section class="rc-totals">
      <div>
        <span class="rc-h-sm">${i18n.invH}</span>
        <span class="rc-total-val">${total}</span>
      </div>
      <div>
        <span class="rc-h-sm">${i18n.plazoH}</span>
        <span class="rc-total-val">${timeline}</span>
      </div>
    </section>

    <p class="rc-footer">${i18n.footer}</p>

    <div class="rc-cta-row">
      <a class="btn-primary" href="https://wa.me/51912418482?text=${encodeURIComponent('Hola Stuart — recibí el briefing no solicitado para ' + name + '. Conversemos.')}" target="_blank" rel="noopener">
        ${i18n.cta1} <span aria-hidden="true">→</span>
      </a>
      <button class="btn-ghost" type="button" data-rc-regen>
        ${i18n.regen}
      </button>
    </div>
  `;
}

// ----- helpers --------------------------------------------------------------
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function hash(s) {
  let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i); return h >>> 0;
}

// ----- wire up --------------------------------------------------------------
function init() {
  const form = document.getElementById('rcForm');
  const output = document.getElementById('rcOutput');
  if (!form || !output) return;

  function generate() {
    const name = (form.querySelector('[name="rcName"]').value || '').trim();
    const cat = form.querySelector('[name="rcCategory"]').value;
    if (!name || !cat) return;
    const lang = (document.documentElement.lang || 'es').startsWith('es') ? 'es' : 'en';
    const html = renderBrief(name, cat, lang);
    if (!html) return;
    output.innerHTML = html;
    output.hidden = false;
    output.setAttribute('aria-busy', 'false');
    output.scrollIntoView({ behavior: 'smooth', block: 'start' });
    wireOutputButtons();
  }

  function wireOutputButtons() {
    const regen = output.querySelector('[data-rc-regen]');
    if (regen) regen.addEventListener('click', generate);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    output.setAttribute('aria-busy', 'true');
    setTimeout(generate, 520); // Tiny delay so it feels considered, not instant.
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
