const { cargarMensajes, guardarMensajes, siguienteId } = require('../../utils/mensajes.utils')

module.exports = {
  name: 'addmensaje',
  keywords: ['addmensaje'],
  admin: true,
  mensajero: true,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid
    const texto = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const contenido = texto.replace(/^#addmensaje\s*/i, '').trim()
    const separador = contenido.indexOf(',')

    if (separador === -1) {
      return await sock.sendMessage(chatId, {
        text: 'Formato incorrecto. Usa:\n#addmensaje Titulo, Texto del mensaje'
      })
    }

    const titulo = contenido.substring(0, separador).trim()
    const textMensaje = contenido.substring(separador + 1).trim()

    if (!titulo || !textMensaje) {
      return await sock.sendMessage(chatId, {
        text: 'El titulo y el texto no pueden estar vacios.'
      })
    }

    const mensajes = cargarMensajes()
    const nuevoMensaje = { id: siguienteId(mensajes), titulo, texto: textMensaje }
    mensajes.push(nuevoMensaje)
    guardarMensajes(mensajes)

    return await sock.sendMessage(chatId, {
      text: `Mensaje agregado correctamente con ID ${nuevoMensaje.id}.`
    })
  }
}