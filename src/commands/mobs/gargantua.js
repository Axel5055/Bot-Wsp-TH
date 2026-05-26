const path = require('path')

module.exports = {
  name: 'gargantua',
  admin: false,
  execute: async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid, {
      image: {
        url: path.join(__dirname, '../../../media/images/mobs/gargantua.jpg')
      },
      caption: '*🗿 Gargantua* - Estrategia para cazar este mob 🏹'
    })
  }
}