const path = require('path')

module.exports = {
  name: 'alaescarcha',
  admin: false,
  execute: async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid, {
      image: {
        url: path.join(__dirname, '../../../media/images/mobs/alaescarcha.jpg')
      },
      caption: '*❄️ Ala Escarcha* - Estrategia recomendada para cazar este mob 🏹'
    })
  }
}