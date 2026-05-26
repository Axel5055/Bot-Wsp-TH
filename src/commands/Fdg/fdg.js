const { getConfig } = require('../../config/fdgConfig')

module.exports = {
  name: 'fdg',
  admin: false,

  async execute(sock, msg) {

    const chatId = msg.key.remoteJid

    try {

      const config = getConfig()

      const puntajeMinimo = config.puntajeMinimo || 0
      const premios = config.premios || {}

      let txt = `🎉 *FIESTA DE GREMIO (FDG)* 🎉\n\n`

      txt += `📜 *REGLAS DEL EVENTO*\n\n`
      txt += `🎯 Puntaje mínimo requerido:\n`
      txt += `⭐ *${puntajeMinimo} puntos*\n\n`

      txt += `🏆 *PREMIOS DEL EVENTO*\n\n`

      if (premios[1]) txt += `🥇 1er Lugar → ${premios[1]}\n`
      if (premios[2]) txt += `🥈 2do Lugar → ${premios[2]}\n`
      if (premios[3]) txt += `🥉 3er Lugar → ${premios[3]}\n`

      txt += `\n⚠️ Es obligatorio completar todas las misiones y alcanzar el puntaje mínimo establecido. Los jugadores que no cumplan con estos requisitos podrán ser sancionados conforme a las reglas del gremio.\n\n`

      txt += `🔥 ¡Buena FDG y mucha suerte!`

      await sock.sendMessage(chatId, { text: txt })

    } catch (error) {

      console.error('Error en fdg:', error)

      await sock.sendMessage(chatId, {
        text: '⚠️ Error mostrando información de FDG.'
      })

    }

  },
}