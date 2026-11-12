// Arma las páginas de cada módulo con el mismo lenguaje de la home ("Un día de obra"), cada una con su escala de tiempo.
// Toma de index.html el cielo, la ciudad, la barra, el formulario, el pie y algunos objetos interactivos
// (teléfono sin señal, firma, calendario, pañol, certificado) para no tener dos copias que se desincronicen.
// Uso: node herramientas/armar-paginas.cjs   (desde la raíz del repo)
'use strict';
const fs = require('fs'), path = require('path');
const raiz = path.resolve(__dirname, '..');
const home = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
const SITIO = 'https://dh1software.com';

const cortar = (desde, hasta) => {
  const a = home.indexOf(desde); const b = home.indexOf(hasta, a);
  if (a < 0 || b < 0) throw new Error(`No encuentro "${desde}" … "${hasta}" en index.html`);
  return home.slice(a, b + hasta.length);
};
const fuentes = home.match(/<link rel="preconnect"[\s\S]*?display=swap" rel="stylesheet">/)[0];
const capas = cortar('<div class="cielo"', '</header>');
const form = cortar('<form class="demo-form"', '</form>');
const pie = cortar('<footer class="pie">', '</footer>')
  .replace(/href="#manana"/g, 'href="#demo"')
  .replace(/href="#([a-z-]+)"/g, (m, id) => (id === 'demo' ? m : `href="/#${id}"`));
// objeto de un capítulo de la home, tal cual (mantiene los id que usa dia.js)
const objeto = (id) => {
  const m = home.match(new RegExp(`<section class="cap[^"]*" id="${id}"[\\s\\S]*?<div class="objeto aparece">([\\s\\S]*?)\\n    </div>\\n  </section>`));
  if (!m) throw new Error(`Sin objeto para #${id}`);
  return m[1];
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const sinEtiquetas = (s) => s.replace(/<[^>]+>/g, '');

// ------------------------------------------------------------ piezas de los objetos
const ficha = ({ etq, titulo, filas, pie: p, sello, tinta = 'azul', gira = 'i', cinta = true }) => `
      <div class="hoja ficha gira-${gira}">
        ${cinta ? '<span class="cinta" aria-hidden="true"></span>' : ''}
        <div class="etq">${etq}</div>
        <h3>${titulo}</h3>
        <ul class="filas">${filas.map(([a, b]) => `<li class="escalon"><span>${a}</span><span>${b}</span></li>`).join('')}</ul>
        ${p ? `<div class="pie-ficha">${p}</div>` : ''}
        ${sello ? `<span class="marca-tinta tinta-${tinta} escalon">${sello}</span>` : ''}
      </div>`;
const linea = (pasos) => `
      <div class="panel linea"><ol>${pasos.map(([estado, hora, t, d]) => `<li class="escalon ${estado}"><code>${hora}</code><b>${t}</b>${d ? `<span>${d}</span>` : ''}</li>`).join('')}</ol></div>`;
const APP = '<svg viewBox="0 0 30 30" aria-hidden="true"><text x="3" y="21" font-family="Bricolage Grotesque, Inter, sans-serif" font-weight="800" font-size="15" fill="#2e6cd6">DH</text><text x="22" y="21" font-family="Bricolage Grotesque, Inter, sans-serif" font-weight="800" font-size="15" fill="#f5b83a">1</text></svg>';
const avisos = (lista) => `
      <div class="pila-avisos">${lista.map(([quien, hora, t, d]) => `
        <div class="aviso-tel escalon"><span class="app">${APP}</span><div><small><span>${quien}</span><span>${hora}</span></small><b>${t}</b><p>${d}</p></div></div>`).join('')}
      </div>`;
const medidor = ({ titulo, barras, nota }) => `
      <div class="panel medidor">
        <div class="etq-panel">${titulo}</div>
        ${barras.map(([nombre, v, clase]) => `<p>${nombre}</p><div class="pista"><i class="${clase}" style="--v:${v}"></i></div>`).join('')}
        <div class="eje"><span>0 %</span><span>50 %</span><span>100 %</span></div>
        ${nota ? `<p class="escalon" style="margin-top:14px">${nota}</p>` : ''}
      </div>`;

// ------------------------------------------------------------ las páginas
const PAGINAS = [
  {
    ruta: 'ordenes-de-trabajo-digitales',
    nav: 'Órdenes de trabajo',
    titulo: 'Órdenes de trabajo digitales con firma y GPS | DH1 Software',
    desc: 'Generá, asigná y cerrá órdenes de trabajo desde el celular, con firma digital, geolocalización GPS del cierre y fotos de evidencia. Todo vinculado a la obra o al equipo correspondiente.',
    miga: 'Órdenes de trabajo digitales',
    escala: 'La vida de una orden',
    portada: {
      etq: 'Min 0', grande: 'Min<span> </span>0',
      h1: 'Una orden nace, viaja <em>y vuelve firmada.</em>',
      bajada: 'De una emergencia, de una inspección o de un mantenimiento que vence. La toma una cuadrilla, la resuelve en el lugar y la cierra con fotos y firma. <strong>Esta es la vida de una orden en DH1, minuto a minuto.</strong>',
      nota: 'Bajá: el reloj de la izquierda ahora cuenta la vida de una orden.',
    },
    caps: [
      { id: 'nace', etq: 'Min 0', marca: 'Min 0 · Nace', h2: 'Una orden <em>no aparece sola.</em>',
        bajada: 'Alguien reporta una emergencia desde el QR del lugar, una inspección encuentra un problema, vence una rutina o la oficina la carga a mano. <strong>Cada una entra con su lugar, su equipo y su prioridad.</strong>',
        libro: ['La emergencia y su orden urgente se crean juntas: no queda una sin la otra.', 'El preventivo genera órdenes solas. Generar dos veces no duplica.', 'El informe de inspección propone las órdenes; una persona las confirma.'],
        obj: avisos([
          ['QR · Escuela N° 12', '09:41', 'Emergencia: pérdida de gas', 'Reportada por el responsable del lugar. Orden urgente creada.'],
          ['Preventivo', '06:00', 'Vence: caldera Escuela 21', 'La rutina mensual generó su orden. Una sola por lugar.'],
          ['Inspección', 'ayer', 'Tablero sin tapa en aula 3', 'El informe propuso una orden. La confirmó la coordinación.'],
          ['Oficina', '08:15', 'Cambio de luminarias', 'Cargada a mano, con el equipo y la foto del pedido.'],
        ]) },
      { id: 'asignada', etq: 'Min 4', marca: 'Min 4 · Asignada', h2: 'Cuatro minutos después <em>ya tiene dueño.</em>',
        bajada: 'Se asigna a una persona o a una cuadrilla. Le llega al teléfono y aparece en el lugar: <strong>quien escanea el QR del lugar ve las órdenes que tiene ahí.</strong>',
        libro: ['Cada operario ve solo lo suyo. Cada empresa, solo lo suyo.', 'La prioridad ordena la lista del teléfono.', 'Si es urgente, gerencia y el jefe de sitio se enteran al instante.'],
        obj: ficha({ etq: 'Orden de trabajo', titulo: 'OT-000175 · Bomba cisterna sin presión', filas: [['Lugar', 'Hospital Sur'], ['Equipo', 'Bomba cisterna 2'], ['Prioridad', 'Alta'], ['Asignada a', 'Cuadrilla 3 · J. Ruiz'], ['Creada', '13:12'], ['Asignada', '13:16']], sello: 'ASIGNADA', tinta: 'azul' }) },
      { id: 'en-curso', etq: 'Hora 1', marca: 'Hora 1 · En curso', h2: 'En el lugar, <em>con el teléfono.</em>',
        bajada: 'El operario escanea el QR, abre la orden y va marcando el checklist. Saca fotos; se achican en el teléfono antes de subir. <strong>Si se queda sin señal, sigue trabajando igual.</strong>',
        libro: ['Checklist y notas se guardan en el teléfono a cada cambio.', 'Fotos de a una, comprimidas: subir varias seguidas no lo cuelga.', 'Sin señal se guarda y se envía solo después. <a href="/trabajo-sin-senal/">Ver cómo →</a>'],
        obj: linea([
          ['ok', '14:02', 'Escaneó el QR del lugar', 'Hospital Sur · a 6 m'],
          ['ok', '14:03', 'Empezó la orden', 'Pasa a "en curso" para todos'],
          ['ok', '14:20', 'Checklist 2 de 4', 'Guardado en el teléfono'],
          ['ya', '14:31', 'Sin señal en la sala de bombas', '3 cambios esperando en el teléfono'],
          ['ok', '14:48', 'Volvió la señal', 'Enviado en orden, sin duplicar'],
        ]) },
      { id: 'cierre', etq: 'Hora 3', marca: 'Hora 3 · Cierre', h2: 'No se cierra <em>a medias.</em>',
        bajada: 'Sin el checklist completo, o sin el motivo de lo que no se pudo hacer, la orden no se cierra. Si pide fotos, sin fotos tampoco. <strong>El responsable del lugar firma en la pantalla</strong> y el sistema guarda la ubicación y la hora del cierre.',
        libro: ['Firmá acá con el mouse o el dedo.', 'La ubicación del cierre la pone el sistema, no el operario.', 'Lo que faltó de material queda anotado para el pañol.'],
        obj: objeto('cierre') },
      { id: 'validada', etq: 'Día 2', marca: 'Día 2 · Validada', h2: 'Queda en la historia <em>del equipo.</em>',
        bajada: 'El jefe la aprueba o la devuelve con un comentario. Aprobada, sale en PDF con fotos y firma, y <strong>se suma sola al historial del equipo:</strong> la próxima vez que alguien lo escanee, ve todo lo que se le hizo.',
        libro: ['El historial lo escribe la base: nadie tiene que acordarse.', 'Devolver pide motivo, y el operario lo ve en su teléfono.', 'Todo queda auditado: quién, qué y cuándo.'],
        obj: ficha({ etq: 'Historial · Bomba cisterna 2', titulo: 'Hospital Sur, sala de bombas', filas: [['OT-000175 · Sello mecánico', 'hoy'], ['OT-000131 · Preventivo trimestral', 'hace 41 días'], ['OT-000098 · Presostato', 'hace 3 meses'], ['Movida desde el pañol', 'hace 8 meses'], ['Alta con QR', 'hace 1 año']], sello: 'APROBADA · PDF', tinta: 'verde', gira: 'd' }) },
    ],
    faq: [
      ['¿Qué es una orden de trabajo digital?', 'Es la versión digital de la OT en papel: un registro de qué hay que hacer, quién lo hace, dónde y cuándo, que se completa desde el celular y queda guardado con firma, fotos y ubicación.'],
      ['¿La firma digital tiene validez?', 'La firma en pantalla funciona como constancia de conformidad del trabajo realizado dentro de tu operación. Para usos con requisitos legales específicos, consultá con tu asesor.'],
      ['¿Hace falta instalar algo?', 'No. Las órdenes se abren desde el navegador del celular o la tablet.'],
      ['¿Puedo ver el historial de órdenes de un equipo?', 'Sí. Cada OT queda vinculada a su obra o equipo, así que ves todas las intervenciones anteriores en un solo lugar.'],
      ['¿Qué pasa si en el lugar no hay señal?', 'El operario sigue trabajando: lo que hace queda guardado en el teléfono y se envía cuando vuelve la señal, en orden y sin duplicar.'],
    ],
    demoEtq: 'Ahora',
  },
  {
    ruta: 'software-mantenimiento-preventivo',
    nav: 'Mantenimiento',
    titulo: 'Software de mantenimiento preventivo (CMMS) | DH1 Software',
    desc: 'Software de mantenimiento preventivo y correctivo: planes recurrentes por equipo, alertas de vencimiento, órdenes de trabajo con firma digital y GPS, e historial completo por activo.',
    miga: 'Mantenimiento preventivo',
    escala: 'El año de una caldera',
    portada: {
      etq: 'Enero', grande: 'Enero',
      h1: 'Una caldera, un año, <em>ninguna fecha olvidada.</em>',
      bajada: 'Se da de alta, se le pone un QR y una rutina. Después el sistema se acuerda solo: genera las órdenes cuando vencen, respeta la temporada y guarda cada intervención. <strong>Este es el año de una caldera en DH1.</strong>',
      nota: 'Bajá: el reloj de la izquierda ahora pasa los meses.',
    },
    caps: [
      { id: 'alta', etq: 'Enero', marca: 'Enero · Alta', h2: 'Entra con <em>QR y rutina.</em>',
        bajada: 'La caldera se carga con su lugar, sus datos y sus documentos. Se le pega un QR. <strong>Su rutina dice cada cuánto se revisa y en qué meses del año.</strong>',
        libro: ['Un solo formato de QR, para lugares y equipos.', 'Manuales, planos y garantías, en la ficha del equipo.', 'QR de todos los equipos en un PDF para imprimir.'],
        obj: ficha({ etq: 'Equipo · alta', titulo: 'Caldera · Escuela N° 21', filas: [['Ubicación', 'Sala de máquinas'], ['Rutina', 'Mantenimiento de caldera'], ['Frecuencia', 'Mensual'], ['Temporada', 'Abril a septiembre'], ['Próxima', '1 de abril'], ['QR', 'Impreso y pegado']], sello: 'ALTA', tinta: 'azul' }) },
      { id: 'preventivo', etq: 'Abril', marca: 'Abril · Vence', h2: 'Vence y <em>la orden aparece.</em>',
        bajada: 'Lo que vence en los próximos días se vuelve orden de trabajo, asignada y en el teléfono de la cuadrilla. <strong>Una sola orden abierta por rutina y lugar:</strong> generar dos veces no duplica.',
        libro: ['La próxima fecha avanza sola al generar.', 'El calendario muestra lo que vence en el mes.', 'Alertas de lo vencido en el tablero.'],
        obj: objeto('preventivo') },
      { id: 'correctiva', etq: 'Julio', marca: 'Julio · Falla', h2: 'Igual se rompe. <em>Queda anotado.</em>',
        bajada: 'Un lunes de julio no enciende. Alguien lo reporta desde el QR, sin usuario. Se crea la emergencia con su orden urgente, y <strong>cuando se resuelve, se cierra la orden.</strong> El preventivo y el correctivo terminan en la misma historia.',
        libro: ['Emergencia y orden urgente se crean juntas.', 'Si se repite en el mismo lugar, se ve en el tablero.', 'El jefe del lugar la ve y la atiende.'],
        obj: avisos([
          ['QR · Escuela N° 21', '07:52', 'La caldera no enciende', 'Reportado desde el portal, sin usuario.'],
          ['DH1', '07:52', 'Orden urgente OT-000188', 'Asignada a la cuadrilla de calefacción.'],
          ['Cuadrilla 2', '09:30', 'Resuelto: termocupla cambiada', 'Fotos y firma del responsable.'],
          ['DH1', '09:31', 'Emergencia cerrada', 'Sumada al historial de la caldera.'],
        ]) },
      { id: 'temporada', etq: 'Octubre', marca: 'Octubre · Temporada', h2: 'En octubre <em>no molesta.</em>',
        bajada: 'Fuera de temporada la rutina espera al primer mes que le corresponde. <strong>No genera órdenes que nadie va a hacer,</strong> ni se reprograma a ciegas cada 30 días.',
        libro: ['Rutinas por lugar, con su ciclo y sus meses.', 'Lo que no se hizo queda pendiente, no desaparece.', 'Relevamientos de calefacción por período.'],
        obj: linea([
          ['ok', 'Abril', 'Preventiva generada y cerrada', 'OT-000142'],
          ['ok', 'Mayo', 'Preventiva generada y cerrada', 'OT-000157'],
          ['ok', 'Junio', 'Preventiva generada y cerrada', 'OT-000169'],
          ['no', 'Julio', 'Correctiva urgente', 'OT-000188 · termocupla'],
          ['ok', 'Agosto · Septiembre', 'Preventivas cerradas', 'OT-000196 · OT-000214'],
          ['ya', 'Octubre', 'Fuera de temporada', 'Espera hasta abril'],
        ]) },
      { id: 'expediente', etq: 'Diciembre', marca: 'Diciembre · Expediente', h2: 'Un año entero <em>en una ficha.</em>',
        bajada: 'Cada orden cerrada, cada cambio de estado y cada movimiento quedan en el historial del equipo, <strong>escritos por la base, no a mano.</strong> Escaneás el QR y lo ves todo.',
        libro: ['Historial automático por equipo.', 'Documentos y fotos, en el mismo lugar.', 'Informes listos para mostrar.'],
        obj: ficha({ etq: 'Expediente · Caldera Escuela N° 21', titulo: 'Este año', filas: [['Preventivas hechas', '6 de 6'], ['Correctivas', '1'], ['Horas de trabajo', '23 h'], ['Fotos', '41'], ['Documentos', '3'], ['Próxima', '1 de abril']], sello: 'AL DÍA', tinta: 'verde', gira: 'd' }) },
    ],
    faq: [
      ['¿Qué diferencia hay entre mantenimiento preventivo y correctivo?', 'El preventivo se planifica con anticipación (inspecciones, cambios de filtros, calibraciones) para evitar fallas. El correctivo se hace cuando el equipo ya falló. DH1 maneja los dos y guarda ambos en el historial del activo.'],
      ['¿Sirve para edificios, hospitales o plantas industriales?', 'Sí. DH1 se usa para mantenimiento industrial y de edificios: equipos, instalaciones y servicios con planes recurrentes y órdenes de trabajo.'],
      ['¿Los técnicos necesitan una app aparte?', 'No. DH1 funciona desde el navegador del celular o la tablet; el técnico abre la orden, la resuelve y la cierra desde ahí.'],
      ['¿Se puede migrar el plan que hoy tengo en Excel?', 'Sí. En la etapa de configuración cargamos tu inventario de equipos y tus planes actuales para que arranques con los datos que ya tenés.'],
    ],
    demoEtq: 'Abril otra vez',
  },
  {
    ruta: 'certificados-de-obra',
    nav: 'Certificados',
    nuevo: true,
    titulo: 'Certificados de obra con cadena de firmas | DH1 Software',
    desc: 'Certificados de avance de obra armados desde la orden de compra: la base calcula lo anterior y lo acumulado, no deja certificar de más, pasa por la cadena de firmas y recién al final toma número.',
    miga: 'Certificados de obra',
    escala: 'El mes de un certificado',
    portada: {
      etq: 'Día 1', grande: 'Día<span> </span>1',
      h1: 'Un certificado que <em>no se puede inflar.</em>',
      bajada: 'Se arma desde la orden de compra, se mide lo del mes y pasa por las firmas que tenga que pasar. <strong>La base hace las cuentas y pone los límites:</strong> nadie certifica de más, nadie toca lo emitido y nadie aprueba lo propio.',
      nota: 'Bajá: el reloj de la izquierda ahora cuenta los días del mes.',
    },
    caps: [
      { id: 'contrato', etq: 'Día 1', marca: 'Día 1 · Contrato', h2: 'El PDF de la orden de compra, <em>leído.</em>',
        bajada: 'Arrastrás el PDF y la IA propone los ítems con cantidades y precios. El sistema suma y compara contra el total del documento, y marca los renglones que parecen subtotales. <strong>La IA propone; vos revisás y guardás.</strong>',
        libro: ['Control de la suma contra el total del documento.', 'Si algo no cierra, le pedís a la IA que corrija.', 'El PDF original queda en el contrato.'],
        obj: ficha({ etq: 'Orden de compra · leída del PDF', titulo: 'Termografía anual · Comuna 8B', filas: [['1 · Relevamiento', '$ 480.000'], ['2 · Termografía tableros', '$ 900.000'], ['3 · Informe final', '$ 420.000'], ['Suma de ítems', '$ 1.800.000'], ['Total del documento', '$ 1.800.000']], pie: 'Diferencia 0,0 % · tolerancia 0,5 %', sello: 'CIERRA', tinta: 'verde' }) },
      { id: 'medicion', etq: 'Día 12', marca: 'Día 12 · Medición', h2: 'Lo anterior y lo acumulado <em>no se escriben.</em>',
        bajada: 'Se carga solo lo del período. Lo anterior y lo acumulado los calcula la base con lo ya certificado de cada ítem. <strong>Si alguien intenta pasar del 100 %, la base lo rechaza,</strong> por ítem y por total.',
        libro: ['Cada ítem del contrato tiene identidad propia: no se confunde.', 'Un solo borrador por contrato.', 'Lo emitido no se toca.'],
        obj: medidor({ titulo: 'Ítem 2 · Termografía tableros', barras: [['Ya certificado: 75 %', '75%', 'real'], ['Intento del mes: +40 %', '100%', 'esperado']], nota: '<b style="color:var(--rojo)">Rechazado por la base:</b> llegaría al 115 %. Máximo posible este mes: 25 %.' }) },
      { id: 'certificado', etq: 'Día 25', marca: 'Día 25 · Firmas', h2: 'Pasa por la cadena <em>y recién ahí toma número.</em>',
        bajada: 'El certificado se congela y recorre las firmas en orden. Cada uno revisa un checklist antes de firmar; si rechaza, explica por qué y vuelve a borrador. <strong>El número lo toma al final,</strong> así no quedan números salteados.',
        libro: ['Firma solo a quien le toca.', 'Cada envío es una ronda: la historia queda.', 'Mientras está en firmas, el contrato no admite otro certificado.'],
        obj: objeto('certificado') },
      { id: 'aprobado', etq: 'Día 28', marca: 'Día 28 · Aprobado', h2: 'Lo aprueba <em>otra persona.</em>',
        bajada: 'Quien lo emitió, o quien firmó en la cadena, no puede aprobarlo. Aprobado, sale en PDF con todas las firmas, y <strong>la auditoría dice quién hizo qué y cuándo.</strong>',
        libro: ['Rechazar pide motivo y devuelve a borrador.', 'PDF con el jefe, la cadena y la gerencia.', 'Auditoría de firmas por certificado.'],
        obj: linea([
          ['ok', 'Día 24 · 17:02', 'Enviado a firmas', 'M. Gómez · ronda 1'],
          ['ok', 'Día 25 · 09:15', 'Firmó jefe de sitio', 'Checklist 6 de 6'],
          ['no', 'Día 25 · 11:40', 'Rechazó inspección', '"Falta el informe del ítem 3"'],
          ['ok', 'Día 26 · 10:05', 'Reenviado · ronda 2', 'Con el informe adjunto'],
          ['ok', 'Día 27 · 16:20', 'Última firma: N° 47', 'Emitido'],
          ['ok', 'Día 28 · 12:00', 'Aprobado por gerencia', 'Otra persona, como debe ser'],
        ]) },
      { id: 'abonos', etq: 'Día 30', marca: 'Día 30 · Abonos', h2: 'Los abonos del mes, <em>de una vez.</em>',
        bajada: 'Los contratos de abono vigentes certifican su parte del mes con un botón: la cantidad dividida por los meses de vigencia, y <strong>el último mes completa el saldo.</strong> Un período nunca se certifica dos veces.',
        libro: ['Cada contrato, independiente: si uno falla, los otros siguen.', 'Solicitudes de certificado con su propio circuito.', 'DH1 certifica y controla; la facturación la hace tu sistema.'],
        obj: ficha({ etq: 'Abonos del mes · octubre', titulo: 'Certificados generados', filas: [['Limpieza de campanas · 8A', '1/12 · N° 48'], ['Mantenimiento ascensores · 10B', '7/12 · N° 49'], ['Termomecánica · 8B', '12/12 · saldo · N° 50'], ['Desinfección · 10A', 'ya certificado'], ['Matafuegos · 8A', '3/6 · N° 51']], pie: '4 nuevos · 1 salteado porque ya estaba', sello: 'SIN REPETIDOS', tinta: 'verde', gira: 'd' }) },
    ],
    faq: [
      ['¿DH1 factura o cobra?', 'No. DH1 certifica el avance y controla la certificación. La facturación y el cobro los hace tu sistema contable.'],
      ['¿Se puede certificar más de lo que dice el contrato?', 'No. La base de datos rechaza cualquier certificado que pase el 100 % de un ítem o del total del contrato.'],
      ['¿Hay que cargar los ítems a mano?', 'No hace falta: subís el PDF de la orden de compra, la IA propone los ítems y el sistema controla que la suma cierre con el total. Vos revisás antes de guardar.'],
      ['¿Qué pasa si alguien de la cadena rechaza?', 'Tiene que escribir el motivo. El certificado vuelve a borrador, se corrige y se reenvía como una ronda nueva; la anterior queda en la historia.'],
      ['¿Quién aprueba el certificado?', 'Una persona distinta de quien lo emitió y de quienes firmaron en la cadena.'],
    ],
    demoEtq: 'Mes que viene',
  },
  {
    ruta: 'trabajo-sin-senal',
    nav: 'Campo sin señal',
    nuevo: true,
    titulo: 'Órdenes de trabajo sin señal: trabajo de campo offline | DH1 Software',
    desc: 'Los operarios trabajan las órdenes sin señal: checklist, fotos y cierre quedan guardados en el teléfono y se envían solos cuando vuelve la conexión, en orden y sin duplicar.',
    miga: 'Campo sin señal',
    escala: '45 minutos en un sótano',
    portada: {
      etq: 'Min 0', grande: 'Min<span> </span>0',
      h1: 'Bajó al sótano. <em>La señal no.</em>',
      bajada: 'Sala de bombas, subsuelo, sala de máquinas: donde más se trabaja, menos señal hay. <strong>En DH1 el operario no espera a la red:</strong> trabaja, cierra y se va. Lo que hizo llega cuando el teléfono vuelve a tener conexión.',
      nota: 'Bajá: el reloj de la izquierda ahora cuenta los minutos sin señal.',
    },
    caps: [
      { id: 'antes', etq: 'Min 0', marca: 'Min 0 · Antes de bajar', h2: 'La orden <em>ya está en el teléfono.</em>',
        bajada: 'Las órdenes del operario quedan guardadas en el teléfono. <strong>Si escanea el QR sin señal, lo busca primero entre las órdenes guardadas,</strong> así abre igual.',
        libro: ['Cada usuario ve y envía solo lo suyo.', 'Se agrega a la pantalla de inicio como una app.', 'No hay que instalar nada desde una tienda.'],
        obj: ficha({ etq: 'En el teléfono · sin señal', titulo: 'Mis órdenes de hoy', filas: [['OT-000174 · Bomba cisterna', 'Hospital Sur'], ['OT-000176 · Tablero TS-2', 'Hospital Sur'], ['OT-000181 · Luminarias', 'Escuela N° 3']], pie: 'Guardadas en el teléfono · 10:19', sello: 'LISTAS', tinta: 'azul' }) },
      { id: 'sotano', etq: 'Min 8', marca: 'Min 8 · Sin señal', h2: 'Probalo: <em>cortale la señal.</em>',
        bajada: 'Apagá la señal del teléfono de al lado y marcá tareas. Quedan en espera. Volvé a prenderla y mirá cómo se envían. <strong>Así funciona en un teléfono de verdad.</strong>',
        libro: ['Checklist y notas se guardan a cada cambio.', 'Cerrar la app no pierde nada.', 'Salir con cambios sin enviar avisa y no los borra.'],
        obj: objeto('sotano') },
      { id: 'fotos', etq: 'Min 20', marca: 'Min 20 · Fotos', h2: 'Tres fotos seguidas <em>no lo cuelgan.</em>',
        bajada: 'Cada foto se achica en el teléfono antes de guardarse (1600 px, calidad de sobra para una orden). <strong>Se suben de a una,</strong> así un teléfono gama baja con datos móviles no se traba.',
        libro: ['Fotos comprimidas en el dispositivo.', 'Se suben en orden cuando hay señal.', 'Si la orden exige fotos, sin fotos no se cierra.'],
        obj: medidor({ titulo: 'Una foto de la sala de bombas', barras: [['Como sale de la cámara · 4,8 MB', '100%', 'esperado'], ['Como se guarda · 0,4 MB', '9%', 'real']], nota: 'Doce veces más liviana. Se lee igual.' }) },
      { id: 'vuelve', etq: 'Min 45', marca: 'Min 45 · Vuelve la señal', h2: 'Llega todo, <em>una sola vez.</em>',
        bajada: 'Sube la escalera y el teléfono se conecta. Lo que estaba esperando se envía <strong>en el orden en que se hizo</strong>, sin duplicar nada. Si la base rechaza algo, no se pierde: queda guardado con el motivo.',
        libro: ['Se envía al volver la señal y al volver a la app.', 'La base sigue siendo la que decide.', 'Aprobar y devolver se hacen con conexión, a propósito.'],
        obj: linea([
          ['ok', '11:05:02', 'Tarea 1 marcada', 'enviada'],
          ['ok', '11:05:03', 'Tarea 2 marcada', 'enviada'],
          ['ok', '11:05:03', 'Nota: "sello gastado"', 'enviada'],
          ['ok', '11:05:06', 'Foto 1 de 2', 'subida'],
          ['ok', '11:05:09', 'Foto 2 de 2', 'subida'],
          ['ok', '11:05:10', 'Orden cerrada con firma', 'enviada · sin duplicados'],
        ]) },
      { id: 'portal', etq: 'Sin usuario', marca: 'Además · Portal por QR', h2: 'Y sin usuario, <em>también.</em>',
        bajada: 'La tablet de la cuadrilla o cualquier teléfono escanea el QR del lugar y entra al portal de operarios, sin crear cuentas. <strong>El portal también guarda y reenvía lo que se hace sin señal.</strong>',
        libro: ['Un solo QR por lugar.', 'El portal se habilita con una clave que maneja la empresa.', 'Reportar una emergencia desde el QR crea su orden urgente.'],
        obj: avisos([
          ['Portal · Escuela N° 3', '15:10', 'Tablet de cuadrilla', 'Entró por el QR del lugar. Sin usuario.'],
          ['Portal', '15:12', 'Sin señal', 'Cierre de OT-000181 guardado en la tablet.'],
          ['Portal', '15:40', 'Enviado', 'Llegó a la base cuando volvió la señal.'],
        ]) },
    ],
    faq: [
      ['¿Hace falta instalar una app?', 'No desde una tienda. DH1 se abre en el navegador del teléfono y se puede agregar a la pantalla de inicio para usarlo como una app.'],
      ['¿Qué pasa si cierro la app sin señal?', 'Nada se pierde: lo que hiciste queda guardado en el teléfono. Se envía la próxima vez que abras la app con señal.'],
      ['¿Se envía solo, aunque no abra la app?', 'Con la app abierta, sí: apenas vuelve la señal. Con la app cerrada, un teléfono no garantiza el envío en segundo plano (en iPhone no se hace; en Android no es confiable), por eso se envía al volver a abrirla.'],
      ['¿Se puede duplicar una orden o una foto?', 'No. Cada cambio se envía una sola vez, en el orden en que se hizo.'],
      ['¿Y si la base rechaza algo que hice sin señal?', 'No se pierde: queda guardado en el teléfono con el motivo del rechazo, para corregirlo o descartarlo.'],
    ],
    demoEtq: 'Arriba',
  },
  {
    ruta: 'erp-constructoras',
    nav: 'Obras',
    titulo: 'Gestión de obras de mantenimiento | DH1 Software',
    desc: 'Software de gestión de obras de mantenimiento: obras con jefe de sitio, inspector y plazo, alerta de atraso, presupuestos, proveedores, pañol con QR del depósito a la obra, cuadrillas y certificación. Desarrollado en Argentina.',
    miga: 'Gestión de obras de mantenimiento',
    escala: 'Una obra de 90 días',
    portada: {
      etq: 'Día 1', grande: 'Día<span> </span>1',
      h1: 'Noventa días de mantenimiento <em>en un solo lugar.</em>',
      bajada: 'Una refacción en una escuela entra con su jefe de sitio, su inspector y su plazo. Después vienen los presupuestos, los materiales del pañol, las cuadrillas, las órdenes y los certificados. <strong>Estos son 90 días de una obra de mantenimiento, contados por DH1.</strong>',
      nota: 'Bajá: el reloj de la izquierda ahora cuenta los días de obra.',
    },
    caps: [
      { id: 'alta', etq: 'Día 1', marca: 'Día 1 · Alta', h2: 'La obra entra <em>con nombre y apellido.</em>',
        bajada: 'Comuna, jefe de sitio, inspector, plazo y documentos, cada cosa en su lugar. <strong>Si ya la tenés en una planilla, se importa:</strong> reimportar actualiza sin duplicar ni borrar lo que la planilla trae vacío.',
        libro: ['Jefe e inspector son usuarios, no nombres escritos.', 'Documentos de la obra en un depósito privado.', 'Cada empresa ve solo sus obras.'],
        obj: ficha({ etq: 'Obra · alta', titulo: 'Refacción sanitarios · Escuela N° 7', filas: [['Comuna', '8A'], ['Jefe de sitio', 'J. Ruiz'], ['Inspección', 'L. Díaz'], ['Inicio', '1 de agosto'], ['Plazo', '90 días'], ['Documentos', 'Pliego, planos, ADA']], sello: 'EN OBRA', tinta: 'azul' }) },
      { id: 'presupuestos', etq: 'Día 3', marca: 'Día 3 · Presupuestos', h2: 'Presupuestos <em>con estado.</em>',
        bajada: 'Las planillas de presupuesto viven en un repositorio con su estado y su obra. Los proveedores, en su propia lista. <strong>Nadie busca "la última versión" en un mail.</strong>',
        libro: ['Presupuestos por obra, con estado.', 'Proveedores y requerimientos de compra.', 'Enlaces a los archivos que vencen solos.'],
        obj: ficha({ etq: 'Presupuestos · Escuela N° 7', titulo: 'Refacción sanitarios', filas: [['Albañilería · v3', 'aprobado'], ['Instalación sanitaria · v2', 'aprobado'], ['Revestimientos · v1', 'en revisión'], ['Adicional rejillas', 'pedido']], pie: 'Proveedores: 6 · requerimientos abiertos: 2', sello: 'AL DÍA', tinta: 'verde', gira: 'd' }) },
      { id: 'panol', etq: 'Día 10', marca: 'Día 10 · Pañol', h2: 'Del depósito <em>a la obra.</em>',
        bajada: 'Los materiales salen del pañol con su movimiento registrado. Cuando el stock baja del mínimo, <strong>aparece el requerimiento de compra.</strong> Las herramientas se prestan y se devuelven con nombre.',
        libro: ['Inventario con QR.', 'Préstamos de herramientas con devolución.', 'Requerimientos de compra con su seguimiento.'],
        obj: objeto('panol') },
      { id: 'cuadrillas', etq: 'Día 30', marca: 'Día 30 · Cuadrillas', h2: 'La gente, <em>en la obra.</em>',
        bajada: 'La cuadrilla ficha con el QR de la obra; las órdenes de trabajo llegan a sus teléfonos y se cierran con fotos y firma. <strong>Las horas quedan por orden y por persona.</strong>',
        libro: ['Fichaje por QR o con la tablet de la cuadrilla.', 'Órdenes ligadas a la obra.', 'Funciona sin señal en el campo. <a href="/trabajo-sin-senal/">Ver cómo →</a>'],
        obj: linea([
          ['ok', '07:02', 'Fichó la cuadrilla 3', '4 personas · QR de la obra'],
          ['ok', '07:40', 'OT-000203 · Demolición revestimiento', 'en curso'],
          ['ok', '12:15', 'OT-000203 cerrada', '6 fotos · firma del director'],
          ['ya', '13:30', 'OT-000204 · Montantes', 'esperando material'],
          ['ok', '16:00', 'Salida de la cuadrilla', '8,9 h por persona'],
        ]) },
      { id: 'plazo', etq: 'Día 54', marca: 'Día 54 · Plazo', h2: 'Avisa antes <em>de que sea tarde.</em>',
        bajada: 'Con los días transcurridos, el sistema calcula cuánto avance debería haber. <strong>Si el real queda atrás, la obra aparece como plazo en riesgo</strong> en el tablero de gerencia.',
        libro: ['Avance esperado contra avance real.', 'Obras en riesgo, emergencias y compras atrasadas en un tablero.', 'Alertas, no sorpresas.'],
        obj: medidor({ titulo: 'Escuela N° 7 · día 54 de 90', barras: [['Avance esperado · 60 %', '60%', 'esperado'], ['Avance real · 38 %', '38%', 'real']], nota: '<b style="color:var(--ambar)">Plazo en riesgo:</b> 22 puntos atrás. Aparece en el tablero de gerencia.' }) },
      { id: 'certificacion', etq: 'Día 90', marca: 'Día 90 · Certificación', h2: 'Certificada <em>y en seguimiento.</em>',
        bajada: 'Los certificados de avance salen desde la orden de compra, con firmas y sin pasarse del contrato. El tablero de cobro por ciclo muestra en qué está cada obra; <strong>"observado" siempre lleva motivo.</strong>',
        libro: ['Certificados con cadena de firmas. <a href="/certificados-de-obra/">Ver certificados →</a>', 'Cerrar el ciclo pasa lo pendiente al siguiente.', 'DH1 certifica y controla; no factura.'],
        obj: ficha({ etq: 'Cobro · ciclo de octubre', titulo: 'Comuna 8A', filas: [['Escuela N° 7 · sanitarios', 'certificada 100 %'], ['Jardín 904 · cubierta', 'presentada'], ['Escuela N° 12 · gas', 'observada · falta plano'], ['Escuela N° 3 · eléctrica', 'en curso → noviembre']], pie: 'Hoja por comuna lista para imprimir', sello: 'CICLO CERRADO', tinta: 'verde', gira: 'd' }) },
    ],
    faq: [
      ['¿DH1 sirve para una constructora chica?', 'Sí. Está pensado para empresas que operan varias obras a la vez con equipos reducidos. La implementación arranca por los módulos que más impacto tienen en tu operación y se suman los demás después.'],
      ['¿Se puede usar desde el celular en la obra?', 'Sí. DH1 es web y funciona en celulares y tablets, así que capataces y encargados cargan avances, movimientos de materiales y órdenes de trabajo desde el lugar.'],
      ['¿Cuánto tarda la implementación?', 'Días, no meses. El proceso tiene cuatro etapas: diagnóstico, configuración según tu operación, capacitación por rol y puesta en marcha asistida durante la primera quincena.'],
      ['¿Cuánto cuesta?', 'Depende de los módulos y la cantidad de usuarios. Pedí una demo y armamos una propuesta para tu caso.'],
    ],
    demoEtq: 'Día 91',
  },
];

// ------------------------------------------------------------ armado
function pagina(p) {
  const url = `${SITIO}/${p.ruta}/`;
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': `${url}#pagina`, url, name: p.titulo, description: p.desc, inLanguage: 'es-AR', isPartOf: { '@id': `${SITIO}/#web` }, publisher: { '@id': `${SITIO}/#org` } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITIO}/` },
        { '@type': 'ListItem', position: 2, name: p.miga, item: url },
      ] },
      { '@type': 'FAQPage', mainEntity: p.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    ],
  };
  const nav = capas
    .replace(`<li><a href="/${p.ruta}/">`, `<li><a href="/${p.ruta}/" aria-current="page">`)
    .replace('href="#manana" class="pedir"', 'href="#demo" class="pedir"');
  const todos = [{ id: 'inicio', etq: p.portada.etq, nombre: 'Empieza' }, ...p.caps.map((c) => ({ id: c.id, etq: c.etq, nombre: c.marca.split('·')[1].trim() })), { id: 'demo', etq: p.demoEtq, nombre: 'Demo' }];
  const otras = PAGINAS.filter((o) => o.ruta !== p.ruta).map((o) => `<a href="/${o.ruta}/">${o.nav} →</a>`).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(p.titulo)}</title>
