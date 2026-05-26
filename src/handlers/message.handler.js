// message.handler.js
// ✅ OPTIMIZADO: caché de metadatos de grupo, no hace llamada de red por cada mensaje

const commandHandler = require('./command.handler')
const triggers = require('../triggers')
const chalk = require('chalk').default

// ─────────────────────────────────────────────
// 🗂️ Caché de nombres de grupo (evita llamadas repetidas)
// ─────────────────────────────────────────────
const groupNameCache = new Map()
const GROUP_CACHE_TTL = 10 * 60 * 1000 // 10 minutos

async function getGroupName(sock, remoteJid) {
  const cached = groupNameCache.get(remoteJid)
  if (cached && Date.now() - cached.ts < GROUP_CACHE_TTL) {
    return cached.name
  }

  try {
    const metadata = await sock.groupMetadata(remoteJid)
    const name = metadata.subject || 'Grupo desconocido'
    groupNameCache.set(remoteJid, { name, ts: Date.now() })
    return name
  } catch {
    return 'Grupo desconocido'
  }
}

// ─────────────────────────────────────────────
// 📩 Handler principal
// ─────────────────────────────────────────────
module.exports = (sock) => {
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    const msg = messages[0]
    if (!msg?.message) return
    if (msg.key.fromMe) return
    if (msg.key.remoteJid === 'status@broadcast') return

    // 🔇 Ignorar mensajes internos del protocolo
    const { protocolMessage, reactionMessage, senderKeyDistributionMessage } = msg.message
    if (protocolMessage || reactionMessage || senderKeyDistributionMessage) return

    const remoteJid = msg.key.remoteJid
    const isGroup = remoteJid.endsWith('@g.us')

    // ─── Extraer texto del mensaje ───
    const messageContent = msg.message
    const messageType = Object.keys(messageContent)[0]

    const textMessage =
      messageContent.conversation ||
      messageContent.extendedTextMessage?.text ||
      messageContent.imageMessage?.caption ||
      messageContent.videoMessage?.caption ||
      ''

    const isMedia = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage'].includes(messageType)

    if (!textMessage && !isMedia) return

    // ─── Datos del remitente ───
    const senderJid = msg.key.participant || msg.key.remoteJid
    const senderNumber = senderJid.split('@')[0]
    const senderName = msg.pushName || 'Desconocido'

    // ─── Datos del grupo (con caché) ───
    let groupName = 'Privado'
    let groupId = 'N/A'

    if (isGroup) {
      groupId = remoteJid
      groupName = await getGroupName(sock, remoteJid)
    }

    // ─── Preview para el log ───
    const MAX_LENGTH = 80
    let messagePreview = ''

    if (textMessage) {
      messagePreview = textMessage.length > MAX_LENGTH
        ? chalk.yellow('[ MENSAJE LARGO ]')
        : chalk.white(textMessage)
    } else {
      const previews = {
        imageMessage:   chalk.cyan('[ IMAGEN ]'),
        audioMessage:   chalk.magenta('[ AUDIO ]'),
        stickerMessage: chalk.green('[ STICKER ]'),
        videoMessage:   chalk.blue('[ VIDEO ]'),
      }
      messagePreview = previews[messageType]
      if (!messagePreview) return
    }

    // ─── Log en consola ───
    console.log(chalk.bold('\n📩 NUEVO MENSAJE'))
    console.log(chalk.gray('────────────────────────────'))
    console.log(chalk.blue('👥 Grupo:'),   chalk.white(groupName))
    console.log(chalk.blue('🆔 ID:'),      chalk.white(groupId))
    console.log(chalk.green('📞 Número:'), chalk.white(senderNumber))
    console.log(chalk.green('👤 Usuario:'),chalk.white(senderName))
    console.log(chalk.yellow('💬 Msg:'),   messagePreview)
    console.log(chalk.gray('────────────────────────────\n'))

    // ─── Lógica del bot ───
    await commandHandler(sock, msg, textMessage)

    // Ejecutar triggers en paralelo (más rápido, fallos aislados)
    await Promise.allSettled(
      triggers.map(trigger => trigger(sock, msg, textMessage))
    )
  })
}
