const path = require('path')

module.exports = {
  name: 'megalarva',
  admin: false,
  execute: async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid, {
      image: {
        url: path.join(__dirname, '../../../media/images/mobs/megalarva.jpg')
      },
      caption: '*🐛 Megalarva* - Estrategia para cazar este mob 🏹'
    })
  }
}