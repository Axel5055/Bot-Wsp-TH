const path = require('path')

module.exports = {
  name: 'necrosis',
  admin: false,
  execute: async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid, {
      image: {
        url: path.join(__dirname, '../../../media/images/mobs/necrosis.jpg')
      },
      caption: '*☠️ Necrosis* - Estrategia para cazar este mob 🏹'
    })
  }
}