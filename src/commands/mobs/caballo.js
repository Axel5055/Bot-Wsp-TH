const path = require('path')

module.exports = {
  name: 'caballo',
  admin: false,
  execute: async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid, {
      image: {
        url: path.join(__dirname, '../../../media/images/mobs/caballo.jpg')
      },
      caption: '*🐎 Caballo* - Estrategia para cazar este mob 🏹'
    })
  }
}