const path = require('path')

module.exports = {
  name: 'grifo',
  admin: false,
  execute: async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid, {
      image: {
        url: path.join(__dirname, '../../../media/images/mobs/grifo.jpg')
      },
      caption: '*🦅 Grifo* - Estrategia para cazar este mob 🏹'
    })
  }
}