// message.handler.js
const commandHandler = require('./command.handler')
const triggers = require('../triggers')
const chalk = require('chalk').default
const { cargarRegistros } = require('../utils/escudos.utils')
const { gruposAlerta } = require('../config/settings')

// ─────────────────────────────────────────────
// 🗂️ Caché de nombres de grupo
// ─────────────────────────────────────────────
const groupNameCache = new Map()
const GROUP_CACHE_TTL = 10 * 60 * 1000

async function getGroupName(sock, remoteJid) {
  const cached = groupNameCache.get(remoteJid)
  if (cached && Date.now() - cached.ts < GROUP_CACHE_TTL) return cached.name
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
// 🛡️ Listener de respuestas de escudo (mensajes privados)
// ─────────────────────────────────────────────
const FRASES_CLAVE = ['voy', 'ya voy', 'voy a entrar', 'ya estoy', 'entrando', 'escudando', 'ya entro']

async function manejarRespuestaEscudo(sock, msg) {
  const remoteJid = msg.key.remoteJid

  if (remoteJid.endsWith('@g.us')) return

  const texto = (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text || ''
  ).toLowerCase().trim()

  const esRespuesta = FRASES_CLAVE.some(f => texto.includes(f))
  if (!esRespuesta) return

  const registros = cargarRegistros()

  // ✅ Buscar por jid (LID) en lugar de por número de teléfono
  const registro = registros.find(r => r.jid === remoteJid)

  console.log('[ESCUDO DEBUG] remoteJid:', remoteJid)
  console.log('[ESCUDO DEBUG] registro encontrado:', registro)

  if (!registro) return

  const respuestaMensaje = texto.includes('ya estoy') || texto.includes('entrando') || texto.includes('ya entro')
    ? `✅ *${registro.nombre}* ya está *dentro del juego* escudando. 🛡️`
    : `🏃 *${registro.nombre}* va *en camino* a escudar. ¡Ya va entrando!`

  for (const grupoId of gruposAlerta) {
    try {
      await sock.sendMessage(grupoId, { text: respuestaMensaje })
      console.log('[ESCUDO DEBUG] mensaje enviado al grupo:', grupoId)
    } catch (err) {
      console.error('[ESCUDO DEBUG] error enviando al grupo:', err.message)
    }
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

    const { protocolMessage, reactionMessage, senderKeyDistributionMessage } = msg.message
    if (protocolMessage || reactionMessage || senderKeyDistributionMessage) return

    const remoteJid = msg.key.remoteJid
    const isGroup = remoteJid.endsWith('@g.us')

    // 🛡️ Verificar respuestas de escudo ANTES de filtrar privados
    await manejarRespuestaEscudo(sock, msg)

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

    const senderJid = msg.key.participant || msg.key.remoteJid
    const senderNumber = senderJid.split('@')[0]
    const senderName = msg.pushName || 'Desconocido'

    let groupName = 'Privado'
    let groupId = 'N/A'

    if (isGroup) {
      groupId = remoteJid
      groupName = await getGroupName(sock, remoteJid)
    }

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

    console.log(chalk.bold('\n📩 NUEVO MENSAJE'))
    console.log(chalk.gray('────────────────────────────'))
    console.log(chalk.blue('👥 Grupo:'),    chalk.white(groupName))
    console.log(chalk.blue('🆔 ID:'),       chalk.white(groupId))
    console.log(chalk.green('📞 Número:'),  chalk.white(senderNumber))
    console.log(chalk.green('👤 Usuario:'), chalk.white(senderName))
    console.log(chalk.yellow('💬 Msg:'),    messagePreview)
    console.log(chalk.gray('────────────────────────────\n'))

    await commandHandler(sock, msg, textMessage)

    await Promise.allSettled(
      triggers.map(trigger => trigger(sock, msg, textMessage))
    )
  })
}