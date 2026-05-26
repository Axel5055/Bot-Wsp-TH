const path = require('path')

module.exports = {
  name: 'saberfang',
  admin: false,
  execute: async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid, {
      image: {
        url: path.join(__dirname, '../../../media/images/mobs/saberfang.jpg')
      },
      caption: '*🐆 Saberfang* - Estrategia para cazar este mob 🏹'
    })
  }
}