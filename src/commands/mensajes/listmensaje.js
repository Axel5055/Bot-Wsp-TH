const { cargarMensajes } = require('../../utils/mensajes.utils')

module.exports = {
  name: 'listmensajes',
  keywords: ['listmensajes'],
  admin: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid
    const mensajes = cargarMensajes()

    if (mensajes.length === 0) {
      return await sock.sendMessage(chatId, { text: 'No hay mensajes guardados.' })
    }

    const lista = mensajes.map(m => `[${m.id}] ${m.titulo}`).join('\n')
    return await sock.sendMessage(chatId, {
      text: `Mensajes guardados:\n\n${lista}\n\nUsa #mensajes para enviarlos todos.`
    })
  }
}