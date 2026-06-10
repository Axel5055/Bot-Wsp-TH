// src/commands/escudos/delescudo.js
const isAdmin = require('../../utils/isAdmin')
const {
  jugadoresPorJid,
  jugadorPorId,
  buscarJugador,
  eliminarJugador,
  eliminarEscudoActivo,
} = require('../../database/escudos.db')

module.exports = {
  name: 'delescudo',
  admin: false,
  mensajero: false,

  execute: async (sock, msg) => {
    const chatId       = msg.key.remoteJid
    const senderJid    = msg.key.participant || msg.key.remoteJid
    const texto        = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const contenido    = texto.replace(/^#\S+\s*/i, '').trim()
    const adminEjecutando = isAdmin(senderJid)

    // ── Sin parámetros ──
    if (!contenido) {
      const cuentas = await jugadoresPorJid(senderJid)

      if (cuentas.length === 0) {
        return sock.sendMessage(chatId, { text: '❌ No tienes ningún registro activo.' })
      }

      if (cuentas.length === 1) {
        await eliminarEscudoActivo(cuentas[0].id)
        await eliminarJugador(cuentas[0].id)
        return sock.sendMessage(chatId, {
          text: `🗑️ Tu registro *${cuentas[0].nombre}* ha sido eliminado.\n\n🅣🅗 - 🅑🅞🅣`
        })
      }

      const lista = cuentas.map(r => `▫️ [ID: *${r.id}*] *${r.nombre}* — ****${r.tag}`).join('\n')
      return sock.sendMessage(chatId, {
        text: `⚠️ Tienes *${cuentas.length}* cuentas. Especifica cuál eliminar:\n\n${lista}\n\nUso:\n*#delescudo ID*\n\nEjemplo:\n*#delescudo ${cuentas[0].id}*`
      })
    }

    // ── Con parámetro, usuario normal ──
    if (!adminEjecutando) {
      const idBuscado = parseInt(contenido)
      const cuentas   = await jugadoresPorJid(senderJid)
      const esSuyo    = cuentas.find(r => r.id === idBuscado)

      if (!esSuyo) {
        return sock.sendMessage(chatId, {
          text: '⛔ Solo los administradores pueden eliminar registros de otros usuarios.\n\nUsa *#delescudo ID* con el ID de una de tus propias cuentas.'
        })
      }

      await eliminarEscudoActivo(esSuyo.id)
      await eliminarJugador(esSuyo.id)
      return sock.sendMessage(chatId, {
        text: `🗑️ Tu cuenta *${esSuyo.nombre}* ha sido eliminada.\n\n🅣🅗 - 🅑🅞🅣`
      })
    }

    // ── Admin con parámetro ──
    const { jugador, tipo, coincidencias } = await buscarJugador(contenido)

    if (tipo === 'tag_duplicado') {
      const lista = coincidencias.map(r => `▫️ [ID: *${r.id}*] *${r.nombre}*`).join('\n')
      return sock.sendMessage(chatId, {
        text: `⚠️ Hay *${coincidencias.length}* registros con el tag *${contenido}*:\n\n${lista}\n\nUsa el *ID* o el *nombre* para ser más específico.`
      })
    }

    if (!jugador) {
      const mensajes = {
        id:     `❌ No existe ningún registro con ID *${contenido}*.`,
        tag:    `❌ No existe ningún registro con los últimos 4 dígitos *${contenido}*.`,
        nombre: `❌ No existe ningún registro con el nombre *${contenido}*.`,
      }
      return sock.sendMessage(chatId, { text: mensajes[tipo] })
    }

    await eliminarEscudoActivo(jugador.id)
    await eliminarJugador(jugador.id)
    return sock.sendMessage(chatId, {
      text: `🗑️ Registro *${jugador.nombre}* (ID: ${jugador.id}) eliminado por admin.\n\n🅣🅗 - 🅑🅞🅣`
    })
  }
}