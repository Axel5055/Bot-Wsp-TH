const path = require('path')

module.exports = {
  name: 'muerte',
  admin: false,
  execute: async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid, {
      image: {
        url: path.join(__dirname, '../../../media/images/mobs/lamuerte.jpg')
      },
      caption: '*💀 La Muerte* - Estrategia para cazar este mob 🏹'
    })
  }
}