// DH1 Software — "Así se vio tu día": un día de 06 a 22 h en una ciudad inventada. Las órdenes aparecen, las cuadrillas
// van por las calles, trabajan y cierran. Todo es una simulación con datos inventados, igual cada vez (semilla fija).
(function () {
  'use strict';
  const caja = document.getElementById('mapa');
  if (!caja) return;
  const $ = (id) => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ------------------------------------------------------------ ciudad
  const PASO = 40, COLS = 22, FILAS = 15;
  const nodo = (i, j) => [20 + i * PASO, 20 + j * PASO];
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 1000 620');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Mapa de la ciudad con las órdenes de trabajo del día');
  let base = '<g transform="rotate(-5 500 310)">';
  base += '<path class="rio" d="M905 -60 C880 80 940 160 900 300 C870 420 930 520 900 700 L1200 700 L1200 -60 Z"/>';
  for (const [i, j, w, h] of [[3, 2, 2, 1], [11, 9, 1, 2], [16, 3, 2, 2], [6, 11, 1, 1], [19, 12, 1, 1]]) {
    const [x, y] = nodo(i, j);
    base += `<rect class="parque" x="${x + 3}" y="${y + 3}" width="${w * PASO - 6}" height="${h * PASO - 6}" rx="3"/>`;
  }
  for (let i = 0; i < COLS; i++) {
    const [x] = nodo(i, 0);
    base += `<line class="${i % 4 === 1 ? 'avenida' : 'calle'}" x1="${x}" y1="-40" x2="${x}" y2="660" stroke-width="${i % 4 === 1 ? 5 : 2}"/>`;
  }
  for (let j = 0; j < FILAS; j++) {
    const [, y] = nodo(0, j);
    base += `<line class="${j % 4 === 2 ? 'avenida' : 'calle'}" x1="-40" y1="${y}" x2="880" y2="${y}" stroke-width="${j % 4 === 2 ? 5 : 2}"/>`;
  }
  base += '<line class="avenida" x1="20" y1="580" x2="660" y2="20" stroke-width="5"/>';
  base += '<line class="avenida" x1="300" y1="20" x2="860" y2="460" stroke-width="5"/>';
  base += '<text class="zona" x="70" y="60">ZONA 8A</text><text class="zona" x="560" y="60">ZONA 8B</text><text class="zona" x="70" y="560">ZONA 10A</text><text class="zona" x="600" y="560">ZONA 10B</text>';
  base += '<g id="capaLugares"></g><g id="capaOT"></g><g id="capaCuad"></g></g>';
  svg.innerHTML = base;
  caja.prepend(svg);
  const capaLugares = svg.querySelector('#capaLugares'), capaOT = svg.querySelector('#capaOT'), capaCuad = svg.querySelector('#capaCuad');

  // ------------------------------------------------------------ datos del día (semilla fija)
  let s = 20261020;
  const az = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const entre = (a, b) => a + Math.floor(az() * (b - a + 1));
  const NOMBRES = ['Escuela 7', 'Escuela 12', 'Escuela 21', 'Escuela 3', 'Escuela 18', 'Escuela 25', 'Escuela 9', 'Escuela 14', 'Escuela 30', 'Escuela 2',
    'Jardín 904', 'Jardín 912', 'Jardín 920', 'Hospital Sur', 'Hospital Norte', 'Centro de Salud 5', 'Polideportivo', 'Biblioteca', 'Escuela técnica 6',
    'Escuela 11', 'Escuela 16', 'Escuela 27', 'Jardín 931', 'Escuela 5', 'Centro de Salud 8', 'Escuela 19', 'Escuela 23', 'Escuela 4'];
  const TAREAS = ['Cambiar luminarias', 'Destapar desagüe', 'Revisar tablero', 'Reparar canilla', 'Cambiar vidrio', 'Pintar aula', 'Revisar bomba',
    'Reparar cerradura', 'Limpiar tanque', 'Cambiar disyuntor', 'Arreglar persiana', 'Revisar caldera', 'Sellar filtración', 'Cambiar inodoro'];
  const usados = new Set();
  const lugares = NOMBRES.map((n) => {
    let i, j;
    do { i = entre(1, COLS - 2); j = entre(1, FILAS - 2); } while (usados.has(`${i},${j}`));
    usados.add(`${i},${j}`);
    return { n, i, j };
  });
  lugares.forEach((l) => {
    const [x, y] = nodo(l.i, l.j);
    capaLugares.insertAdjacentHTML('beforeend', `<rect class="lugar" x="${x - 5}" y="${y - 5}" width="10" height="10" rx="2"/>`);
  });
  const DEPOSITO = { i: 10, j: 7 };

  function armarDia() {
    s = 20261020;
    const ots = [];
    let num = 170;
    for (let k = 0; k < 44; k++) {
      ots.push({ id: `OT-000${num++}`, lugar: lugares[entre(0, lugares.length - 1)], t: entre(6 * 60 + 5, 17 * 60), tarea: TAREAS[entre(0, TAREAS.length - 1)], dura: entre(30, 95), urg: false });
    }
    for (const [h, l, t] of [[9 * 60 + 41, 'Escuela 7', 'Pérdida de gas'], [13 * 60 + 12, 'Hospital Sur', 'Corte de luz'], [17 * 60 + 48, 'Jardín 904', 'Inundación en baños']]) {
      ots.push({ id: `OT-000${num++}`, lugar: lugares.find((x) => x.n === l), t: h, tarea: t, dura: 40, urg: true });
    }
    ots.sort((a, b) => a.t - b.t);
    ots.forEach((o) => { o.estado = 'oculta'; o.cuad = null; o.el = null; });
    const cuads = Array.from({ length: 6 }, (_, k) => ({ n: k + 1, x: nodo(DEPOSITO.i, DEPOSITO.j)[0], y: nodo(DEPOSITO.i, DEPOSITO.j)[1], ruta: [], ot: null, trabajaHasta: 0 }));
    return { ots, cuads };
  }

  // ------------------------------------------------------------ simulación
  const MIN_POR_SEG = 16; // a 1×: el día de 16 horas dura un minuto
  let dia, min, vel = 1, andando = !quieto, visible = false, ultimoT = 0, fin = false;
  const reloj = $('mapaReloj'), log = $('mapaLog'), ficha = $('mapaFicha');
  const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;

  function anotar(texto) {
    log.insertAdjacentHTML('afterbegin', `<div>${hhmm(min)} · ${texto}</div>`);
    while (log.children.length > 16) log.lastChild.remove();
  }

  function pintarOT(o) {
    if (!o.el) {
      const [x, y] = nodo(o.lugar.i, o.lugar.j);
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'ot');
      // un poco corrido del lugar, para que dos órdenes del mismo lugar no se tapen
      g.setAttribute('transform', `translate(${(x + az() * 14 - 7).toFixed(1)} ${(y + az() * 14 - 7).toFixed(1)})`);
      g.innerHTML = '<circle class="onda" r="6"/><circle class="c" r="6"/>';
      g.addEventListener('mouseenter', (e) => mostrarFicha(o, e));
      g.addEventListener('click', (e) => mostrarFicha(o, e));
      g.addEventListener('mouseleave', () => { ficha.style.display = 'none'; });
      capaOT.appendChild(g);
      o.el = g;
    }
    const clase = o.estado === 'cerrada' ? 'cerr' : o.urg ? 'urg' : o.estado === 'curso' ? 'curso' : 'pend';
    o.el.setAttribute('class', `ot ${clase}`);
    if (o.estado === 'cerrada') o.el.style.opacity = '.75';
  }

  const ESTADO = { pend: 'Pendiente', asig: 'Asignada', curso: 'En curso', cerrada: 'Cerrada con firma' };
  function mostrarFicha(o, e) {
    const r = caja.getBoundingClientRect();
    ficha.innerHTML = `<code>${o.id}${o.urg ? ' · URGENTE' : ''}</code><b>${o.tarea}</b>${o.lugar.n}<br>${ESTADO[o.estado] ?? ''}${o.cuad ? ` · Cuadrilla ${o.cuad.n}` : ''}`;
    ficha.style.display = 'block';
    const x = Math.min(e.clientX - r.left + 14, r.width - 270), y = Math.max(8, e.clientY - r.top - 80);
    ficha.style.left = `${x}px`; ficha.style.top = `${y}px`;
  }

  function pintarCuad(c) {
    if (!c.el) {
      c.el = document.createElementNS(NS, 'g');
      c.el.setAttribute('class', 'cuadrilla');
      c.el.innerHTML = `<rect x="-8" y="-8" width="16" height="16" rx="3"/><text text-anchor="middle" y="3.5">${c.n}</text>`;
      capaCuad.appendChild(c.el);
    }
    c.el.setAttribute('transform', `translate(${c.x.toFixed(1)} ${c.y.toFixed(1)})`);
  }

  // Ruta por las calles: primero en x, después en y (de nodo en nodo).
  function ruta(c, i, j) {
    const [tx, ty] = nodo(i, j);
    c.ruta = [[tx, c.y], [tx, ty]];
  }

  function contar() {
    const o = dia.ots;
    $('kPend').textContent = o.filter((x) => x.estado === 'pend' || x.estado === 'asig').length;
    $('kCurso').textContent = o.filter((x) => x.estado === 'curso').length;
    $('kCerr').textContent = o.filter((x) => x.estado === 'cerrada').length;
    $('kUrg').textContent = o.filter((x) => x.urg && x.estado !== 'oculta').length;
  }

  function paso(dm) {
    const antes = min;
    min = Math.min(22 * 60, min + dm);
    reloj.textContent = hhmm(min);
    // aparecen órdenes
    for (const o of dia.ots) {
      if (o.estado === 'oculta' && o.t <= min) {
        o.estado = 'pend';
        pintarOT(o);
        anotar(o.urg ? `<b style="color:#ff5a4e">Emergencia</b> · ${o.lugar.n} · ${o.tarea.toLowerCase()}` : `<b>${o.id}</b> creada · ${o.lugar.n}`);
      }
    }
    // cuadrillas
    for (const c of dia.cuads) {
      if (!c.ot && min < 21 * 60) {
        const libres = dia.ots.filter((o) => o.estado === 'pend');
        if (libres.length) {
          libres.sort((a, b) => (b.urg - a.urg) || (Math.abs(nodo(a.lugar.i, a.lugar.j)[0] - c.x) + Math.abs(nodo(a.lugar.i, a.lugar.j)[1] - c.y)) - (Math.abs(nodo(b.lugar.i, b.lugar.j)[0] - c.x) + Math.abs(nodo(b.lugar.i, b.lugar.j)[1] - c.y)));
          const o = libres[0];
          o.estado = 'asig'; o.cuad = c; c.ot = o; c.trabajaHasta = 0;
          ruta(c, o.lugar.i, o.lugar.j);
          pintarOT(o);
        }
      }
      // moverse: 5 unidades del mapa por minuto simulado
      let resto = dm * 5;
      while (resto > 0 && c.ruta.length) {
        const [tx, ty] = c.ruta[0];
        const dx = tx - c.x, dy = ty - c.y, d = Math.hypot(dx, dy);
        if (d <= resto) { c.x = tx; c.y = ty; resto -= d; c.ruta.shift(); } else { c.x += dx / d * resto; c.y += dy / d * resto; resto = 0; }
      }
      if (c.ot && !c.ruta.length) {
        const o = c.ot;
        if (o.estado === 'asig') { o.estado = 'curso'; c.trabajaHasta = min + o.dura; pintarOT(o); anotar(`Cuadrilla ${c.n} llegó · ${o.lugar.n}`); }
        else if (o.estado === 'curso' && min >= c.trabajaHasta) {
          o.estado = 'cerrada'; pintarOT(o); c.ot = null;
          anotar(`<b>${o.id}</b> cerrada con firma · ${o.lugar.n}`);
        }
      }
      if (!c.ot && min >= 21 * 60 && !c.ruta.length) {
        const [bx, by] = nodo(DEPOSITO.i, DEPOSITO.j);
        if (c.x !== bx || c.y !== by) ruta(c, DEPOSITO.i, DEPOSITO.j);
      }
      pintarCuad(c);
    }
    if (Math.floor(antes / 30) !== Math.floor(min / 30)) contar();
    if (min >= 22 * 60 && !fin) {
      fin = true; contar();
      anotar(`<b>Fin del día</b> · ${dia.ots.filter((o) => o.estado === 'cerrada').length} cerradas · ${dia.ots.filter((o) => o.estado !== 'cerrada').length} quedan para mañana`);
      if (andando) setTimeout(() => { if (andando) reiniciar(); }, 5000);
    }
  }

  function reiniciar() {
    capaOT.innerHTML = ''; capaCuad.innerHTML = ''; log.innerHTML = '';
    dia = armarDia(); min = 6 * 60; fin = false;
    dia.cuads.forEach(pintarCuad);
    reloj.textContent = '06:00';
    contar();
  }

  function cuadro(t) {
    if (andando && visible && !fin) {
      const dt = Math.min(0.1, (t - ultimoT) / 1000);
      paso(dt * MIN_POR_SEG * vel);
    }
    ultimoT = t;
    requestAnimationFrame(cuadro);
  }

  // ------------------------------------------------------------ controles
  const play = $('mapaPlay');
  const pintarPlay = () => { play.textContent = andando ? 'Pausa' : 'Seguir'; play.setAttribute('aria-pressed', String(andando)); };
  play.addEventListener('click', () => { andando = !andando; if (andando && fin) reiniciar(); pintarPlay(); });
  document.querySelectorAll('.mapa-ctrl [data-vel]').forEach((b) => b.addEventListener('click', () => {
    vel = +b.dataset.vel;
    document.querySelectorAll('.mapa-ctrl [data-vel]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  }));
  $('mapaReiniciar').addEventListener('click', () => { reiniciar(); andando = true; pintarPlay(); });

  new IntersectionObserver((e) => { visible = e[0].isIntersecting; }, { threshold: 0.2 }).observe(caja);
  reiniciar();
  pintarPlay();
  if (quieto) { paso(9 * 60); } // sin animación: se muestra el día ya avanzado
  requestAnimationFrame((t) => { ultimoT = t; requestAnimationFrame(cuadro); });
})();
