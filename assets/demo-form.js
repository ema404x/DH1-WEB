// Formulario de solicitud de demo: envía por Web3Forms, que reenvía al correo de DH1 sin exponerlo en la página.
// La clave de acceso de Web3Forms es pública por diseño (solo permite enviar a la casilla asociada).
(function(){
  const ACCESS_KEY = '18bd76bc-55c9-4a5a-be1e-ebdb9aef60fe';
  const ENDPOINT = 'https://api.web3forms.com/submit';

  document.querySelectorAll('form.demo-form').forEach(form => {
    const status = form.querySelector('.df-status');
    const btn = form.querySelector('button[type="submit"]');
    const setStatus = (msg, cls) => { status.textContent = msg; status.className = 'df-status' + (cls ? ' ' + cls : ''); };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let firstBad = null;
      form.querySelectorAll('input[required]').forEach(inp => {
        const bad = !inp.value.trim() || (inp.type === 'email' && !inp.checkValidity());
        inp.classList.toggle('df-invalid', bad);
        if (bad && !firstBad) firstBad = inp;
      });
      if (firstBad) { setStatus('Completá nombre, empresa y un email válido.', 'err'); firstBad.focus(); return; }

      const data = Object.fromEntries(new FormData(form));
      if (data.botcheck) return;
      delete data.botcheck;
      const payload = {
        access_key: ACCESS_KEY,
        subject: form.dataset.subject || 'Solicitud de demo — DH1 Software',
        from_name: 'Web DH1 Software',
        pagina: location.pathname,
        ...data
      };

      btn.disabled = true;
      setStatus('Enviando…');
      try {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) throw new Error(json.message || res.status);
        form.reset();
        form.classList.add('sent');
        setStatus('¡Gracias! Recibimos tu solicitud y te vamos a contactar a la brevedad para coordinar la demo.', 'ok');
      } catch (err) {
        btn.disabled = false;
        setStatus('No pudimos enviar la solicitud. Probá de nuevo en unos minutos.', 'err');
      }
    });

    form.querySelectorAll('input[required]').forEach(inp =>
      inp.addEventListener('input', () => inp.classList.remove('df-invalid')));
  });
})();
