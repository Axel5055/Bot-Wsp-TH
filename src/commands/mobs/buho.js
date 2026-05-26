const path = require('path')

module.exports = {
  name: 'buho',
  admin: false,
  execute: async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid, {
      image: {
        url: path.join(__dirname, '../../../media/images/mobs/buho.jpg')
      },
      caption: '*🦉 Búho* - Estrategia para cazar este mob 🏹'
    })
  }
}
