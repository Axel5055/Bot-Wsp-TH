const path = require('path')

module.exports = {
  name: 'chaman',
  admin: false,
  execute: async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid, {
      image: {
        url: path.join(__dirname, '../../../media/images/mobs/chaman.jpg')
      },
      caption: '*🧙 Chaman* - Estrategia para cazar este mob 🏹'
    })
  }
}
