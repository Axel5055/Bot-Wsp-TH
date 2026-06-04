const { buscarPorJid } = require('../../utils/escudos.utils')

module.exports = {
  name: 'miescudo',
  keywords: ['miescudo'],
  admin: false,
  mensajero: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid
    const jid = msg.key.participant || msg.key.remoteJid

    const registro = buscarPorJid(jid)

    if (!registro) {
      return await sock.sendMessage(chatId, {
        text: '❌ No tienes ningún registro. Usa *#addescudo NombreIngame, NumeroConLada* para registrarte.'
      })
    }

    return await sock.sendMessage(chatId, {
      text: `📋 *Tu registro de escudo:*\n\n👤 *Nombre:* ${registro.nombre}\n📱 *Número:* ${registro.numero}\n\n_Usa #editescudo para modificarlo o #delescudo para borrarlo._\n\n🅣🅗 - 🅑🅞🅣`
    })
  }
}