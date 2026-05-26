const { getConfig } = require('../../config/fdgConfig')

module.exports = {
  name: 'fdgconfig',
  admin: false,

  async execute(sock, msg) {

    const chatId = msg.key.remoteJid

    const config = getConfig()

    let txt = `⚙️ *Configuración FDG*\n\n`

    txt += `🎯 Puntaje mínimo: *${config.puntajeMinimo}*\n\n`

    txt += `🏆 Premios\n`
    txt += `🥇 ${config.premios[1]}\n`
    txt += `🥈 ${config.premios[2]}\n`
    txt += `🥉 ${config.premios[3]}\n`

    await sock.sendMessage(chatId, { text: txt })

  }
}