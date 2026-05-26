const path = require('path')

module.exports = {
  name: 'titan',
  admin: false,
  execute: async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid, {
      image: {
        url: path.join(__dirname, '../../../media/images/mobs/titan.jpg')
      },
      caption: '*🗿 Titán* - Estrategia para cazar este mob 🏹'
    })
  }
}
