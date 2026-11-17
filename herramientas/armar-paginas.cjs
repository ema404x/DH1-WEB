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
    escala: 'Ciclo de una orden',
    portada: {
      etq: 'Min 0', grande: 'Min<span> </span>0',
      h1: 'Órdenes de trabajo digitales, <em>del reporte al cierre firmado.</em>',
      bajada: 'Cada orden se origina en una emergencia, una inspección, un mantenimiento programado o un pedido de la oficina. Se asigna, se ejecuta en el lugar y se cierra con evidencia fotográfica y firma de conformidad. <strong>Este es el ciclo completo de una orden en DH1.</strong>',
      nota: 'Desplazate para avanzar: el indicador de la izquierda muestra cada etapa del ciclo.',
    },
    caps: [
      { id: 'nace', etq: 'Min 0', marca: 'Min 0 · Origen', h2: 'Cuatro orígenes, <em>un mismo registro.</em>',
        bajada: 'Una emergencia reportada desde el QR del establecimiento, un hallazgo de inspección, una rutina que vence o una carga manual desde la oficina. <strong>Cada orden ingresa con su ubicación, su equipo y su prioridad.</strong>',
        libro: ['La emergencia y su orden urgente se generan en el mismo instante.', 'El mantenimiento preventivo genera órdenes automáticamente, sin duplicados.', 'Los informes de inspección proponen órdenes que un responsable confirma.'],
        obj: avisos([
          ['QR · Escuela N° 12', '09:41', 'Emergencia: pérdida de gas', 'Reportada por el responsable del lugar. Orden urgente creada.'],
          ['Preventivo', '06:00', 'Vence: caldera Escuela 21', 'La rutina mensual generó su orden. Una sola por lugar.'],
          ['Inspección', 'ayer', 'Tablero sin tapa en aula 3', 'El informe propuso una orden. La confirmó la coordinación.'],
          ['Oficina', '08:15', 'Cambio de luminarias', 'Cargada a mano, con el equipo y la foto del pedido.'],
        ]) },
      { id: 'asignada', etq: 'Min 4', marca: 'Min 4 · Asignación', h2: 'Asignación inmediata <em>al responsable.</em>',
        bajada: 'La orden se asigna a un operario o a una cuadrilla y llega de inmediato a su teléfono. <strong>Al escanear el QR del establecimiento, el operario ve las órdenes pendientes en ese lugar.</strong>',
        libro: ['Cada operario accede solo a sus órdenes; cada empresa, solo a su información.', 'La prioridad define el orden de trabajo en el teléfono.', 'Las urgencias se notifican al instante a gerencia y al jefe de sitio.'],
        obj: ficha({ etq: 'Orden de trabajo', titulo: 'OT-000175 · Bomba cisterna sin presión', filas: [['Lugar', 'Hospital Sur'], ['Equipo', 'Bomba cisterna 2'], ['Prioridad', 'Alta'], ['Asignada a', 'Cuadrilla 3 · J. Ruiz'], ['Creada', '13:12'], ['Asignada', '13:16']], sello: 'ASIGNADA', tinta: 'azul' }) },
      { id: 'en-curso', etq: 'Hora 1', marca: 'Hora 1 · Ejecución', h2: 'Ejecución en el lugar, <em>desde el teléfono.</em>',
        bajada: 'El operario escanea el QR, abre la orden y completa el checklist. Las fotos se comprimen en el dispositivo antes de enviarse. <strong>Sin cobertura, el trabajo continúa con normalidad.</strong>',
        libro: ['Checklist y notas se guardan en el dispositivo con cada cambio.', 'Fotos comprimidas y enviadas en secuencia, sin sobrecargar el teléfono.', 'Sincronización automática al recuperar la conexión. <a href="/trabajo-sin-senal/">Operación sin conexión →</a>'],
        obj: linea([
          ['ok', '14:02', 'Escaneó el QR del lugar', 'Hospital Sur · a 6 m'],
          ['ok', '14:03', 'Empezó la orden', 'Pasa a "en curso" para todos'],
          ['ok', '14:20', 'Checklist 2 de 4', 'Guardado en el teléfono'],
          ['ya', '14:31', 'Sin señal en la sala de bombas', '3 cambios esperando en el teléfono'],
          ['ok', '14:48', 'Volvió la señal', 'Enviado en orden, sin duplicar'],
        ]) },
      { id: 'cierre', etq: 'Hora 3', marca: 'Hora 3 · Cierre', h2: 'Cierre con evidencia <em>completa.</em>',
        bajada: 'La orden no puede cerrarse sin el checklist completo o la justificación de lo pendiente, ni sin las fotos requeridas. <strong>El responsable del establecimiento firma la conformidad en pantalla</strong> y el sistema registra la ubicación y la hora del cierre.',
        libro: ['Firmá en el recuadro con el mouse o el dedo.', 'La ubicación del cierre la registra el sistema, no el operario.', 'Los faltantes de material se informan al pañol.'],
        obj: objeto('cierre') },
      { id: 'validada', etq: 'Día 2', marca: 'Día 2 · Validación', h2: 'Historial técnico <em>actualizado.</em>',
        bajada: 'El jefe de sitio aprueba la orden o la devuelve con observaciones. Una vez aprobada, se emite en PDF con fotos y firma y <strong>se incorpora automáticamente al historial del equipo,</strong> disponible para cualquiera que escanee su QR.',
        libro: ['Historial generado por el sistema, sin carga manual.', 'Las devoluciones requieren motivo y llegan al teléfono del operario.', 'Registro de auditoría: quién, qué y cuándo.'],
        obj: ficha({ etq: 'Historial · Bomba cisterna 2', titulo: 'Hospital Sur, sala de bombas', filas: [['OT-000175 · Sello mecánico', 'hoy'], ['OT-000131 · Preventivo trimestral', 'hace 41 días'], ['OT-000098 · Presostato', 'hace 3 meses'], ['Movida desde el pañol', 'hace 8 meses'], ['Alta con QR', 'hace 1 año']], sello: 'APROBADA · PDF', tinta: 'verde', gira: 'd' }) },
    ],
    faq: [
      ['¿Qué es una orden de trabajo digital?', 'Es la versión digital de la OT en papel: un registro de qué hay que hacer, quién lo hace, dónde y cuándo, que se completa desde el celular y queda guardado con firma, fotos y ubicación.'],
      ['¿La firma digital tiene validez?', 'La firma en pantalla funciona como constancia de conformidad del trabajo realizado dentro de tu operación. Para usos con requisitos legales específicos, consultá con tu asesor.'],
      ['¿Hace falta instalar algo?', 'No. Las órdenes se abren desde el navegador del teléfono o la tablet, y DH1 puede agregarse a la pantalla de inicio como una aplicación.'],
      ['¿Puedo ver el historial de órdenes de un equipo?', 'Sí. Cada OT queda vinculada a su obra o equipo, así que ves todas las intervenciones anteriores en un solo lugar.'],
      ['¿Qué pasa si en el lugar no hay señal?', 'El operario continúa trabajando: los cambios se guardan en el dispositivo y se sincronizan al recuperar la conexión, en orden y sin duplicados.'],
    ],
    demoEtq: 'Siguiente paso',
  },
  {
    ruta: 'software-mantenimiento-preventivo',
    nav: 'Mantenimiento',
    titulo: 'Software de mantenimiento preventivo (CMMS) | DH1 Software',
    desc: 'Software de mantenimiento preventivo y correctivo: planes recurrentes por equipo, alertas de vencimiento, órdenes de trabajo con firma digital y GPS, e historial completo por activo.',
    miga: 'Mantenimiento preventivo',
    escala: 'Ciclo anual de un equipo',
    portada: {
      etq: 'Enero', grande: 'Enero',
      h1: 'Mantenimiento preventivo <em>sin vencimientos olvidados.</em>',
      bajada: 'Cada equipo se registra con su código QR y su plan de mantenimiento. A partir de ahí, el sistema genera las órdenes en cada vencimiento, respeta las temporadas y documenta cada intervención. <strong>Este es el ciclo anual de una caldera en DH1.</strong>',
      nota: 'Desplazate para avanzar: el indicador de la izquierda recorre los meses del año.',
    },
    caps: [
      { id: 'alta', etq: 'Enero', marca: 'Enero · Alta', h2: 'Alta del equipo <em>con QR y plan.</em>',
        bajada: 'La caldera se registra con su ubicación, sus datos técnicos y su documentación, y se identifica con un código QR. <strong>Su plan define la frecuencia de mantenimiento y los meses en que aplica.</strong>',
        libro: ['Un formato de QR único para establecimientos y equipos.', 'Manuales, planos y garantías en la ficha del equipo.', 'Códigos QR de todos los equipos en un PDF listo para imprimir.'],
        obj: ficha({ etq: 'Equipo · alta', titulo: 'Caldera · Escuela N° 21', filas: [['Ubicación', 'Sala de máquinas'], ['Rutina', 'Mantenimiento de caldera'], ['Frecuencia', 'Mensual'], ['Temporada', 'Abril a septiembre'], ['Próxima', '1 de abril'], ['QR', 'Impreso y pegado']], sello: 'ALTA', tinta: 'azul' }) },
      { id: 'preventivo', etq: 'Abril', marca: 'Abril · Vencimiento', h2: 'Órdenes preventivas <em>generadas automáticamente.</em>',
        bajada: 'Los vencimientos próximos se convierten en órdenes de trabajo asignadas y disponibles en el teléfono de la cuadrilla. <strong>Una única orden abierta por plan y establecimiento,</strong> sin duplicados.',
        libro: ['La próxima fecha se recalcula automáticamente.', 'Calendario mensual de vencimientos.', 'Alertas de tareas vencidas en el tablero.'],
        obj: objeto('preventivo') },
      { id: 'correctiva', etq: 'Julio', marca: 'Julio · Falla', h2: 'Correctivo y preventivo <em>en el mismo historial.</em>',
        bajada: 'Ante una falla, el responsable del establecimiento la reporta desde el QR, sin necesidad de usuario. Se genera la emergencia con su orden urgente y <strong>al resolverse, la orden se cierra automáticamente.</strong> Ambas intervenciones quedan en el historial del equipo.',
        libro: ['Emergencia y orden urgente se generan en el mismo instante.', 'Las fallas reiteradas en un mismo lugar se señalan en el tablero.', 'Notificación inmediata al jefe de sitio.'],
        obj: avisos([
          ['QR · Escuela N° 21', '07:52', 'La caldera no enciende', 'Reportado desde el portal, sin usuario.'],
          ['DH1', '07:52', 'Orden urgente OT-000188', 'Asignada a la cuadrilla de calefacción.'],
          ['Cuadrilla 2', '09:30', 'Resuelto: termocupla cambiada', 'Fotos y firma del responsable.'],
          ['DH1', '09:31', 'Emergencia cerrada', 'Sumada al historial de la caldera.'],
        ]) },
      { id: 'temporada', etq: 'Octubre', marca: 'Octubre · Temporada', h2: 'Planes estacionales, <em>sin órdenes innecesarias.</em>',
        bajada: 'Fuera de temporada, el plan queda en espera hasta el siguiente mes habilitado. <strong>No se generan órdenes que no corresponden</strong> ni se reprograma automáticamente sin criterio.',
        libro: ['Planes por establecimiento, con su ciclo y sus meses.', 'Las tareas no realizadas quedan pendientes.', 'Relevamientos de calefacción por período.'],
        obj: linea([
          ['ok', 'Abril', 'Preventiva generada y cerrada', 'OT-000142'],
          ['ok', 'Mayo', 'Preventiva generada y cerrada', 'OT-000157'],
          ['ok', 'Junio', 'Preventiva generada y cerrada', 'OT-000169'],
          ['no', 'Julio', 'Correctiva urgente', 'OT-000188 · termocupla'],
          ['ok', 'Agosto · Septiembre', 'Preventivas cerradas', 'OT-000196 · OT-000214'],
          ['ya', 'Octubre', 'Fuera de temporada', 'Espera hasta abril'],
        ]) },
      { id: 'expediente', etq: 'Diciembre', marca: 'Diciembre · Expediente', h2: 'Expediente técnico <em>completo.</em>',
        bajada: 'Cada orden cerrada, cada cambio de estado y cada movimiento quedan en el historial del equipo, <strong>registrados por el sistema y no a mano.</strong> Toda la información está disponible al escanear su QR.',
        libro: ['Historial automático por equipo.', 'Documentos y fotos centralizados.', 'Informes listos para presentar.'],
        obj: ficha({ etq: 'Expediente · Caldera Escuela N° 21', titulo: 'Este año', filas: [['Preventivas hechas', '6 de 6'], ['Correctivas', '1'], ['Horas de trabajo', '23 h'], ['Fotos', '41'], ['Documentos', '3'], ['Próxima', '1 de abril']], sello: 'AL DÍA', tinta: 'verde', gira: 'd' }) },
    ],
    faq: [
      ['¿Qué diferencia hay entre mantenimiento preventivo y correctivo?', 'El preventivo se planifica con anticipación (inspecciones, cambios de filtros, calibraciones) para evitar fallas. El correctivo se hace cuando el equipo ya falló. DH1 maneja los dos y guarda ambos en el historial del activo.'],
      ['¿Sirve para edificios, hospitales o plantas industriales?', 'Sí. DH1 se usa para mantenimiento industrial y de edificios: equipos, instalaciones y servicios con planes recurrentes y órdenes de trabajo.'],
      ['¿Los técnicos necesitan una aplicación aparte?', 'No. DH1 funciona desde el navegador del teléfono o la tablet: el técnico abre la orden, la ejecuta y la cierra desde allí.'],
      ['¿Se puede migrar el plan que hoy está en Excel?', 'Sí. Durante la configuración se importan el inventario de equipos y los planes actuales, para comenzar con la información existente.'],
    ],
    demoEtq: 'Próximo ciclo',
  },
  {
    ruta: 'certificados-de-obra',
    nav: 'Certificados',
    nuevo: true,
    titulo: 'Certificados de obra con cadena de firmas | DH1 Software',
    desc: 'Certificados de avance de obra armados desde la orden de compra: la base calcula lo anterior y lo acumulado, no deja certificar de más, pasa por la cadena de firmas y recién al final toma número.',
    miga: 'Certificados de obra',
    escala: 'Ciclo mensual de certificación',
    portada: {
      etq: 'Día 1', grande: 'Día<span> </span>1',
      h1: 'Certificación de obra <em>con control en cada paso.</em>',
      bajada: 'El certificado se genera a partir de la orden de compra, se mide el avance del período y recorre la cadena de firmas. <strong>El sistema calcula los acumulados y aplica los límites:</strong> no se certifica en exceso, no se modifica lo emitido y nadie aprueba lo propio.',
      nota: 'Desplazate para avanzar: el indicador de la izquierda recorre los días del mes.',
    },
    caps: [
      { id: 'contrato', etq: 'Día 1', marca: 'Día 1 · Contrato', h2: 'Lectura automática <em>de la orden de compra.</em>',
        bajada: 'Al cargar el PDF, la inteligencia artificial propone los ítems con cantidades y precios. El sistema verifica la suma contra el total del documento y señala los renglones que parecen subtotales. <strong>La IA propone; un responsable revisa y confirma.</strong>',
        libro: ['Verificación de la suma contra el total del documento.', 'Corrección asistida cuando los importes no coinciden.', 'El PDF original queda adjunto al contrato.'],
        obj: ficha({ etq: 'Orden de compra · leída del PDF', titulo: 'Termografía anual · Comuna 8B', filas: [['1 · Relevamiento', '$ 480.000'], ['2 · Termografía tableros', '$ 900.000'], ['3 · Informe final', '$ 420.000'], ['Suma de ítems', '$ 1.800.000'], ['Total del documento', '$ 1.800.000']], pie: 'Diferencia 0,0 % · tolerancia 0,5 %', sello: 'CIERRA', tinta: 'verde' }) },
      { id: 'medicion', etq: 'Día 12', marca: 'Día 12 · Medición', h2: 'Acumulados calculados <em>por el sistema.</em>',
        bajada: 'Solo se carga el avance del período. Los valores anteriores y acumulados se calculan a partir de lo ya certificado en cada ítem. <strong>Cualquier intento de superar el 100 % es rechazado por la base de datos,</strong> por ítem y por total.',
        libro: ['Cada ítem del contrato tiene identificación propia.', 'Un único borrador por contrato.', 'Los certificados emitidos no pueden modificarse.'],
        obj: medidor({ titulo: 'Ítem 2 · Termografía tableros', barras: [['Ya certificado: 75 %', '75%', 'real'], ['Intento del mes: +40 %', '100%', 'esperado']], nota: '<b style="color:var(--rojo)">Rechazado por la base:</b> llegaría al 115 %. Máximo posible este mes: 25 %.' }) },
      { id: 'certificado', etq: 'Día 25', marca: 'Día 25 · Firmas', h2: 'Cadena de firmas <em>y numeración al final.</em>',
        bajada: 'El certificado queda bloqueado y recorre las firmas en orden. Cada firmante revisa un checklist antes de aprobar; un rechazo requiere motivo y devuelve el documento a borrador. <strong>La numeración se asigna con la última firma,</strong> evitando números salteados.',
        libro: ['Cada firmante interviene solo en su turno.', 'Cada envío conforma una ronda con su historial.', 'Mientras está en firmas, el contrato no admite otro certificado.'],
        obj: objeto('certificado') },
      { id: 'aprobado', etq: 'Día 28', marca: 'Día 28 · Aprobación', h2: 'Aprobación independiente <em>y auditada.</em>',
        bajada: 'Quien emitió el certificado o firmó en la cadena no puede aprobarlo. Una vez aprobado, se emite en PDF con todas las firmas y <strong>el registro de auditoría documenta quién intervino y cuándo.</strong>',
        libro: ['Los rechazos requieren motivo y vuelven a borrador.', 'PDF con todas las firmas de la cadena y de gerencia.', 'Auditoría de firmas por certificado.'],
        obj: linea([
          ['ok', 'Día 24 · 17:02', 'Enviado a firmas', 'M. Gómez · ronda 1'],
          ['ok', 'Día 25 · 09:15', 'Firmó jefe de sitio', 'Checklist 6 de 6'],
          ['no', 'Día 25 · 11:40', 'Rechazó inspección', '"Falta el informe del ítem 3"'],
          ['ok', 'Día 26 · 10:05', 'Reenviado · ronda 2', 'Con el informe adjunto'],
          ['ok', 'Día 27 · 16:20', 'Última firma: N° 47', 'Emitido'],
          ['ok', 'Día 28 · 12:00', 'Aprobado por gerencia', 'Aprobación independiente'],
        ]) },
      { id: 'abonos', etq: 'Día 30', marca: 'Día 30 · Abonos', h2: 'Generación masiva <em>de abonos mensuales.</em>',
        bajada: 'Los contratos de abono vigentes certifican la cuota del mes en una sola operación: el total dividido por los meses de vigencia, y <strong>el último mes completa el saldo.</strong> Ningún período se certifica dos veces.',
        libro: ['Procesamiento independiente por contrato.', 'Solicitudes de certificado con circuito propio.', 'DH1 certifica y controla; la facturación queda en tu sistema contable.'],
        obj: ficha({ etq: 'Abonos del mes · octubre', titulo: 'Certificados generados', filas: [['Limpieza de campanas · 8A', '1/12 · N° 48'], ['Mantenimiento ascensores · 10B', '7/12 · N° 49'], ['Termomecánica · 8B', '12/12 · saldo · N° 50'], ['Desinfección · 10A', 'ya certificado'], ['Matafuegos · 8A', '3/6 · N° 51']], pie: '4 nuevos · 1 salteado porque ya estaba', sello: 'SIN REPETIDOS', tinta: 'verde', gira: 'd' }) },
    ],
    faq: [
      ['¿DH1 factura o cobra?', 'No. DH1 certifica el avance y controla la certificación. La facturación y el cobro los hace tu sistema contable.'],
      ['¿Se puede certificar más de lo que dice el contrato?', 'No. La base de datos rechaza cualquier certificado que pase el 100 % de un ítem o del total del contrato.'],
      ['¿Hay que cargar los ítems a mano?', 'No es necesario: al subir el PDF de la orden de compra, la IA propone los ítems y el sistema verifica que la suma coincida con el total. Un responsable revisa antes de guardar.'],
      ['¿Qué pasa si alguien de la cadena rechaza?', 'Debe indicar el motivo. El certificado vuelve a borrador, se corrige y se reenvía como una nueva ronda; la anterior queda registrada.'],
      ['¿Quién aprueba el certificado?', 'Una persona distinta de quien lo emitió y de quienes firmaron en la cadena.'],
    ],
    demoEtq: 'Próximo período',
  },
  {
    ruta: 'trabajo-sin-senal',
    nav: 'Operación sin conexión',
    nuevo: true,
    titulo: 'Órdenes de trabajo sin señal: trabajo de campo offline | DH1 Software',
    desc: 'Los operarios trabajan las órdenes sin señal: checklist, fotos y cierre quedan guardados en el teléfono y se envían solos cuando vuelve la conexión, en orden y sin duplicar.',
    miga: 'Operación sin conexión',
    escala: 'Intervención sin conexión',
    portada: {
      etq: 'Min 0', grande: 'Min<span> </span>0',
      h1: 'Operación de campo <em>sin depender de la señal.</em>',
      bajada: 'Salas de bombas, subsuelos y salas de máquinas suelen ser los lugares con menos cobertura. <strong>Con DH1, el operario no depende de la red:</strong> ejecuta y cierra la orden, y la información se sincroniza cuando el dispositivo recupera la conexión.',
      nota: 'Desplazate para avanzar: el indicador de la izquierda muestra el tiempo de la intervención.',
    },
    caps: [
      { id: 'antes', etq: 'Min 0', marca: 'Min 0 · Preparación', h2: 'Órdenes disponibles <em>en el dispositivo.</em>',
        bajada: 'Las órdenes asignadas quedan almacenadas en el teléfono del operario. <strong>Al escanear un QR sin conexión, el sistema busca primero entre las órdenes guardadas,</strong> de modo que se abren igual.',
        libro: ['Cada usuario accede y sincroniza solo su información.', 'Se agrega a la pantalla de inicio como una aplicación.', 'Sin instalación desde tiendas de aplicaciones.'],
        obj: ficha({ etq: 'En el teléfono · sin señal', titulo: 'Mis órdenes de hoy', filas: [['OT-000174 · Bomba cisterna', 'Hospital Sur'], ['OT-000176 · Tablero TS-2', 'Hospital Sur'], ['OT-000181 · Luminarias', 'Escuela N° 3']], pie: 'Guardadas en el teléfono · 10:19', sello: 'LISTAS', tinta: 'azul' }) },
      { id: 'sotano', etq: 'Min 8', marca: 'Min 8 · Sin conexión', h2: 'Probalo: <em>desactivá la señal.</em>',
        bajada: 'Desactivá la señal del teléfono de la demostración y marcá tareas: quedan pendientes de sincronizar. Al reactivarla, se envían automáticamente. <strong>Así funciona en un dispositivo real.</strong>',
        libro: ['Checklist y notas se guardan con cada cambio.', 'Cerrar la aplicación no implica pérdida de datos.', 'Al salir con cambios pendientes, el sistema avisa y los conserva.'],
        obj: objeto('sotano') },
      { id: 'fotos', etq: 'Min 20', marca: 'Min 20 · Fotos', h2: 'Imágenes optimizadas <em>en el dispositivo.</em>',
        bajada: 'Cada foto se comprime en el teléfono antes de guardarse (1600 px, calidad suficiente para documentar una orden). <strong>Las imágenes se envían en secuencia,</strong> lo que permite operar con teléfonos de gama baja y datos móviles.',
        libro: ['Compresión de imágenes en el dispositivo.', 'Envío ordenado al recuperar la conexión.', 'Si la orden exige fotos, no puede cerrarse sin ellas.'],
        obj: medidor({ titulo: 'Una foto de la sala de bombas', barras: [['Como sale de la cámara · 4,8 MB', '100%', 'esperado'], ['Como se guarda · 0,4 MB', '9%', 'real']], nota: 'Doce veces más liviana, con la misma legibilidad.' }) },
      { id: 'vuelve', etq: 'Min 45', marca: 'Min 45 · Sincronización', h2: 'Sincronización completa, <em>sin duplicados.</em>',
        bajada: 'Al recuperar la conexión, los cambios pendientes se envían <strong>en el mismo orden en que se realizaron,</strong> sin duplicados. Si la base de datos rechaza alguno, no se pierde: queda guardado con el motivo del rechazo.',
        libro: ['Sincronización al recuperar la señal y al reabrir la aplicación.', 'La base de datos mantiene el control de las reglas.', 'Las aprobaciones y devoluciones requieren conexión, por diseño.'],
        obj: linea([
          ['ok', '11:05:02', 'Tarea 1 marcada', 'enviada'],
          ['ok', '11:05:03', 'Tarea 2 marcada', 'enviada'],
          ['ok', '11:05:03', 'Nota: "sello gastado"', 'enviada'],
          ['ok', '11:05:06', 'Foto 1 de 2', 'subida'],
          ['ok', '11:05:09', 'Foto 2 de 2', 'subida'],
          ['ok', '11:05:10', 'Orden cerrada con firma', 'enviada · sin duplicados'],
        ]) },
      { id: 'portal', etq: 'Sin usuario', marca: 'Además · Portal por QR', h2: 'También disponible <em>sin usuario.</em>',
        bajada: 'La tablet de la cuadrilla o cualquier teléfono accede al portal de operarios escaneando el QR del establecimiento, sin crear cuentas. <strong>El portal también conserva y sincroniza lo realizado sin conexión.</strong>',
        libro: ['Un único QR por establecimiento.', 'Acceso al portal protegido con una clave administrada por la empresa.', 'Las emergencias reportadas desde el QR generan su orden urgente.'],
        obj: avisos([
          ['Portal · Escuela N° 3', '15:10', 'Tablet de cuadrilla', 'Entró por el QR del lugar. Sin usuario.'],
          ['Portal', '15:12', 'Sin señal', 'Cierre de OT-000181 guardado en la tablet.'],
          ['Portal', '15:40', 'Enviado', 'Llegó a la base cuando volvió la señal.'],
        ]) },
    ],
    faq: [
      ['¿Hace falta instalar una aplicación?', 'No desde una tienda. DH1 se abre en el navegador del teléfono y puede agregarse a la pantalla de inicio para usarlo como una aplicación.'],
      ['¿Qué pasa si se cierra la aplicación sin señal?', 'No se pierde nada: los cambios quedan guardados en el teléfono y se envían la próxima vez que se abra la aplicación con conexión.'],
      ['¿La sincronización es automática aunque la aplicación esté cerrada?', 'Con la aplicación abierta, sí: apenas vuelve la señal. Con la aplicación cerrada, los teléfonos no garantizan el envío en segundo plano (iPhone no lo permite y en Android no es confiable), por eso se sincroniza al volver a abrirla.'],
      ['¿Se puede duplicar una orden o una foto?', 'No. Cada cambio se envía una sola vez, en el orden en que se hizo.'],
      ['¿Qué pasa si la base rechaza un cambio hecho sin señal?', 'No se pierde: queda guardado en el teléfono con el motivo del rechazo, para corregirlo o descartarlo.'],
    ],
    demoEtq: 'Conectado',
  },
  {
    ruta: 'erp-constructoras',
    nav: 'Obras',
    titulo: 'Gestión de obras de mantenimiento | DH1 Software',
    desc: 'Software de gestión de obras de mantenimiento: obras con jefe de sitio, inspector y plazo, alerta de atraso, presupuestos, proveedores, pañol con QR del depósito a la obra, cuadrillas y certificación. Desarrollado en Argentina.',
    miga: 'Gestión de obras de mantenimiento',
    escala: 'Obra de 90 días',
    portada: {
      etq: 'Día 1', grande: 'Día<span> </span>1',
      h1: 'Gestión integral de obras <em>de mantenimiento.</em>',
      bajada: 'Cada obra se registra con su jefe de sitio, su inspector y su plazo. Sobre esa base se gestionan presupuestos, materiales, cuadrillas, órdenes de trabajo y certificados. <strong>Este es el recorrido de una obra de mantenimiento de 90 días en DH1.</strong>',
      nota: 'Desplazate para avanzar: el indicador de la izquierda recorre los días de obra.',
    },
    caps: [
      { id: 'alta', etq: 'Día 1', marca: 'Día 1 · Alta', h2: 'Alta de obra <em>con responsables definidos.</em>',
        bajada: 'Comuna, jefe de sitio, inspector, plazo y documentación, cada dato en su lugar. <strong>Las obras existentes se importan desde planillas:</strong> una nueva importación actualiza sin duplicar ni borrar datos.',
        libro: ['Jefe de sitio e inspector vinculados como usuarios del sistema.', 'Documentación de obra en almacenamiento privado.', 'Cada empresa accede solo a sus obras.'],
        obj: ficha({ etq: 'Obra · alta', titulo: 'Refacción sanitarios · Escuela N° 7', filas: [['Comuna', '8A'], ['Jefe de sitio', 'J. Ruiz'], ['Inspección', 'L. Díaz'], ['Inicio', '1 de agosto'], ['Plazo', '90 días'], ['Documentos', 'Pliego, planos, ADA']], sello: 'EN OBRA', tinta: 'azul' }) },
      { id: 'presupuestos', etq: 'Día 3', marca: 'Día 3 · Presupuestos', h2: 'Presupuestos <em>con seguimiento de estado.</em>',
        bajada: 'Las planillas de presupuesto se centralizan en un repositorio, con su estado y su obra asociada, y los proveedores en su propio registro. <strong>La versión vigente siempre está identificada.</strong>',
        libro: ['Presupuestos por obra, con estado.', 'Registro de proveedores y requerimientos de compra.', 'Enlaces a archivos con vencimiento automático.'],
        obj: ficha({ etq: 'Presupuestos · Escuela N° 7', titulo: 'Refacción sanitarios', filas: [['Albañilería · v3', 'aprobado'], ['Instalación sanitaria · v2', 'aprobado'], ['Revestimientos · v1', 'en revisión'], ['Adicional rejillas', 'pedido']], pie: 'Proveedores: 6 · requerimientos abiertos: 2', sello: 'AL DÍA', tinta: 'verde', gira: 'd' }) },
      { id: 'panol', etq: 'Día 10', marca: 'Día 10 · Pañol', h2: 'Materiales trazables <em>del depósito a la obra.</em>',
        bajada: 'Cada salida de materiales del pañol queda registrada. Cuando el stock cae por debajo del mínimo, <strong>se genera el requerimiento de compra.</strong> Los préstamos de herramientas se registran con responsable y devolución.',
        libro: ['Inventario identificado con QR.', 'Préstamos de herramientas con control de devolución.', 'Requerimientos de compra con seguimiento.'],
        obj: objeto('panol') },
      { id: 'cuadrillas', etq: 'Día 30', marca: 'Día 30 · Cuadrillas', h2: 'Cuadrillas y horas <em>por orden de trabajo.</em>',
        bajada: 'La cuadrilla registra su asistencia con el QR de la obra; las órdenes de trabajo llegan a sus teléfonos y se cierran con fotos y firma. <strong>Las horas quedan imputadas por orden y por persona.</strong>',
        libro: ['Asistencia por QR o desde la tablet de la cuadrilla.', 'Órdenes vinculadas a la obra.', 'Operación sin conexión en el campo. <a href="/trabajo-sin-senal/">Operación sin conexión →</a>'],
        obj: linea([
          ['ok', '07:02', 'Fichó la cuadrilla 3', '4 personas · QR de la obra'],
          ['ok', '07:40', 'OT-000203 · Demolición revestimiento', 'en curso'],
          ['ok', '12:15', 'OT-000203 cerrada', '6 fotos · firma del director'],
          ['ya', '13:30', 'OT-000204 · Montantes', 'esperando material'],
          ['ok', '16:00', 'Salida de la cuadrilla', '8,9 h por persona'],
        ]) },
      { id: 'plazo', etq: 'Día 54', marca: 'Día 54 · Plazo', h2: 'Alertas tempranas <em>de atraso.</em>',
        bajada: 'A partir de los días transcurridos, el sistema calcula el avance esperado. <strong>Si el avance real queda por debajo, la obra se marca con plazo en riesgo</strong> en el tablero de gerencia.',
        libro: ['Avance esperado frente a avance real.', 'Obras en riesgo, emergencias y compras demoradas en un mismo tablero.', 'Alertas anticipadas para la toma de decisiones.'],
        obj: medidor({ titulo: 'Escuela N° 7 · día 54 de 90', barras: [['Avance esperado · 60 %', '60%', 'esperado'], ['Avance real · 38 %', '38%', 'real']], nota: '<b style="color:var(--ambar)">Plazo en riesgo:</b> 22 puntos atrás. Aparece en el tablero de gerencia.' }) },
      { id: 'certificacion', etq: 'Día 90', marca: 'Día 90 · Certificación', h2: 'Certificación <em>y seguimiento de cobro.</em>',
        bajada: 'Los certificados de avance se generan desde la orden de compra, con cadena de firmas y sin exceder el contrato. El tablero de cobro por ciclo muestra el estado de cada obra; <strong>toda observación requiere motivo.</strong>',
        libro: ['Certificados con cadena de firmas. <a href="/certificados-de-obra/">Certificados de obra →</a>', 'Al cerrar el ciclo, lo pendiente pasa al siguiente.', 'DH1 certifica y controla; la facturación queda en tu sistema contable.'],
        obj: ficha({ etq: 'Cobro · ciclo de octubre', titulo: 'Comuna 8A', filas: [['Escuela N° 7 · sanitarios', 'certificada 100 %'], ['Jardín 904 · cubierta', 'presentada'], ['Escuela N° 12 · gas', 'observada · falta plano'], ['Escuela N° 3 · eléctrica', 'en curso → noviembre']], pie: 'Hoja por comuna lista para imprimir', sello: 'CICLO CERRADO', tinta: 'verde', gira: 'd' }) },
    ],
    faq: [
      ['¿DH1 sirve para una empresa pequeña?', 'Sí. Está pensado para empresas que gestionan varias obras en simultáneo con equipos reducidos. La implementación comienza por los módulos de mayor impacto y luego se incorporan los demás.'],
      ['¿Se puede usar desde el teléfono en la obra?', 'Sí. DH1 funciona en teléfonos y tablets, de modo que capataces y encargados registran avances, movimientos de materiales y órdenes de trabajo desde el lugar.'],
      ['¿Cuánto tarda la implementación?', 'Días, no meses. El proceso tiene cuatro etapas: diagnóstico, configuración según la operación, capacitación por rol y puesta en marcha asistida durante la primera quincena.'],
      ['¿Cuánto cuesta?', 'Depende de los módulos y de la cantidad de usuarios. Solicitá una demostración y preparamos una propuesta para tu caso.'],
    ],
    demoEtq: 'Próxima obra',
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
  const todos = [{ id: 'inicio', etq: p.portada.etq, nombre: 'Inicio' }, ...p.caps.map((c) => ({ id: c.id, etq: c.etq, nombre: c.marca.split('·')[1].trim() })), { id: 'demo', etq: p.demoEtq, nombre: 'Demostración' }];
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
        <a href="#${p.caps[0].id}" class="btn prim">Ver el recorrido <span class="bajar">↓</span></a>
        <a href="#demo" class="btn sec">Solicitar una demostración</a>
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
    <div class="marca-hora aparece" style="font:13px var(--mono);letter-spacing:.1em;color:var(--ambar);margin-bottom:18px">Consultas</div>
    <h2 id="tit-preguntas" class="aparece">Preguntas <em>frecuentes.</em></h2>
    <div class="lista">
${p.faq.map(([q, a], k) => `      <details class="hoja aparece"${k === 0 ? ' open' : ''}><summary>${q}</summary><p>${a}</p></details>`).join('\n')}
    </div>
  </section>

  <section class="cap final" id="demo" data-etq="${p.demoEtq}">
    <div class="texto aparece">
      <div class="marca-hora">${p.demoEtq} · Demostración</div>
      <h2>Conocé DH1 aplicado <em>a tu operación.</em></h2>
      <p class="bajada">Te mostramos la plataforma configurada con un caso similar al tuyo: tus establecimientos, tus equipos y tus obras. <strong>Sin compromiso, en una reunión breve.</strong></p>
      <ul class="libro">
        <li>Web, Android e iOS, con operación de campo sin conexión.</li>
        <li>Información aislada por empresa desde la base de datos.</li>
        <li><a href="/#recorrido">Ver el recorrido de una jornada completa →</a></li>
      </ul>
      <div class="otras">${otras}</div>
    </div>
    <div class="objeto aparece">
      <div class="hoja form">
        <span class="cinta" aria-hidden="true"></span>
        <h3>Solicitar una demostración</h3>
        <p>Respondemos dentro del mismo día hábil.</p>
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
