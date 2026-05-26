const path = require('path')
const fs = require('fs')

module.exports = {
  name: 'art',
  keywords: ['artilleria', 'arcos', 'artillería'],
  admin: false,
  execute: async (sock, msg) => {
    const imagePath = path.join(
      __dirname,
      '../../../media/images/armaduras/art.jpeg'
    )

    try {
      // 🧪 Verificar que la imagen exista
      if (!fs.existsSync(imagePath)) {
        console.error('❌ Imagen no encontrada:', imagePath)

        await sock.sendMessage(msg.key.remoteJid, {
          text: '⚠️ Error: la imagen del set de artillería no está disponible.'
        })

        return
      }

      // 📤 Enviar imagen
      await sock.sendMessage(msg.key.remoteJid, {
        image: { url: imagePath },
        caption: `💥 *SET DE ARTILLERÍA* 💥

Aquí tienes todo lo que necesitas saber para maximizar tu poder de combate.

🛡️ Stats y armadura completos...

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
