const { cargarRegistros, guardarRegistros, buscarPorJid, buscarPorNombre } = require('../../utils/escudos.utils')
const isAdmin = require('../../utils/isAdmin')

module.exports = {
  name: 'delescudo',
  keywords: ['delescudo'],
  admin: false,
  mensajero: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid
    const senderJid = msg.key.participant || msg.key.remoteJid
    const texto = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''

    const contenido = texto.replace(/^#\S+\s*/i, '').trim()
    const adminEjecutando = isAdmin(senderJid)

    // ── Modo admin: #delescudo NombreIngame ──
    if (contenido && adminEjecutando) {
      const registro = buscarPorNombre(contenido)

      if (!registro) {
        return await sock.sendMessage(chatId, {
          text: `❌ No existe ningún registro con el nombre *${contenido}*.`
        })
      }

      const registros = cargarRegistros()
      const nuevos = registros.filter(r => r.jid !== registro.jid)
      guardarRegistros(nuevos)

      return await sock.sendMessage(chatId, {
        text: `🗑️ Registro de *${registro.nombre}* eliminado por admin.\n\n🅣🅗 - 🅑🅞🅣`
      })
    }

    // ── Modo normal: #delescudo (elimina el propio) ──
    if (contenido && !adminEjecutando) {
      return await sock.sendMessage(chatId, {
        text: '⛔ Solo los administradores pueden eliminar el registro de otros usuarios.\n\nUsa *#delescudo* sin parámetros para eliminar tu propio registro.'
      })
    }

    // ── Sin parámetros: eliminar registro propio ──
    if (!buscarPorJid(senderJid)) {
      return await sock.sendMessage(chatId, {
        text: '❌ No tienes ningún registro activo.'
      })
    }

    const registros = cargarRegistros()
    const nuevos = registros.filter(r => r.jid !== senderJid)
    guardarRegistros(nuevos)

    return await sock.sendMessage(chatId, {
      text: '🗑️ Tu registro ha sido eliminado. Ya no recibirás alertas de escudo.\n\n🅣🅗 - 🅑🅞🅣'
    })
  }
}