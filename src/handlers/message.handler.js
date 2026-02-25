// message.handler.js
const commandHandler = require('./command.handler')
const triggers = require('../triggers')
const chalk = require('chalk').default

module.exports = (sock) => {
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    const msg = messages[0]
    if (!msg.message) return
    if (msg.key.fromMe) return
    if (msg.key.remoteJid === 'status@broadcast') return

    // 🔥 IGNORAR SOLO MENSAJES INTERNOS
    if (
      msg.message.protocolMessage ||
      msg.message.reactionMessage ||
      msg.message.senderKeyDistributionMessage
    ) {
      return
    }

    const remoteJid = msg.key.remoteJid
    const isGroup = remoteJid.endsWith('@g.us')

    // =========================
    // 🔎 DETECCIÓN DE MENSAJE
    // =========================

    const messageContent = msg.message
    const messageType = Object.keys(messageContent)[0]

    const textMessage =
      messageContent.conversation ||
      messageContent.extendedTextMessage?.text ||
      messageContent.imageMessage?.caption ||
      messageContent.videoMessage?.caption ||
      ''

    // Si no hay texto ni media relevante, salir
    if (!textMessage && !['imageMessage','videoMessage','audioMessage','stickerMessage'].includes(messageType)) {
      return
    }

    // =========================
    // 👤 USUARIO
    // =========================

    const senderJid = msg.key.participant || msg.key.remoteJid
    const senderNumber = senderJid.split('@')[0]
    const senderName = msg.pushName || 'Desconocido'

    // =========================
    // 👥 GRUPO
    // =========================

    let groupName = 'Privado'
    let groupId = 'N/A'

    if (isGroup) {
      groupId = remoteJid
      try {
        const metadata = await sock.groupMetadata(remoteJid)
        groupName = metadata.subject
      } catch {
        groupName = 'Grupo desconocido'
      }
    }

    // =========================
    // 🧠 MENSAJE RESUMIDO
    // =========================

    let messagePreview = ''
    const MAX_LENGTH = 80

    if (textMessage) {
      if (textMessage.length > MAX_LENGTH) {
        messagePreview = chalk.yellow('[ MENSAJE LARGO ]')
      } else {
        messagePreview = chalk.white(textMessage)
      }
    } else {
      switch (messageType) {
        case 'imageMessage':
          messagePreview = chalk.cyan('[ IMAGEN ]')
          break
        case 'audioMessage':
          messagePreview = chalk.magenta('[ AUDIO ]')
          break
        case 'stickerMessage':
          messagePreview = chalk.green('[ STICKER ]')
          break
        case 'videoMessage':
          messagePreview = chalk.blue('[ VIDEO ]')
          break
        default:
          return
      }
    }

    // =========================
    // 🖥️ LOG EN CONSOLA
    // =========================

    console.log(chalk.bold('\n📩 NUEVO MENSAJE DETECTADO'))
    console.log(chalk.gray('────────────────────────────────'))

    console.log(
      chalk.blue('👥 Grupo:'),
      chalk.white(groupName)
    )

    console.log(
      chalk.blue('🆔 ID Grupo:'),
      chalk.white(groupId)
    )

    console.log(
      chalk.green('📞 Número:'),
      chalk.white(senderNumber)
    )

    console.log(
      chalk.green('👤 Usuario:'),
      chalk.white(senderName)
    )

    console.log(
      chalk.yellow('💬 Mensaje:'),
      messagePreview
    )

    console.log(chalk.gray('────────────────────────────────\n'))

    // =========================
    // ⚙️ LÓGICA DEL BOT
    // =========================

    await commandHandler(sock, msg, textMessage)

    for (const trigger of triggers) {
      await trigger(sock, msg, textMessage)
    }
  })
}