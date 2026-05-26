const path = require('path')

module.exports = {
  name: 'ballena',
  admin: false,
  execute: async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid, {
      image: {
        url: path.join(__dirname, '../../../media/images/mobs/ballena.jpg')
      },
      caption: '*🐋 Ballena* - Estrategia para cazar este mob 🏹'
    })
  }
}