<meta name="description" content="${esc(p.desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#0a0e1a">
<meta name="color-scheme" content="dark">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="DH1 Software">
<meta property="og:locale" content="es_AR">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(p.titulo)}">
<meta property="og:description" content="${esc(p.desc)}">
<meta property="og:image" content="${SITIO}/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(p.titulo)}">
<meta name="twitter:description" content="${esc(p.desc)}">
<meta name="twitter:image" content="${SITIO}/og-image.png">
<script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
</script>
${fuentes}
<link rel="stylesheet" href="/assets/dia.css">
</head>
<body>
<!-- Generado por herramientas/armar-paginas.cjs a partir de index.html. Editá el script, no este archivo. -->
${nav}

<aside class="riel" aria-label="${esc(p.escala)}">
  <div class="hora etq" id="hora" aria-live="off">${p.portada.etq}</div>
  <div class="dia">${p.escala}</div>
  <ol id="indice">
${todos.map((t) => `    <li><a href="#${t.id}"><b>${t.etq}</b>${t.nombre}</a></li>`).join('\n')}
    <li class="avance" aria-hidden="true"></li>
  </ol>
</aside>

<main>
  <section class="cap portada modulo" id="inicio" data-etq="${p.portada.etq}">
    <div class="texto">
      <nav class="miga aparece" aria-label="Estás en"><a href="/">Inicio</a><span>/</span><span>${p.miga}</span></nav>
      <div class="reloj-gigante aparece" aria-hidden="true">${p.portada.grande}</div>
      <h1 class="aparece">${p.portada.h1}</h1>
      <p class="bajada aparece">${p.portada.bajada}</p>
      <div class="botones aparece">
        <a href="#${p.caps[0].id}" class="btn prim">Empezar <span class="bajar">↓</span></a>
        <a href="#demo" class="btn sec">Pedir una demo</a>
      </div>
      <p class="nota aparece">${p.portada.nota}</p>
    </div>
  </section>
