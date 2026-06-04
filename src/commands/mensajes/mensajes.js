const { cargarMensajes } = require('../../utils/mensajes.utils')

module.exports = {
  name: 'mensajes',
  keywords: ['mensajes'],
  admin: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid
    const mensajes = cargarMensajes()

    if (mensajes.length === 0) {
      return await sock.sendMessage(chatId, { text: 'No hay mensajes guardados.' })
    }

    try {
      for (const mensaje of mensajes) {
        await sock.sendMessage(chatId, { text: mensaje.texto })
      }
    } catch (error) {
      console.error('Error en #mensajes:', error)
      await sock.sendMessage(chatId, { text: 'Ocurrio un error al enviar los mensajes.' })
    }
  }
}