const path = require('path')

module.exports = {
  name: 'abeja',
  admin: false,
  execute: async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid, {
      image: {
        url: path.join(__dirname, '../../../media/images/mobs/abeja.jpg')
      },
      caption: '*🐝 Abeja* - Estrategia recomendada para cazar este mob 🏹'
    })
  }
}