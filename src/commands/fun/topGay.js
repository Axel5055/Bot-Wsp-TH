// ========================
// 🔀 Mezclar array
// ========================
function shuffleArray(array) {
  return array
    .map(v => ({ v, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .map(o => o.v)
}

module.exports = {
  name: 'topgay',
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

      // ✅ Obtener metadata del grupo
      let metadata
      try {
        metadata = await sock.groupMetadata(chatId)
      } catch (err) {
        console.error('❌ No se pudo obtener metadata:', err)
        return await sock.sendMessage(chatId, {
          text: '⚠️ No pude obtener información del grupo.'
        })
      }

      let participants = metadata.participants.map(p => p.id)

      if (!participants.length) {
        return await sock.sendMessage(chatId, {
          text: '⚠️ No hay miembros en el grupo.'
        })
      }

      // 🔀 Mezclar y tomar top 10
      participants = shuffleArray(participants).slice(0, 10)

      // 🎲 Generar porcentajes aleatorios ordenados
      const porcentajes = participants
        .map(() => Math.floor(Math.random() * 101))
        .sort((a, b) => b - a)

      // 🧾 Construir mensaje
      let texto = '*🌈 TOP 10 MÁS GAY DEL GRUPO 🌈*\n\n'
      texto += '📊 Resultados de la prestigiosa *Gay Machine 3000™* 🏳️‍🌈😂\n\n'

      const mentions = []

      participants.forEach((jid, i) => {
        const tag = jid.split('@')[0]
        const porcentaje = porcentajes[i]
        const trophy = i === 0 ? ' 🏆' : ''

        mentions.push(jid)
        texto += `${i + 1}. @${tag} - ${porcentaje}% 🏳️‍🌈${trophy}\n`
      })

      texto += '\n🏳️‍🌈 Cálculo oficial realizado por la *Gay Machine 3000™*.\n\n🅣🅗 - 🅑🅞🅣'

      // 📤 Enviar mensaje con menciones
      await sock.sendMessage(chatId, {
        text: texto,
        contextInfo: { mentionedJid: mentions }
      })

    } catch (error) {
      console.error('❌ Error ejecutando /topgay:', error)
      await sock.sendMessage(chatId, {
        text: '🚨 Ocurrió un error ejecutando el comando.'
      })
    }
  }
}
