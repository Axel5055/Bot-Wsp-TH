const { cargarRegistros } = require('../../utils/escudos.utils')
const { cargarActivos, guardarActivos } = require('../../utils/escudo.timer')

// Tipos de escudo válidos y su duración en ms
const TIPOS_ESCUDO = {
  '4h':  4  * 60 * 60 * 1000,
  '8h':  8  * 60 * 60 * 1000,
  '12h': 12 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '3d':  3  * 24 * 60 * 60 * 1000,
  '7d':  7  * 24 * 60 * 60 * 1000,
  '14d': 14 * 24 * 60 * 60 * 1000,
}

function formatearFecha(timestamp) {
  return new Date(timestamp).toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

module.exports = {
  name: 'ponescudo',
  keywords: ['ponescudo'],
  admin: false,
  mensajero: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid
    const jid = msg.key.participant || msg.key.remoteJid
    const texto = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const parametro = texto.replace(/^#\S+\s*/i, '').trim().toLowerCase()

    // Verificar que el usuario esté registrado
    const registros = cargarRegistros()
    const registro = registros.find(r => r.jid === jid)

    if (!registro) {
      return await sock.sendMessage(chatId, {
        text: '❌ No estás registrado en el sistema de escudos.\n\nUsa *#addescudo NombreIngame, NumeroConLada* primero.'
      })
    }

    // Verificar que el tipo de escudo sea válido
    if (!parametro || !TIPOS_ESCUDO[parametro]) {
      const lista = Object.keys(TIPOS_ESCUDO).map(t => `• *${t}*`).join('\n')
      return await sock.sendMessage(chatId, {
        text: `📋 Uso correcto:\n*#ponescudo TipoDeEscudo*\n\nEscudos disponibles:\n${lista}\n\nEjemplo:\n#ponescudo 4h`
      })
    }

    const ahora = Date.now()
    const duracion = TIPOS_ESCUDO[parametro]
    const venceEn = ahora + duracion

    // Guardar o actualizar el escudo activo
    const activos = cargarActivos()
    const indexExistente = activos.findIndex(e => e.jid === jid)

    const nuevoEscudo = {
      jid,
      nombre: registro.nombre,
      numero: registro.numero,
      tipo: parametro,
      puestoEn: ahora,
      venceEn,
      avisado: false
    }

    if (indexExistente !== -1) {
      activos[indexExistente] = nuevoEscudo
    } else {
      activos.push(nuevoEscudo)
    }

    guardarActivos(activos)

    return await sock.sendMessage(chatId, {
      text: `✅ *Escudo registrado correctamente*\n\n` +
            `👤 *Jugador:* ${registro.nombre}\n` +
            `🛡️ *Tipo:* ${parametro}\n` +
            `🕐 *Puesto:* ${formatearFecha(ahora)}\n` +
            `⏰ *Vence:* ${formatearFecha(venceEn)}\n\n` +
            `_Te avisaré 10 minutos antes de que caiga._\n\n🅣🅗 - 🅑🅞🅣`
    })
  }
}