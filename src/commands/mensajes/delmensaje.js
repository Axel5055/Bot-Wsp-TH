const { cargarMensajes, guardarMensajes } = require('../../utils/mensajes.utils')

module.exports = {
  name: 'delmensaje',
  keywords: ['delmensaje'],
  admin: true,
  mensajero: true,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid
    const texto = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const contenido = texto.replace(/^#delmensaje\s*/i, '').trim()
    const id = parseInt(contenido)

    if (isNaN(id)) {
      return await sock.sendMessage(chatId, {
        text: 'Formato incorrecto. Usa:\n#delmensaje ID'
      })
    }

    const mensajes = cargarMensajes()
    const index = mensajes.findIndex(m => m.id === id)

    if (index === -1) {
      return await sock.sendMessage(chatId, { text: `No existe un mensaje con ID ${id}.` })
    }

    const titulo = mensajes[index].titulo
    mensajes.splice(index, 1)
    guardarMensajes(mensajes)

    return await sock.sendMessage(chatId, {
      text: `Mensaje "${titulo}" eliminado correctamente.`
    })
  }
}