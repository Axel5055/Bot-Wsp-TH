const { cargarMensajes } = require('../../utils/mensajes.utils')

module.exports = {
  name: 'mensajes',
  keywords: ['mensajes'],
  admin: false,

  execute: async (sock, msg, args) => {
    const chatId  = msg.key.remoteJid
    const mensajes = cargarMensajes()

    if (mensajes.length === 0) {
      return sock.sendMessage(chatId, { text: '📭 No hay mensajes guardados.' })
    }

    try {
      // Sin args: listar IDs disponibles
      if (!args || args.length === 0) {
        let txt = `📋 *Mensajes disponibles:*\n━━━━━━━━━━━━━━━━━━━━━━━\n`
        mensajes.forEach(m => {
          const preview = String(m.titulo ?? '').slice(0, 40).replace(/\n/g, ' ')
          txt += `🔹 *#${m.id}* — ${preview}${m.titulo.length > 40 ? '…' : ''}\n`
        })
        txt += `━━━━━━━━━━━━━━━━━━━━━━━\n`
        txt += `💡 Usa *#mensajes <id>* para enviar uno.\nEjemplo: *#mensajes 3*`
        return sock.sendMessage(chatId, { text: txt })
      }

      // Con arg: buscar por ID
      const id      = parseInt(args[0])
      const mensaje = mensajes.find(m => m.id === id)

      if (!mensaje) {
        return sock.sendMessage(chatId, {
          text: `❌ No se encontró el mensaje con ID *${id}*.\n💡 Usa *#mensajes* para ver los disponibles.`,
        })
      }

      await sock.sendMessage(chatId, { text: mensaje.texto })

    } catch (error) {
      console.error('Error en #mensajes:', error)
      await sock.sendMessage(chatId, { text: '⚠️ Ocurrió un error al enviar el mensaje.' })
    }
  }
}