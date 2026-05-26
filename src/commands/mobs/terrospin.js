const path = require('path')

module.exports = {
  name: 'terrospin',
  admin: false,
  execute: async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid, {
      image: {
        url: path.join(__dirname, '../../../media/images/mobs/terrospin.jpg')
      },
      caption: '*🦖 Terrospin* - Estrategia para cazar este mob 🏹'
    })
  }
}