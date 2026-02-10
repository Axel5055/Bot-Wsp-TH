// commands/pareja.js
const path = require('path')
const fs = require('fs')

// 📂 Ruta al audio MP3
const audioPath = path.join(__dirname, '../../../media/audios/amor.mp3')

// 🔀 Seleccionar dos miembros aleatorios
function seleccionarPareja(miembros) {
  return [...miembros].sort(() => 0.5 - Math.random()).slice(0, 2)
}

module.exports = {
  name: 'pareja',
  admin: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid

    try {
      // ✅ Solo grupos
      if (!chatId.endsWith('@g.us')) {
        return await sock.sendMessage(chatId, {
          text: '❌ Este comando solo funciona en grupos.'
        })
      }

      // ✅ Obtener metadata
      const chat = await sock.groupMetadata(chatId)
      const participantes = chat.participants || []

      if (participantes.length < 2) {
        return await sock.sendMessage(chatId, {
          text: '⚠️ *No hay suficientes miembros para formar una pareja.*'
        })
      }

      // 🧾 Construir miembros
      const miembros = participantes.map(p => ({
        jid: p.id,
        numero: p.id.split('@')[0],
        nombre: p.notify || p.id.split('@')[0]
      }))

      // 💘 Seleccionar pareja
      const pareja = seleccionarPareja(miembros)

      const texto =
        `💘 *¡Tenemos una nueva pareja del grupo!* 💘\n\n` +
        `✨ Según el destino... hoy el amor ha unido a:\n\n` +
        `❤️ *@${pareja[0].numero}* + *@${pareja[1].numero}*\n\n` +
        `💞 ¡Que viva el amor! 💞\n\n🅣🅗 - 🅑🅞🅣`

      // 📤 Enviar mensaje
      await sock.sendMessage(chatId, {
        text: texto,
        contextInfo: {
          mentionedJid: pareja.map(p => p.jid)
        }
      })

      // 🎵 Enviar audio (NO rompe si falla)
      if (fs.existsSync(audioPath)) {
        await sock.sendMessage(chatId, {
          audio: { url: audioPath },
          mimetype: 'audio/mpeg',
          ptt: false
        })
      } else {
        console.error('❌ Audio amor.mp3 no encontrado:', audioPath)
      }

    } catch (error) {
      console.error('❌ Error en comando /pareja:', error)
      await sock.sendMessage(chatId, {
        text: '⚠️ *Ocurrió un error al ejecutar el comando.*'
      })
    }
  }
}
