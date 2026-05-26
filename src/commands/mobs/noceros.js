const path = require('path')

module.exports = {
  name: 'noceros',
  admin: false,
  execute: async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid, {
      image: {
        url: path.join(__dirname, '../../../media/images/mobs/noceros.jpg')
      },
      caption: '*🦏 Noceros* - Estrategia para cazar este mob 🏹'
    })
  }
}