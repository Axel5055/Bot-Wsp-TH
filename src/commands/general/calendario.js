const path = require('path')

module.exports = {
  name: 'imagen',
  admin: false,
  execute: async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid, {
      image: {
        url: path.join(__dirname, '../../../media/images/calendario.jpg')
      },
      caption: '📷 Imagen de ejemplo'
    })
  }
}