${p.caps.map((c) => `
  <section class="cap" id="${c.id}" data-etq="${c.etq}">
    <div class="texto aparece">
      <div class="marca-hora">${c.marca}</div>
      <h2>${c.h2}</h2>
      <p class="bajada">${c.bajada}</p>
      <ul class="libro">
${c.libro.map((l) => `        <li>${l}</li>`).join('\n')}
      </ul>
    </div>
    <div class="objeto aparece">${c.obj}
    </div>
  </section>`).join('\n')}

  <section class="preguntas" id="preguntas" aria-labelledby="tit-preguntas">
    <div class="marca-hora aparece" style="font:13px var(--mono);letter-spacing:.1em;color:var(--ambar);margin-bottom:18px">Preguntas</div>
    <h2 id="tit-preguntas" class="aparece">Lo que nos <em>preguntan.</em></h2>
    <div class="lista">
${p.faq.map(([q, a], k) => `      <details class="hoja aparece"${k === 0 ? ' open' : ''}><summary>${q}</summary><p>${a}</p></details>`).join('\n')}
    </div>
  </section>

  <section class="cap final" id="demo" data-etq="${p.demoEtq}">
    <div class="texto aparece">
      <div class="marca-hora">${p.demoEtq} · Demo</div>
      <h2>Mostranos <em>tu caso.</em></h2>
      <p class="bajada">Te mostramos DH1 con algo parecido a lo tuyo: tus lugares, tus equipos, tus obras. <strong>Sin compromiso y en una llamada.</strong></p>
      <ul class="libro">
        <li>Web y teléfono. Funciona sin señal en el campo.</li>
        <li>Cada empresa ve solo lo suyo: lo garantiza la base de datos.</li>
        <li><a href="/">Ver un día de obra completo →</a></li>
      </ul>
      <div class="otras">${otras}</div>
    </div>
    <div class="objeto aparece">
      <div class="hoja form">
        <span class="cinta" aria-hidden="true"></span>
        <h3>Pedir una demo</h3>
        <p>Te escribimos en el día.</p>
        ${form.replace('Solicitud de demo — DH1 Software', `Solicitud de demo — ${sinEtiquetas(p.miga)} — DH1 Software`)}
      </div>
    </div>
  </section>
</main>

${pie}

<script src="/assets/demo-form.js" defer></script>
<script src="/assets/dia.js" defer></script>
</body>
</html>
`;
}

for (const p of PAGINAS) {
  const dir = path.join(raiz, p.ruta);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), pagina(p));
  console.log(`✓ /${p.ruta}/`);
}
module.exports = { PAGINAS };
