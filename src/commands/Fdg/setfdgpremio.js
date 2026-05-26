const { getConfig, saveConfig } = require('../../config/fdgConfig')

module.exports = {
  name: 'setfdgpremio',
  admin: true,

  async execute(sock, msg, args) {

    const chatId = msg.key.remoteJid

    const posicion = args[0]
    const premio = args.slice(1).join(' ')

    if (!posicion || !premio) {
      return sock.sendMessage(chatId, {
        text: '⚠️ Usa:\n#setfdgpremio 1 499 diamantes'
      })
    }

    if (!['1','2','3'].includes(posicion)) {
      return sock.sendMessage(chatId, {
        text: '⚠️ Solo puedes editar premios del 1 al 3.'
      })
    }

    const config = getConfig()

    config.premios[posicion] = premio

    saveConfig(config)

    await sock.sendMessage(chatId, {
      text: `🏆 Premio del lugar *${posicion}* actualizado:\n🎁 ${premio}`
    })
  }
}