const path = require('path')

module.exports = {
  name: 'serpiente',
  admin: false,
  execute: async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid, {
      image: {
        url: path.join(__dirname, '../../../media/images/mobs/serpiente.jpg')
      },
      caption: '*🐍 Serpiente* - Estrategia para cazar este mob 🏹'
    })
  }
}