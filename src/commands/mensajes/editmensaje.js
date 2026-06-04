const { cargarMensajes, guardarMensajes } = require('../../utils/mensajes.utils')

module.exports = {
  name: 'editmensaje',
  keywords: ['editmensaje'],
  admin: false,
  mensajero: true,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid
    const texto = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const contenido = texto.replace(/^#editmensaje\s*/i, '').trim()
    const separador = contenido.indexOf('|')

    if (separador === -1) {
      return await sock.sendMessage(chatId, {
        text: 'Formato incorrecto. Usa:\n#editmensaje ID | Nuevo texto'
      })
    }

    const id = parseInt(contenido.substring(0, separador).trim())
    const nuevoTexto = contenido.substring(separador + 1).trim()

    if (isNaN(id) || !nuevoTexto) {
      return await sock.sendMessage(chatId, {
        text: 'El ID debe ser un numero y el texto no puede estar vacio.'
      })
    }

    const mensajes = cargarMensajes()
    const index = mensajes.findIndex(m => m.id === id)

    if (index === -1) {
      return await sock.sendMessage(chatId, { text: `No existe un mensaje con ID ${id}.` })
    }

    mensajes[index].texto = nuevoTexto
    guardarMensajes(mensajes)

    return await sock.sendMessage(chatId, {
      text: `Mensaje ${id} actualizado correctamente.`
    })
  }
}