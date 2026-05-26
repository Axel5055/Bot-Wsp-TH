const path = require('path')

module.exports = {
  name: 'moai',
  admin: false,
  execute: async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid, {
      image: {
        url: path.join(__dirname, '../../../media/images/mobs/moai.jpg')
      },
      caption: '*🗿 Moai* - Estrategia para cazar este mob 🏹'
    })
  }
}