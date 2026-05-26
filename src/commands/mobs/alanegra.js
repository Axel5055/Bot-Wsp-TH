const path = require('path')

module.exports = {
  name: 'alanegra',
  admin: false,
  execute: async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid, {
      image: {
        url: path.join(__dirname, '../../../media/images/mobs/alanegra.jpg')
      },
      caption: '*🖤 Ala Negra* - Estrategia recomendada para cazar este mob 🏹'
    })
  }
}