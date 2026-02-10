const fs = require('fs')
const path = require('path')

// 📌 Ruta de la imagen de bienvenida
const imagePath = path.join(
  __dirname,
  '../../media/images/morada.jpg'
)

// Normalizar JID del participante
function normalizeJid(participant) {
  if (!participant) return null
  if (typeof participant === 'string') return participant
  return participant.id || participant.jid || participant.participant || null
}

// Enviar bienvenida automática
async function sendAutoWelcome(sock, chatId, participant) {
  try {
    const jid = normalizeJid(participant)
    if (!jid) return

    const tag = jid.split('@')[0]

    let caption = `*¡Bienvenido(a) al Chat de WhatsApp de T\\H!*  

Nos alegra tenerte con nosotros, @${tag}. Esperamos que te sientas cómodo(a) y disfrutes de la comunidad.

📝 Usa el comando *#reglas* para conocer las normas del grupo.

🏆 El mejor cazador del mes gana *499 diamantes*.

📝 Usa *#caza* para ver reglas de cacería.  
🦊 Usa *#menu* o *#help* para ver todos los comandos.

🅣🅗 — 🅑🅞🅣`

    // 🧪 Verificar si la imagen existe
    if (!fs.existsSync(imagePath)) {
      console.warn('⚠️ Imagen de bienvenida no encontrada:', imagePath)

      await sock.sendMessage(chatId, {
        text: caption,
        mentions: [jid]
      })

      return
    }

    // 📤 Enviar imagen con caption
    await sock.sendMessage(chatId, {
      image: { url: imagePath },
      caption,
      mentions: [jid]
    })

  } catch (error) {
    console.error('❌ Error en auto-welcome:', error)
  }
}

// Listener principal
function setupAutoWelcome(sock) {
  sock.ev.on('group-participants.update', async update => {
    if (update.action !== 'add') return

    const chatId = update.id

    for (const participant of update.participants) {
      await sendAutoWelcome(sock, chatId, participant)
    }
  })
}

module.exports = setupAutoWelcome
