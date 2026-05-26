const { getConfig, saveConfig } = require('../../config/fdgConfig')

module.exports = {
  name: 'setfdgmin',
  admin: true,

  async execute(sock, msg, args) {

    const chatId = msg.key.remoteJid

    const nuevoMinimo = Number(args[0])

    if (!nuevoMinimo) {
      return sock.sendMessage(chatId, {
        text: '⚠️ Usa:\n#setfdgmin 3500'
      })
    }

    const config = getConfig()

    config.puntajeMinimo = nuevoMinimo

    saveConfig(config)

    await sock.sendMessage(chatId, {
      text: `✅ Puntaje mínimo FDG actualizado a *${nuevoMinimo}*`
    })
  }
}