module.exports = {
  name: 'say',
  admin: true,

  execute: async (sock, msg, args) => {
    if (!args.length) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: '❗ Debes escribir un mensaje'
      })
    }

    const text = args.join(' ')

    await sock.sendMessage(msg.key.remoteJid, {
      text
    })
  }
}
