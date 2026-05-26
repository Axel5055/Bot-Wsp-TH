const path = require('path')

module.exports = {
  name: 'araña',
  admin: false,
  execute: async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid, {
      image: {
        url: path.join(__dirname, '../../../media/images/mobs/araña.jpg')
      },
      caption: '*🕷 Araña* - Estrategia para cazar este mob 🏹'
    })
  }
}
