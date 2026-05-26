const path = require('path')

module.exports = {
  name: 'gorila',
  admin: false,
  execute: async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid, {
      image: {
        url: path.join(__dirname, '../../../media/images/mobs/gorila.jpg')
      },
      caption: '*🦍 Gorila* - Estrategia para cazar este mob 🏹'
    })
  }
}