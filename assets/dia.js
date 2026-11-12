// DH1 Software — "Un día de obra". El scroll es la hora: mueve el reloj, el cielo, el sol y las ventanas de la ciudad.
// Cada capítulo pone en marcha su objeto (fichaje, tablero, emergencia, teléfono sin señal…) cuando aparece.
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const raiz = document.documentElement;

  // ------------------------------------------------------------ hora ↔ minutos
  const aMin = (h) => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };
  const aHora = (m) => { m = Math.round(m); return [String(Math.floor(m / 60)).padStart(2, '0'), String(m % 60).padStart(2, '0')]; };

  // ------------------------------------------------------------ el cielo según la hora
  const CIELO = [
    [330, '#04060d', '#0a0e1a', 0, 1],
    [358, '#070b1a', '#16204a', .18, .85],
    [390, '#0e1a3d', '#5a4426', .5, .45],
    [480, '#10224f', '#1e4fa3', .1, .1],
    [720, '#12306e', '#2e6cd6', 0, 0],
    [960, '#11295c', '#24539f', .12, 0],
    [1110, '#0d1734', '#6a4220', .55, .35],
    [1200, '#060a17', '#11193a', .1, .85],
    [1290, '#04060d', '#0a0e1a', 0, 1],
  ];
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mezcla = (a, b, t) => { const x = hex(a), y = hex(b); return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})`; };
  function pintarCielo(min) {
    let i = 0;
    while (i < CIELO.length - 2 && min > CIELO[i + 1][0]) i++;
    const a = CIELO[i], b = CIELO[i + 1];
    const t = Math.max(0, Math.min(1, (min - a[0]) / (b[0] - a[0])));
    raiz.style.setProperty('--cielo-alto', mezcla(a[1], b[1], t));
    raiz.style.setProperty('--cielo-bajo', mezcla(a[2], b[2], t));
    raiz.style.setProperty('--resplandor', `rgba(232,163,36,${(a[3] + (b[3] - a[3]) * t).toFixed(3)})`);
    raiz.style.setProperty('--noche', (a[4] + (b[4] - a[4]) * t).toFixed(3));
    // sol: sale a las 6:20 por la izquierda, se pone a las 19:10 por la derecha
    const p = Math.max(0, Math.min(1, (min - 380) / (1150 - 380)));
    // por la mitad derecha del cielo, detrás de los objetos y lejos de los títulos
    raiz.style.setProperty('--sol-x', `${48 + p * 48}%`);
    raiz.style.setProperty('--sol-y', `${94 - Math.sin(Math.PI * p) * 76}%`);
  }

  // ------------------------------------------------------------ reloj del riel
  const caps = $$('main .cap[data-hora], main .cap[data-etq]');
  const items = $$('#indice li:not(.avance)');
  const avance = $('#indice .avance');
  const hora = $('#hora');
  let ultimo = -1;
  function alScroll() {
    const medio = window.scrollY + window.innerHeight * 0.45;
    let i = 0;
    while (i < caps.length - 1 && caps[i + 1].offsetTop <= medio) i++;
    const a = caps[i], b = caps[i + 1];
    let min;
    if (a.dataset.etq !== undefined) {
      // Páginas de módulo: el reloj muestra la escala propia ("Día 12", "Marzo") y el cielo recorre un día
      // según cuánto de la página se leyó.
      const total = document.documentElement.scrollHeight - window.innerHeight;
      min = 358 + (1290 - 358) * Math.max(0, Math.min(1, window.scrollY / Math.max(1, total)));
      if (hora && hora.dataset.ultima !== a.dataset.etq) { hora.textContent = a.dataset.etq; hora.dataset.ultima = a.dataset.etq; }
    } else {
      const ta = aMin(a.dataset.hora);
      min = ta;
      if (b) {
        // la hora avanza desde que el capítulo llega arriba de la pantalla hasta que llega el siguiente
        const frac = Math.max(0, Math.min(1, (window.scrollY - a.offsetTop) / (b.offsetTop - a.offsetTop)));
        min = ta + (aMin(b.dataset.hora) - ta) * frac;
      }
      const [hh, mm] = aHora(min);
      if (hora) hora.innerHTML = `${hh}<i>:</i>${mm}`;
    }
    pintarCielo(min);
    if (i !== ultimo) {
      ultimo = i;
      items.forEach((li, k) => { li.classList.toggle('hecho', k < i); li.classList.toggle('ahora', k === i); });
    }
    if (avance && items[i]) {
      const top = items[0].offsetTop, here = items[i].offsetTop + (b && items[i + 1] ? (items[i + 1].offsetTop - items[i].offsetTop) * Math.max(0, Math.min(1, (window.scrollY - a.offsetTop) / (b.offsetTop - a.offsetTop))) : 0);
      avance.style.top = `${top + 4}px`;
      avance.style.height = `${Math.max(0, here - top)}px`;
    }
  }
  let pedido = false;
  window.addEventListener('scroll', () => { if (!pedido) { pedido = true; requestAnimationFrame(() => { pedido = false; alScroll(); }); } }, { passive: true });
  window.addEventListener('resize', alScroll);
  alScroll();

  // ------------------------------------------------------------ menú del teléfono
  const menu = $('#menu'), menuBtn = $('#menuBtn');
  menuBtn && menuBtn.addEventListener('click', () => {
    const abierto = menu.classList.toggle('abierto');
    menuBtn.setAttribute('aria-expanded', String(abierto));
  });

  // ------------------------------------------------------------ ventanas de la ciudad
  const vent = $('#ventanas');
  if (vent) {
    let semilla = 7;
    const azar = () => (semilla = (semilla * 9301 + 49297) % 233280) / 233280;
    let html = '';
    $$('#skyline [data-v]').forEach((r) => {
      const [cols, filas] = r.dataset.v.split('x').map(Number);
      const x = +r.getAttribute('x'), y = +r.getAttribute('y'), w = +r.getAttribute('width'), h = +r.getAttribute('height');
      const pw = w / (cols * 2 + 1), ph = Math.min(18, h / (filas * 2 + 1));
      for (let c = 0; c < cols; c++) for (let f = 0; f < filas; f++) {
        if (azar() < 0.42) continue;
        html += `<rect class="ventana${azar() < 0.3 ? ' b' : ''}" x="${(x + pw * (c * 2 + 1)).toFixed(1)}" y="${(y + 14 + ph * f * 2).toFixed(1)}" width="${pw.toFixed(1)}" height="${(ph * .9).toFixed(1)}"/>`;
      }
    });
    vent.innerHTML = html;
  }

  // ------------------------------------------------------------ QR del fichaje (dibujo de ejemplo, no se puede escanear)
  const qr = $('#qr');
  if (qr) {
    let s = 41, d = '';
    const az = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const ojo = (x, y) => { d += `M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5zM${x + 2} ${y + 2}h3v3h-3z`; };
    for (let y = 0; y < 29; y++) for (let x = 0; x < 29; x++) {
      const enOjo = (x < 8 && y < 8) || (x > 20 && y < 8) || (x < 8 && y > 20);
      if (!enOjo && az() > 0.52) d += `M${x} ${y}h1v1h-1z`;
    }
    ojo(0, 0); ojo(22, 0); ojo(0, 22);
    qr.innerHTML = `<path d="${d}" fill="#0a0e1a" fill-rule="evenodd"/>`;
  }

  // ------------------------------------------------------------ al aparecer
  const alVer = new Map();
  const io = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('visto');
      const cap = e.target.closest('.cap');
      if (cap && !cap.classList.contains('vivo')) {
        cap.classList.add('vivo');
        const f = alVer.get(cap.id);
        if (f) setTimeout(f, quieto ? 0 : 500);
      }
      io.unobserve(e.target);
    });
  }, { threshold: 0.25 });
  $$('.aparece').forEach((el) => io.observe(el));
  const esperar = (ms) => new Promise((r) => setTimeout(r, quieto ? 0 : ms));

  // 07:30 — el tablero se reparte solo (FLIP: la tarjeta viaja de columna)
  alVer.set('reparto', async () => {
    const t = $('#tablero');
    if (!t) return;
    const col = (n) => t.querySelector(`[data-col="${n}"]`);
    const mover = (id, n) => {
      const el = t.querySelector(`[data-id="${id}"]`);
      const a = el.getBoundingClientRect();
      col(n).appendChild(el);
      const b = el.getBoundingClientRect();
      if (!quieto) {
        el.animate([{ transform: `translate(${a.left - b.left}px, ${a.top - b.top}px)` }, { transform: 'none' }], { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)' });
      }
      const q = el.querySelector('.q');
      const quien = { a: ['MG', 'María'], b: ['JR', 'Juan'], c: ['PS', 'Pedro'], d: ['AT', 'Ana'] }[id];
      if (n >= 1 && quien && !q.querySelector('i')) q.insertAdjacentHTML('afterbegin', `<i>${quien[0]}</i>${quien[1]} ·`);
    };
    for (const [id, n] of [['d', 1], ['a', 1], ['b', 1], ['d', 2], ['c', 1], ['a', 2]]) { await esperar(900); mover(id, n); }
  });

  // 09:41 — emergencia: el registro se escribe solo; el botón reporta otra
  let nEm = 183;
  const crono = $('#cronoEm');
  async function emergencia(lugar, tipo) {
    const reg = $('#registroEm');
    const ot = `OT-000${nEm++}`;
    const lineas = [
      `<span class="r">● </span><b>${tipo}</b> reportada · ${lugar}`,
      `<b>${ot}</b> urgente creada en el mismo segundo`,
      `Aviso al jefe de sitio de la zona · gerencia`,
      `Jefe en camino · <b>atendida</b>`,
      `<span class="g">✓</span> Resuelta · ${ot} cerrada sola`,
    ];
    if (reg.children.length > 6) reg.innerHTML = '';
    for (const l of lineas) { reg.insertAdjacentHTML('beforeend', `<div>${l}</div>`); await esperar(800); }
  }
  alVer.set('emergencia', () => {
    const t0 = Date.now();
    if (crono) setInterval(() => {
      const s = Math.floor((Date.now() - t0) / 1000) + 14 * 60 + 32;
      crono.textContent = [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map((n) => String(n).padStart(2, '0')).join(':');
    }, 1000);
    emergencia('Escuela 7', 'Pérdida de gas');
  });
  const otra = $('#otraEm');
  const EMERG = [['Hospital Sur', 'Corte de luz'], ['Jardín 904', 'Inundación en baños'], ['Escuela 21', 'Vidrio roto en aula'], ['Escuela 3', 'Pérdida de agua']];
  let kEm = 0;
  otra && otra.addEventListener('click', () => { const [l, t] = EMERG[kEm++ % EMERG.length]; emergencia(l, t); });

  // 10:20 — teléfono sin señal
  const tel = $('#telefono'), senal = $('#senal'), cola = $('#cola'), aviso = $('#telAviso');
  let enCola = 0, conSenal = true;
  const pintarCola = () => {
    cola.innerHTML = enCola ? `En el teléfono, esperando señal: <b>${enCola}</b>` : 'Nada esperando para enviar.';
  };
  $$('.tarea', tel || document).forEach((b) => b.addEventListener('click', () => {
    const ok = b.classList.toggle('ok');
    b.querySelector('.pend')?.remove();
    if (!conSenal && ok) { enCola++; b.insertAdjacentHTML('beforeend', '<span class="pend">en espera</span>'); pintarCola(); }
  }));
  senal && senal.addEventListener('click', async () => {
    conSenal = !conSenal;
    senal.setAttribute('aria-pressed', String(conSenal));
    tel.classList.toggle('sin', !conSenal);
    if (conSenal && enCola) {
      tel.classList.add('enviando');
      aviso.textContent = `Volvió la señal: enviando ${enCola}…`;
      await esperar(1400);
      $$('.pend', tel).forEach((p) => p.remove());
      aviso.textContent = `Enviado. ${enCola} ${enCola === 1 ? 'cambio llegó' : 'cambios llegaron'} a la base, sin duplicar.`;
      enCola = 0; pintarCola();
      await esperar(2200);
      tel.classList.remove('enviando');
      aviso.textContent = 'Sin señal: lo que hagas queda guardado en el teléfono.';
    }
  });

  // 12:45 — el stock baja y aparece el pedido
  alVer.set('panol', async () => {
    const o = $('#panolObj');
    $$('.barra i', o).forEach((i) => { i.style.width = i.dataset.fin; });
    $$('.num', o).forEach((n) => {
      const ini = +n.textContent, fin = +n.dataset.fin, t0 = performance.now();
      const paso = (t) => { const p = Math.min(1, (t - t0) / 1600); n.textContent = Math.round(ini + (fin - ini) * p); if (p < 1) requestAnimationFrame(paso); };
      requestAnimationFrame(paso);
    });
    await esperar(1700);
    o.querySelector('.mat').classList.add('bajo');
    await esperar(500);
    $('#pedido').classList.add('ve');
  });

  // 14:00 — calendario: lo que vence en 7 días se vuelve orden
  const diasCal = $('#diasCal');
  if (diasCal) {
    const hoy = new Date();
    let h = '<div></div>';
    for (let k = 0; k < 14; k++) {
      const d = new Date(hoy); d.setDate(hoy.getDate() + k);
      h += `<div class="${k === 0 ? 'hoy' : ''}">${k === 0 ? 'hoy' : d.getDate()}</div>`;
    }
    diasCal.innerHTML = h;
    $$('#calendario .equipo').forEach((eq) => {
      const v = +eq.dataset.vence;
      for (let k = 0; k < 14; k++) eq.insertAdjacentHTML('beforeend', `<i class="${k === v ? 'vence' : ''}"></i>`);
    });
  }
  alVer.set('preventivo', async () => {
    const linea = $('#lineaEsc'), cal = $('#calendario');
    const celdas = $$('.equipo', cal).map((eq) => eq.querySelectorAll('i'));
    const ancho = celdas[0][1].getBoundingClientRect().left - celdas[0][0].getBoundingClientRect().left;
    const x0 = celdas[0][0].offsetLeft;
    linea.style.opacity = '1';
    let creadas = 0;
    for (let k = 0; k <= 7; k++) {
      linea.style.left = `${x0 + k * ancho}px`;
      linea.style.transition = quieto ? 'none' : 'left .35s linear';
      await esperar(380);
      celdas.forEach((c) => { if (k < 7 && c[k].classList.contains('vence')) { c[k].classList.replace('vence', 'creada'); creadas++; } });
    }
    linea.style.opacity = '0';
    $('#resCal').textContent = `${creadas} órdenes preventivas creadas · 0 duplicadas`;
  });

  // 16:30 — firma (se dibuja sola; después firma el visitante) y sello del jefe
  const lienzo = $('#firma');
  if (lienzo) {
    const ctx = lienzo.getContext('2d');
    const ajustar = () => {
      const r = lienzo.getBoundingClientRect(), k = window.devicePixelRatio || 1;
      lienzo.width = r.width * k; lienzo.height = r.height * k;
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1e3a8a';
    };
    ajustar();
    let ultimoP = null, dibujando = false;
    const pos = (e) => { const r = lienzo.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    lienzo.addEventListener('pointerdown', (e) => { dibujando = true; ultimoP = pos(e); lienzo.setPointerCapture(e.pointerId); });
    lienzo.addEventListener('pointermove', (e) => {
      if (!dibujando) return;
      const p = pos(e);
      ctx.beginPath(); ctx.moveTo(...ultimoP); ctx.lineTo(...p); ctx.stroke(); ultimoP = p;
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => lienzo.addEventListener(ev, () => { dibujando = false; }));
    $('#borrarFirma').addEventListener('click', () => ctx.clearRect(0, 0, lienzo.width, lienzo.height));
    // firma de ejemplo, trazo a trazo
    alVer.set('cierre', () => {
      const w = lienzo.getBoundingClientRect().width, y = 62;
      const puntos = [];
      for (let k = 0; k <= 120; k++) {
        const t = k / 120, x = 24 + t * Math.min(w - 60, 260);
        puntos.push([x, y - Math.sin(t * 18) * 14 * (1 - t * .6) - Math.sin(t * 5) * 6]);
      }
      let k = 1;
      const trazo = () => {
        if (k >= puntos.length) { ctx.beginPath(); ctx.moveTo(20, y + 12); ctx.lineTo(Math.min(w - 40, 290), y + 6); ctx.stroke(); return; }
        ctx.beginPath(); ctx.moveTo(...puntos[k - 1]); ctx.lineTo(...puntos[k]); ctx.stroke(); k++;
        quieto ? trazo() : requestAnimationFrame(trazo);
      };
      trazo();
    });
  }
  const aprobar = $('#aprobar');
  aprobar && aprobar.addEventListener('click', () => {
    const s = $('#sello');
    s.classList.remove('puesto'); void s.offsetWidth; s.classList.add('puesto');
    aprobar.textContent = 'Aprobada por el jefe';
    aprobar.disabled = true;
  });

  // 18:10 — la cadena de firmas avanza y recién al final toma número
  alVer.set('certificado', async () => {
    const pasos = $$('#cadena .paso');
    for (const p of pasos) { await esperar(900); p.classList.add('firmo'); }
    await esperar(500);
    const n = $('#numCert');
    n.querySelector('b').textContent = 'N° 47';
    n.classList.add('listo');
  });

  // capítulos que ya están en pantalla al cargar (por ejemplo, al entrar con #enlace)
  requestAnimationFrame(alScroll);
})();
