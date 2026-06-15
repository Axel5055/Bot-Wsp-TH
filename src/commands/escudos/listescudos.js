// src/commands/escudos/listescudos.js
const {
  todosLosJugadores,
  escudoActivoPorJugadorId,
} = require('../../database/escudos.db')

function formatearTiempoRestante(ms) {
  if (ms <= 0) return '⚠️ Vencido'
  const dias    = Math.floor(ms / (1000 * 60 * 60 * 24))
  const horas   = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutos = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
  if (dias > 0)  return `${dias}d ${horas}h ${minutos}m`
  if (horas > 0) return `${horas}h ${minutos}m`
  return `${minutos}m`
}

module.exports = {
  name: 'listescudos',
  admin: false,
  mensajero: false,

  execute: async (sock, msg) => {
    const chatId   = msg.key.remoteJid
    const texto    = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const args     = texto.replace(/^#\S+\s*/i, '').trim().toLowerCase()

    const jugadores = await todosLosJugadores()

    if (!jugadores.length) {
      return sock.sendMessage(chatId, {
        text:
          '📋 No hay nadie registrado aún.\n\n' +
          'Los miembros pueden registrarse con:\n' +
          '*#addcuentas TuNombre*\n\n🅣🅗 - 🅑🅞🅣'
      })
    }

    // Filtro opcional por nombre parcial
    const filtrados = args
      ? jugadores.filter(j => j.nombre.toLowerCase().includes(args))
      : jugadores

    if (!filtrados.length) {
      return sock.sendMessage(chatId, {
        text: `❌ No se encontró ningún jugador con "*${args}*".`
      })
    }

    const lineas = []
    for (const j of filtrados) {
      const escudo = await escudoActivoPorJugadorId(j.id)
      const estado = escudo
        ? `🛡️ ${escudo.tipo} — ${formatearTiempoRestante(escudo.vence_en - Date.now())}`
        : '❌ Sin escudo'
      lineas.push(
        `▫️ [*${j.id}*] *${j.nombre}* — ****${j.tag} — ${estado}`
      )
    }

    return sock.sendMessage(chatId, {
      text:
        `🛡️ *JUGADORES REGISTRADOS EN ESCUDOS*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `${lineas.join('\n')}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📊 Total: *${filtrados.length}* jugador(es)\n\n` +
        `_Usa #escudo Nombre o #escudo ID para alertar._\n\n🅣🅗 - 🅑🅞🅣`
    })
  }
}