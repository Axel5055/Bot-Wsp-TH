const {
  normalizarClave,
  traduccionesManual,
  capitalizar
} = require('../utils/traducciones');

const {
  enviarAlertaWhatsApp
} = require('../bridges/telegramToWhatsapp');

const config = require('../config/telegram');

/**
 * 🧠 Anti-duplicados y cooldown
 */
let lastTelegramMsgId = null;
const lastAlertByType = {};

/**
 * Extrae texto del mensaje
 */
function extractText(msg) {
  return msg.message || msg.text || msg.caption || '';
}

/**
 * Limpia "x 2"
 */
function limpiarCantidad(str = '') {
  return str.replace(/x\s*\d+/gi, '').trim();
}

/**
 * Limpia bullets
 */
function limpiarLinea(str = '') {
  return str.replace(/^•+/g, '').trim();
}

async function procesarMensajeTelegram({ msg, waSock }) {
  if (msg.id === lastTelegramMsgId) return;
  lastTelegramMsgId = msg.id;

  const texto = extractText(msg);
  if (!texto) return;

  const lineas = texto.split('\n').map(l => l.trim()).filter(Boolean);
  if (!lineas.length) return;

  /* =========================
   * 📌 REQUISITOS
   * ========================= */
  const requisitoLinea = lineas[0].replace(/\([^)]+\)/g, '');
  const partes = requisitoLinea.split('|').map(p => p.trim());

  const requisitoTraducido = partes
    .map(p => {
      const key = normalizarClave(p);
      return traduccionesManual[key] || capitalizar(p);
    })
    .join(' | ');

  /* =========================
   * 🚨 ALERTAS VÁLIDAS
   * ========================= */
  const alertas = [
    { clave: 'watcher', medalla: true },
    { clave: 'chaos_dragon', medalla: true },
    { clave: 'ancient_core', medalla: false },
    { clave: 'bright_talent_orb', medalla: false },
    { clave: 'brilliant_talent_orb', medalla: false }
  ];

  const recompensas = [];

  for (const linea of lineas.slice(1)) {
    const limpia = limpiarCantidad(limpiarLinea(linea));
    const key = normalizarClave(limpia);

    for (const alerta of alertas) {
      if (key.includes(alerta.clave) && traduccionesManual[alerta.clave]) {
        recompensas.push({
          clave: alerta.clave,
          texto: traduccionesManual[alerta.clave],
          medalla: alerta.medalla
        });
      }
    }
  }

  if (!recompensas.length) return;

  /* =========================
   * ⏳ COOLDOWN
   * ========================= */
  const principal =
    recompensas.find(r => r.clave === 'ancient_core') || recompensas[0];

  const now = Date.now();
  if (
    lastAlertByType[principal.clave] &&
    now - lastAlertByType[principal.clave] < 55 * 60 * 1000
  ) {
    return;
  }

  lastAlertByType[principal.clave] = now;

  /* =========================
   * 🎖️ TEXTO FINAL
   * ========================= */
  const recompensaTexto = principal.medalla
    ? `Medalla de ${principal.texto}`
    : [...new Set(recompensas.map(r => r.texto))].join(' | ');

  /* =========================
   * 📤 ENVÍO
   * ========================= */
  await enviarAlertaWhatsApp({
    sock: waSock,
    groupIds: config.whatsapp.groupIds,
    tipoTraducido: principal.texto,
    requisitoTraducido,
    recompensaTexto,
    tipoImagen: principal.clave,
    incluirMedalla: principal.medalla
  });
}

module.exports = { procesarMensajeTelegram };
