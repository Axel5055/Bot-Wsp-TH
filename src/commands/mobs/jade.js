const path = require('path')

module.exports = {
  name: 'jade',
  admin: false,
  execute: async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid, {
      image: {
        url: path.join(__dirname, '../../../media/images/mobs/jade.jpg')
      },
      caption: '*💎 Jade* - Estrategia para cazar este mob 🏹'
    })
  }
}