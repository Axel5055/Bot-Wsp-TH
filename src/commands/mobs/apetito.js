const path = require('path')

module.exports = {
  name: 'apetito',
  admin: false,
  execute: async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid, {
      image: {
        url: path.join(__dirname, '../../../media/images/mobs/apetito.jpg')
      },
      caption: '*🍖 Apetito* - Estrategia para cazar este mob 🏹'
    })
  }
}
