const fs = require('fs')
const path = require('path')

module.exports = {
  name: 'welcome',
  keywords: ['bienvenida', 'bienvenido'],
  admin: true,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid

    const imagePath = path.join(
      __dirname,
      '../../../media/images/morada.jpg'
    )

    try {
      // 📌 Detectar menciones
      const mentions =
        msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []

      let caption = `*¡Bienvenido(a) al Chat de WhatsApp de T\\H!*  

Nos alegra tenerte con nosotros. Esperamos que te sientas cómodo(a) y disfrutes de la comunidad.`

      // ✔ Si hay menciones → agregar @tags
      if (mentions.length > 0) {
        const tags = mentions
          .map(jid => `@${jid.split('@')[0]}`)
          .join(', ')

        caption = caption.replace(
          'con nosotros',
          `con nosotros, ${tags}`
        )
      }

      caption += `

📝 Usa el comando *#reglas* para conocer las normas del grupo.

🏆 Premios a los mejores cazadores en *Diamantes, Rss o Gemas*.

📝 Usa *#caza* para ver reglas de cacería.
🦊 Usa *#menu* o *#help* para ver todos los comandos.

🅣🅗 — 🅑🅞🅣`

      // 🧪 Verificar si la imagen existe
      if (!fs.existsSync(imagePath)) {
        console.warn('⚠️ Imagen de bienvenida no encontrada:', imagePath)

        await sock.sendMessage(chatId, {
          text: caption,
          mentions
        })

        return
      }

      // 📤 Enviar imagen con caption
      await sock.sendMessage(chatId, {
        image: { url: imagePath },
        caption,
        mentions
      })

    } catch (error) {
      console.error('❌ Error en comando /welcome:', error)

      await sock.sendMessage(chatId, {
        text: '🚨 Ocurrió un error al enviar el mensaje de bienvenida.'
      })
    }
  }
}
