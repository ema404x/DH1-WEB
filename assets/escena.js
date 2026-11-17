// DH1 Software — portada 3D: una ciudad en tiempo real (gemelo digital) con órdenes de trabajo que cambian
// de estado, conexiones a la central, cuadrillas en movimiento y partículas. Se gira arrastrando; al pasar
// el cursor por una orden aparece su ficha. Datos ficticios.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const lienzo = document.getElementById('escena3d');
const hero = document.querySelector('.hero');
if (lienzo && hero) {
  try { iniciar(); } catch (e) { hero.classList.add('sin-3d'); console.warn('Escena 3D no disponible', e); }
}

function iniciar() {
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const angosto = () => window.innerWidth <= 1080;
  const movil = window.innerWidth <= 760;

  const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: !movil, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, movil ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);

  const escena = new THREE.Scene();
  escena.fog = new THREE.Fog(0x05070f, 34, 78);
  const camara = new THREE.PerspectiveCamera(30, 1, 0.1, 200);

  escena.add(new THREE.AmbientLight(0x4a66b8, 1.4));
  const sol = new THREE.DirectionalLight(0xa9c6ff, 2.2); sol.position.set(12, 24, 6); escena.add(sol);
  const contra = new THREE.DirectionalLight(0xf5b83a, 0.5); contra.position.set(-14, 6, -10); escena.add(contra);

  // azar con semilla: la ciudad es siempre la misma
  let semilla = 11;
  const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;

  const textura = (paradas) => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    paradas.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  };
  const brillo = textura([[0, 'rgba(255,255,255,1)'], [0.22, 'rgba(255,255,255,.6)'], [1, 'rgba(255,255,255,0)']]);

  const ciudad = new THREE.Group(); escena.add(ciudad);

  // ------------------------------------------------------------ suelo: grilla y resplandor
  const grilla = new THREE.GridHelper(84, 70, 0x2e6cd6, 0x13224a);
  grilla.material.transparent = true; grilla.material.opacity = 0.32; grilla.material.depthWrite = false;
  escena.add(grilla);
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(46, 46), new THREE.MeshBasicMaterial({
    map: textura([[0, 'rgba(46,108,214,.55)'], [0.45, 'rgba(46,108,214,.16)'], [1, 'rgba(46,108,214,0)']]),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  halo.rotation.x = -Math.PI / 2; halo.position.y = 0.02; escena.add(halo);

  // ------------------------------------------------------------ edificios
  const PASO = 2.4, N = movil ? 4 : 5;
  const esAvenida = (k) => k % 3 === 0;
  const edificios = [];
  for (let i = -N; i <= N; i++) for (let j = -N; j <= N; j++) {
    if (esAvenida(i) || esAvenida(j)) continue;
    const d = Math.hypot(i, j);
    if (d > N + 0.6 || azar() < 0.1) continue;
    const h = 0.4 + azar() * azar() * 3.8 + Math.max(0, 2.6 - d * 0.36);
    edificios.push({ x: i * PASO, z: j * PASO, w: PASO * (0.5 + azar() * 0.3), d: PASO * (0.5 + azar() * 0.3), h, dist: d });
  }
  const central = { x: 0, z: 0, w: 1.5, d: 1.5, h: 6.2 };

  const geoCaja = new THREE.BoxGeometry(1, 1, 1); geoCaja.translate(0, 0.5, 0);
  const matCaja = new THREE.MeshStandardMaterial({ color: 0x0e1834, metalness: 0.5, roughness: 0.38, emissive: 0x0b1838, emissiveIntensity: 0.9 });
  const cuerpos = new THREE.InstancedMesh(geoCaja, matCaja, edificios.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
  edificios.forEach((e, k) => { m4.compose(new THREE.Vector3(e.x, 0, e.z), q, new THREE.Vector3(e.w, e.h, e.d)); cuerpos.setMatrixAt(k, m4); });
  ciudad.add(cuerpos);

  const torre = new THREE.Mesh(geoCaja, new THREE.MeshStandardMaterial({ color: 0x14244d, metalness: 0.7, roughness: 0.25, emissive: 0x1e4fa3, emissiveIntensity: 0.55 }));
  torre.scale.set(central.w, central.h, central.d); ciudad.add(torre);

  // aristas de todos los edificios en una sola geometría
  const aristas = (lista) => {
    const p = [];
    lista.forEach(({ x, z, w, d, h }) => {
      const a = [x - w / 2, x + w / 2], b = [z - d / 2, z + d / 2];
      for (const X of a) for (const Z of b) p.push(X, 0, Z, X, h, Z);
      for (const Y of [0, h]) p.push(a[0], Y, b[0], a[1], Y, b[0], a[1], Y, b[0], a[1], Y, b[1], a[1], Y, b[1], a[0], Y, b[1], a[0], Y, b[1], a[0], Y, b[0]);
    });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); return g;
  };
  ciudad.add(new THREE.LineSegments(aristas(edificios), new THREE.LineBasicMaterial({ color: 0x3f7ae6, transparent: true, opacity: 0.5 })));
  ciudad.add(new THREE.LineSegments(aristas([central]), new THREE.LineBasicMaterial({ color: 0xf5b83a, transparent: true, opacity: 0.9 })));
  // anillos de la central
  for (let k = 1; k <= 3; k++) {
    const an = new THREE.Mesh(new THREE.TorusGeometry(1.25 + k * 0.05, 0.015, 6, 64), new THREE.MeshBasicMaterial({ color: 0xf5b83a, transparent: true, opacity: 0.5 }));
    an.rotation.x = Math.PI / 2; an.position.y = central.h * (k / 3.6) + 0.9; ciudad.add(an);
  }
  const faro = new THREE.Sprite(new THREE.SpriteMaterial({ map: brillo, color: 0xf5b83a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  faro.scale.setScalar(3.2); faro.position.set(0, central.h + 0.35, 0); ciudad.add(faro);

  // ventanas encendidas
  const vent = [];
  edificios.forEach(({ x, z, w, d, h }) => {
    const cant = Math.floor(h * 2.2);
    for (let k = 0; k < cant; k++) {
      const cara = Math.floor(azar() * 4), y = 0.35 + azar() * (h - 0.6), t = azar() - 0.5;
      if (cara === 0) vent.push(x + t * w * 0.85, y, z + d / 2 + 0.01);
      else if (cara === 1) vent.push(x + t * w * 0.85, y, z - d / 2 - 0.01);
      else if (cara === 2) vent.push(x + w / 2 + 0.01, y, z + t * d * 0.85);
      else vent.push(x - w / 2 - 0.01, y, z + t * d * 0.85);
    }
  });
  const geoVent = new THREE.BufferGeometry(); geoVent.setAttribute('position', new THREE.Float32BufferAttribute(vent, 3));
  ciudad.add(new THREE.Points(geoVent, new THREE.PointsMaterial({ color: 0xffc766, size: 0.1, transparent: true, opacity: 0.85, depthWrite: false })));

  // ------------------------------------------------------------ órdenes de trabajo
  const COLOR = { pend: 0x8f9bb8, curso: 0xf5b83a, cerr: 0x4ade80, urg: 0xff5a4e };
  const NOMBRE = { pend: 'Pendiente', curso: 'En curso', cerr: 'Cerrada', urg: 'Emergencia' };
  const CSS = { pend: '#9aa5c0', curso: '#f5b83a', cerr: '#4ade80', urg: '#ff5a4e' };
  const LUGARES = ['Escuela N° 12', 'Hospital Sur', 'Jardín 904', 'Escuela N° 7', 'Centro de Salud 3', 'Escuela N° 21', 'Polideportivo Norte', 'Sede Administrativa', 'Escuela N° 3', 'Biblioteca Central', 'Escuela Técnica 5', 'Hospital Norte', 'Jardín 210', 'Escuela N° 18'];
  const TAREAS = ['Bomba cisterna sin presión', 'Cambio de luminarias', 'Revisión de tablero eléctrico', 'Destape de desagüe pluvial', 'Mantenimiento de caldera', 'Reparación de cubierta', 'Prueba de grupo electrógeno', 'Recarga de extintores', 'Pérdida de agua en sanitarios', 'Ajuste de cerramientos', 'Service de ascensor', 'Limpieza de tanque de agua', 'Pintura de aulas', 'Reparación de cielorraso'];
  const URGENCIAS = ['Pérdida de gas', 'Corte de energía', 'Inundación en planta baja', 'Rotura de caño principal'];

  const candidatos = [...edificios].filter((e) => e.dist > 1.2).sort(() => azar() - 0.5).slice(0, movil ? 9 : 14);
  const inicio = new THREE.Vector3(0, central.h + 0.35, 0);
  const geoNucleo = new THREE.SphereGeometry(0.17, 18, 18);
  const geoToque = new THREE.SphereGeometry(0.6, 8, 8);
  const geoAnillo = new THREE.RingGeometry(0.3, 0.38, 40);
  const pins = candidatos.map((e, k) => {
    const pos = new THREE.Vector3(e.x, e.h + 0.75, e.z);
    const estado = ['pend', 'curso', 'cerr', 'pend', 'curso'][k % 5];
    const g = new THREE.Group(); g.position.copy(pos);
    const nucleo = new THREE.Mesh(geoNucleo, new THREE.MeshBasicMaterial({ color: COLOR[estado] }));
    const aura = new THREE.Sprite(new THREE.SpriteMaterial({ map: brillo, color: COLOR[estado], transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    aura.scale.setScalar(1.5);
    const toque = new THREE.Mesh(geoToque, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    g.add(nucleo, aura, toque);
    const haz = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.75, 6), new THREE.MeshBasicMaterial({ color: COLOR[estado], transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
    haz.position.set(e.x, e.h + 0.375, e.z);
    const anillo = new THREE.Mesh(geoAnillo, new THREE.MeshBasicMaterial({ color: COLOR[estado], transparent: true, opacity: 0.8, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    anillo.rotation.x = -Math.PI / 2; anillo.position.set(e.x, e.h + 0.02, e.z);
    // arco a la central
    const medio = inicio.clone().lerp(pos, 0.5); medio.y += 2.2 + inicio.distanceTo(pos) * 0.18;
    const curva = new THREE.QuadraticBezierCurve3(inicio, medio, pos);
    const arco = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curva.getPoints(48)), new THREE.LineBasicMaterial({ color: COLOR[estado], transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false }));
    const paquete = new THREE.Sprite(new THREE.SpriteMaterial({ map: brillo, color: COLOR[estado], transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    paquete.scale.setScalar(0.55);
    ciudad.add(g, haz, anillo, arco, paquete);
    toque.userData.pin = k;
    return { g, nucleo, aura, toque, haz, anillo, arco, paquete, curva, estado, fase: azar(), vel: 0.18 + azar() * 0.2,
      ot: `OT-000${231 + k * 7}`, lugar: LUGARES[k % LUGARES.length], tarea: TAREAS[k % TAREAS.length] };
  });
  const pintarPin = (p) => {
    const c = COLOR[p.estado];
    [p.nucleo, p.aura, p.haz, p.anillo, p.arco, p.paquete].forEach((o) => o.material.color.setHex(c));
  };

  // ------------------------------------------------------------ cuadrillas por las avenidas
  const AV = [];
  for (let k = -N; k <= N; k++) if (esAvenida(k)) AV.push(k * PASO);
  const lim = N * PASO;
  const cuadrillas = Array.from({ length: movil ? 4 : 7 }, (_, k) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.34), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: brillo, color: 0xbcd3ff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.scale.setScalar(1.1); m.add(s);
    ciudad.add(m);
    return { m, eje: k % 2 ? 'x' : 'z', fija: AV[Math.floor(azar() * AV.length)], t: azar() * 2 - 1, vel: (0.05 + azar() * 0.06) * (azar() < 0.5 ? -1 : 1) };
  });

  // ------------------------------------------------------------ partículas
  const NP = movil ? 160 : 320, pp = new Float32Array(NP * 3);
  for (let k = 0; k < NP; k++) { const r = 4 + azar() * 22, a = azar() * Math.PI * 2; pp[k * 3] = Math.cos(a) * r; pp[k * 3 + 1] = azar() * 14; pp[k * 3 + 2] = Math.sin(a) * r; }
  const geoP = new THREE.BufferGeometry(); geoP.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  const particulas = new THREE.Points(geoP, new THREE.PointsMaterial({ color: 0x8fb6ff, size: 0.07, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
  escena.add(particulas);

  // ------------------------------------------------------------ HUD: contadores y registro
  const $ = (id) => document.getElementById(id);
  const hud = { pend: $('hPend'), curso: $('hCurso'), cerr: $('hCerr'), urg: $('hUrg'), hora: $('hHora'), log: $('hLog') };
  let minutos = 8 * 60;
  const hhmm = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;
  const contar = () => {
    const c = { pend: 0, curso: 0, cerr: 0, urg: 0 };
    pins.forEach((p) => c[p.estado]++);
    // la operación tiene más órdenes que las que se ven en el mapa
    if (hud.pend) { hud.pend.textContent = c.pend + 11; hud.curso.textContent = c.curso + 6; hud.cerr.textContent = c.cerr + 23 + cerradasExtra; hud.urg.textContent = c.urg; }
  };
  let cerradasExtra = 0;
  const anotar = (p, txt) => {
    if (!hud.log) return;
    const d = document.createElement('div');
    d.innerHTML = `<i>${hhmm(minutos)}</i><b>${p.ot}</b> <span class="e-${p.estado}">${txt}</span> · ${p.lugar}`;
    hud.log.appendChild(d);
    while (hud.log.children.length > 7) hud.log.firstChild.remove();
  };
  const SIG = { pend: 'curso', curso: 'cerr', urg: 'curso', cerr: 'pend' };
  const avanzar = () => {
    minutos += 7 + Math.floor(azar() * 9);
    if (hud.hora) hud.hora.textContent = hhmm(minutos);
    const p = pins[Math.floor(Math.random() * pins.length)];
    if (p.estado !== 'urg' && Math.random() < 0.12 && !pins.some((o) => o.estado === 'urg')) {
      p.estado = 'urg'; p.tarea = URGENCIAS[Math.floor(Math.random() * URGENCIAS.length)];
      anotar(p, `emergencia: ${p.tarea.toLowerCase()}`);
    } else {
      const antes = p.estado; p.estado = SIG[p.estado];
      if (antes === 'cerr') { cerradasExtra++; p.tarea = TAREAS[Math.floor(Math.random() * TAREAS.length)]; p.ot = `OT-000${300 + Math.floor(Math.random() * 600)}`; anotar(p, 'nueva orden'); }
      else anotar(p, p.estado === 'curso' ? 'en curso' : 'cerrada con firma');
    }
    pintarPin(p); contar();
  };
  contar();
  pins.slice(0, 4).forEach((p) => anotar(p, NOMBRE[p.estado].toLowerCase()));

  // ------------------------------------------------------------ cámara e interacción
  let ang = 0.8, angObj = 0.8, elev = 0.74, elevObj = 0.74, px = 0, py = 0, pxObj = 0, pyObj = 0;
  let arrastre = null;
  const radioBase = () => (angosto() ? (movil ? 31 : 36) : 46);
  lienzo.addEventListener('pointerdown', (e) => {
    arrastre = { x: e.clientX, y: e.clientY, a: angObj, el: elevObj, movio: false };
    lienzo.classList.add('arrastrando');
    if (e.pointerType === 'mouse') lienzo.setPointerCapture(e.pointerId);
  });
  window.addEventListener('pointerup', () => { arrastre = null; lienzo.classList.remove('arrastrando'); });
  const raton = new THREE.Vector2(), rayo = new THREE.Raycaster();
  let sobre = -1;
  hero.addEventListener('pointermove', (e) => {
    const r = lienzo.getBoundingClientRect();
    pxObj = ((e.clientX - r.left) / r.width - 0.5) * 2; pyObj = ((e.clientY - r.top) / r.height - 0.5) * 2;
    if (arrastre && e.pointerType === 'mouse') {
      angObj = arrastre.a - (e.clientX - arrastre.x) * 0.006;
      elevObj = Math.max(0.28, Math.min(1.1, arrastre.el + (e.clientY - arrastre.y) * 0.003));
    }
    raton.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  });
  // en pantallas táctiles, tocar una orden muestra su ficha
  lienzo.addEventListener('click', (e) => {
    const r = lienzo.getBoundingClientRect();
    raton.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  });
  hero.addEventListener('pointerleave', () => { pxObj = 0; pyObj = 0; raton.set(9, 9); });
  raton.set(9, 9);

  const ficha = $('pinInfo');
  const v = new THREE.Vector3();
  const mostrarFicha = (k) => {
    if (!ficha) return;
    if (k < 0) { ficha.classList.remove('ve'); return; }
    const p = pins[k];
    ficha.innerHTML = `<code>${p.ot}</code><b>${p.tarea}</b><div style="color:var(--texto-2);margin-bottom:6px">${p.lugar}</div><span class="est" style="color:${CSS[p.estado]}">${NOMBRE[p.estado]}</span>`;
    ficha.classList.add('ve');
  };
  const ubicarFicha = (k) => {
    if (!ficha || k < 0) return;
    pins[k].g.getWorldPosition(v); v.project(camara);
    const rl = lienzo.getBoundingClientRect(), rh = hero.getBoundingClientRect();
    ficha.style.left = `${rl.left - rh.left + (v.x + 1) / 2 * rl.width}px`;
    ficha.style.top = `${rl.top - rh.top + (1 - v.y) / 2 * rl.height}px`;
  };

  const ajustar = () => {
    const r = lienzo.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    camara.aspect = r.width / r.height; camara.updateProjectionMatrix();
  };
  new ResizeObserver(ajustar).observe(lienzo); ajustar();

  let activo = true;
  new IntersectionObserver(([e]) => { activo = e.isIntersecting; }, { threshold: 0 }).observe(hero);

  const reloj = new THREE.Clock();
  let t = 0, proximo = 1.4;
  const objetivo = new THREE.Vector3();
  const tocables = pins.map((p) => p.toque);

  function cuadro() {
    requestAnimationFrame(cuadro);
    const dt = Math.min(reloj.getDelta(), 0.05);
    if (!activo || document.hidden) return;
    t += dt;

    // la ciudad crece al entrar
    const crece = quieto ? 1 : Math.min(1, t / 1.8), e = 1 - Math.pow(1 - crece, 3);
    ciudad.scale.y = Math.max(0.001, e);

    if (!quieto && !arrastre) angObj += dt * 0.045;
    ang += (angObj - ang) * 0.06; elev += (elevObj - elev) * 0.06;
    px += (pxObj - px) * 0.05; py += (pyObj - py) * 0.05;
    const sc = Math.min(1, window.scrollY / Math.max(1, hero.offsetHeight));
    const R = radioBase() * (1 + sc * 0.25);
    const a = ang + px * 0.12, el = elev + py * 0.05;
    camara.position.set(Math.cos(a) * Math.cos(el) * R, Math.sin(el) * R, Math.sin(a) * Math.cos(el) * R);
    // en escritorio la ciudad se corre a la derecha para dejar lugar al texto
    const corr = angosto() ? 0 : 11.5;
    objetivo.set(0, 2.2, 0).addScaledVector(new THREE.Vector3(Math.sin(a), 0, -Math.cos(a)), -corr);
    camara.lookAt(objetivo);

    pins.forEach((p, k) => {
      const lat = 1 + Math.sin(t * (p.estado === 'urg' ? 7 : 2.4) + k) * (p.estado === 'urg' ? 0.35 : 0.12);
      p.aura.scale.setScalar((p.estado === 'urg' ? 2.4 : 1.5) * lat * (sobre === k ? 1.5 : 1));
      p.nucleo.scale.setScalar(sobre === k ? 1.6 : 1);
      const fa = (t * 0.6 + p.fase) % 1;
      p.anillo.scale.setScalar(1 + fa * (p.estado === 'urg' ? 4 : 2.2));
      p.anillo.material.opacity = (1 - fa) * 0.8;
      const u = quieto ? 0.5 : (t * p.vel + p.fase) % 1;
      p.paquete.position.copy(p.curva.getPoint(u));
      p.paquete.material.opacity = Math.sin(u * Math.PI);
      p.g.position.y = p.curva.v2.y + Math.sin(t * 1.5 + k) * 0.08;
    });

    cuadrillas.forEach((c) => {
      if (!quieto) c.t += c.vel * dt * 4;
      if (c.t > 1) c.t = -1; if (c.t < -1) c.t = 1;
      const mov = c.t * lim;
      if (c.eje === 'x') c.m.position.set(mov, 0.12, c.fija); else c.m.position.set(c.fija, 0.12, mov);
    });

    if (!quieto) {
      const arr = geoP.attributes.position.array;
      for (let k = 1; k < arr.length; k += 3) { arr[k] += dt * 0.25; if (arr[k] > 14) arr[k] = 0; }
      geoP.attributes.position.needsUpdate = true;
      particulas.rotation.y += dt * 0.02;
      proximo -= dt;
      if (proximo <= 0 && t > 2) { avanzar(); proximo = 1.6 + Math.random() * 1.2; }
    }

    // orden bajo el cursor
    if (t > 1.8) {
      rayo.setFromCamera(raton, camara);
      const hit = rayo.intersectObjects(tocables, false)[0];
      const k = hit ? hit.object.userData.pin : -1;
      if (k !== sobre) { sobre = k; mostrarFicha(k); lienzo.style.cursor = k >= 0 ? 'pointer' : ''; }
      ubicarFicha(sobre);
    }

    renderer.render(escena, camara);
  }
  hero.classList.add('con-3d');
  cuadro();
}
