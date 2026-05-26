const path = require('path')

module.exports = {
  name: 'rugido',
  admin: false,
  execute: async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid, {
      image: {
        url: path.join(__dirname, '../../../media/images/mobs/rugido.jpg')
      },
      caption: '*🦁 Rugido* - Estrategia para cazar este mob 🏹'
    })
  }
}