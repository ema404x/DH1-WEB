// DH1 Software — interacciones de la home corporativa: tarjetas con relieve, filtro de módulos,
// pila de niveles 3D y núcleo de seguridad que siguen al mouse.
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fino = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ------------------------------------------------------------ tarjetas con relieve y luz que sigue al cursor
  if (fino && !quieto) {
    $$('[data-tilt]').forEach((el) => {
      const max = +el.dataset.tilt || 7;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--rx', `${((0.5 - y) * max).toFixed(2)}deg`);
        el.style.setProperty('--ry', `${((x - 0.5) * max).toFixed(2)}deg`);
        el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
        el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
      });
      el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    });
  }

  // ------------------------------------------------------------ filtro de módulos
  const botones = $$('.filtros button');
  const mods = $$('#grillaMod .mod');
  botones.forEach((b) => b.addEventListener('click', () => {
    const f = b.dataset.f;
    botones.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    mods.forEach((m, k) => {
      const ver = f === 'todos' || m.dataset.c === f;
      m.classList.toggle('oculto', !ver);
      m.classList.remove('entra');
      if (ver && !quieto) { void m.offsetWidth; m.style.animationDelay = `${(k % 8) * 30}ms`; m.classList.add('entra'); }
    });
  }));

  // ------------------------------------------------------------ niveles ↔ pila 3D
  const pila = $('#pila');
  const planos = $$('#pila .plano');
  const niveles = $$('#niveles li');
  const activar = (n) => {
    planos.forEach((p) => p.classList.toggle('activo', p.style.getPropertyValue('--n').trim() === String(n)));
    niveles.forEach((li) => li.classList.toggle('activo', li.dataset.n === String(n)));
  };
  niveles.forEach((li) => {
    li.addEventListener('mouseenter', () => activar(li.dataset.n));
    li.addEventListener('focus', () => activar(li.dataset.n));
    li.addEventListener('click', () => activar(li.dataset.n));
  });
  // sin interacción, los niveles se encienden de a uno
  let auto = 3, tocado = false;
  niveles.forEach((li) => li.addEventListener('mouseenter', () => { tocado = true; }));
  if (pila && !quieto) setInterval(() => {
    if (tocado || !pila.classList.contains('visto')) return;
    activar(auto); auto = (auto + 3) % 4;
  }, 2200);

  // ------------------------------------------------------------ objetos 3D que giran con el mouse
  const seguir = (zona, blanco, k) => {
    if (!zona || !blanco || !fino || quieto) return;
    zona.addEventListener('pointermove', (e) => {
      const r = zona.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      blanco.style.setProperty('--gx', `${(x * k).toFixed(2)}deg`);
      blanco.style.setProperty('--gy', `${(-y * k).toFixed(2)}deg`);
    });
    zona.addEventListener('pointerleave', () => { blanco.style.setProperty('--gx', '0deg'); blanco.style.setProperty('--gy', '0deg'); });
  };
  seguir($('#plataforma'), $('#pila .escenario'), 22);
  seguir($('#seguridad'), $('.orbitas'), 30);
})();
