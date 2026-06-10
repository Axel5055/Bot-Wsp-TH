const { cargarRegistros } = require('../../utils/escudos.utils')

module.exports = {
  name: 'listescudos',
  keywords: ['listescudos'],
  admin: false,
  mensajero: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid
    const registros = cargarRegistros()

    if (registros.length === 0) {
      return await sock.sendMessage(chatId, {
        text: '📋 No hay nadie registrado aún.\n\nLos miembros pueden registrarse con:\n*#addescudo NombreIngame, NumeroConLada*\n\n🅣🅗 - 🅑🅞🅣'
      })
    }

    const lista = registros.map(r =>
      `▫️ [ID: ${r.id}] *${r.nombre}* — +${r.numero || r.numero.slice(-4)}`
    ).join('\n')

    return await sock.sendMessage(chatId, {
      text: `🛡️ *JUGADORES REGISTRADOS EN ALERTAS DE ESCUDO*\n━━━━━━━━━━━━━━━━━━━━\n\n${lista}\n\n━━━━━━━━━━━━━━━━━━━━\n📊 Total: *${registros.length}* registrado(s)\n\n_Usa #escudo Nombre o #escudo ID para alertar._\n\n🅣🅗 - 🅑🅞🅣`
    })
  }
}