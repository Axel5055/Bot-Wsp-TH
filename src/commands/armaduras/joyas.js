const path = require('path')
const fs = require('fs')

module.exports = {
  name: 'infa',
  admin: false,
  execute: async (sock, msg) => {
    const imagePath = path.join(
      __dirname,
      '../../../media/images/armaduras/joyas.jpeg'
    )

    try {
      // 🧪 Verificar que la imagen exista
      if (!fs.existsSync(imagePath)) {
        console.error('❌ Imagen no encontrada:', imagePath)

        await sock.sendMessage(msg.key.remoteJid, {
          text: '⚠️ Error: la imagen del joyeria no está disponible.'
        })

        return
      }

      // 📤 Enviar imagen
      await sock.sendMessage(msg.key.remoteJid, {
        image: { url: imagePath },
        caption: `💎 *JOYAS RECOMENDADAS* 💎

✨ ¡Mejora tu armadura con las mejores joyas! ✨

🅣🅗 - 🅑🅞🅣`
      })

    } catch (error) {
      console.error('❌ Error en comando /infa:', error)

      // 🚨 Mensaje seguro al usuario
      await sock.sendMessage(msg.key.remoteJid, {
        text: '🚨 Ocurrió un error al ejecutar el comando. Intenta más tarde.'
      })
    }
  }
}
