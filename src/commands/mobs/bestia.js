const path = require('path')

module.exports = {
  name: 'bestia',
  admin: false,
  execute: async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid, {
      image: {
        url: path.join(__dirname, '../../../media/images/mobs/bestia.jpg')
      },
      caption: '*🦁 Bestia* - Estrategia para cazar este mob 🏹'
    })
  }
}
