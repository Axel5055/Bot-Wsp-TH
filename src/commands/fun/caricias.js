// ==========================
// 🎲 UTILIDADES
// ==========================
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

module.exports = {
  name: 'caricias',
  admin: false,

  execute: async (sock, msg, args) => {
    const chatId = msg.key.remoteJid

    try {
      // ✅ Solo grupos
      if (!chatId.endsWith('@g.us')) {
        return await sock.sendMessage(chatId, {
          text: '❌ Este comando solo funciona en grupos.'
        })
      }

      const mentions =
        msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []

      let targetText = null
      let targetMentions = []

      // 🧍‍♂️ Prioridad: mención real
      if (mentions.length > 0) {
        const target = mentions[0]
        targetText = `@${target.split('@')[0]}`
        targetMentions = [target]
      } else if (args.length > 0) {
        // 📝 Argumento manual (/caricias Axel)
        targetText = `@${args.join(' ')}`
      } else {
        return await sock.sendMessage(chatId, {
          text: '⚠️ *Debes indicar a quién van las caricias.*\n👉 Ejemplo: `/caricias @Toxic` o `/caricias Toxic`'
        })
      }

      // 💋 Reacción
      await sock.sendMessage(chatId, {
        react: { text: '💋', key: msg.key }
      })

      // 📊 Stats aleatorios
      const stats = {
        besos: randomInt(0, 5),
        buenosDias: randomInt(0, 5),
        salidas: randomInt(0, 3),
        hotel: randomInt(0, 2),
        sexoViolento: randomInt(0, 4)
      }

      // ✨ Mensaje
      let response =
        `👋 ¡Hola, ${targetText}! 👋\n\n` +
        `⚠️ Tu *estatus de caricias y apapachos* está en rojo ⚠️\n\n` +
        `🛑 Debe colocarse al día con el *LÍDER*\n\n`

      response += `🔹 *Besos:* ${stats.besos} 💋\n`
      response += `🔹 *Mensajes de buenos días:* ${stats.buenosDias} 🌞\n`
      response += `🔹 *Salidas:* ${stats.salidas} 🍹\n`
      response += `🔹 *Hotel:* ${stats.hotel} 🏨\n`
      response += `🔹 *Sexo violento:* ${stats.sexoViolento} 🔥\n\n`
      response += `📌 *Mínimo 1 de cada una a la semana*\n\n🅣🅗 - 🅑🅞🅣`

      // 📤 Enviar mensaje
      await sock.sendMessage(chatId, {
        text: response,
        contextInfo: { mentionedJid: targetMentions }
      })

    } catch (error) {
      console.error('❌ Error en comando /caricias:', error)
      await sock.sendMessage(chatId, {
        text: '⚠️ Ocurrió un error al generar las caricias.'
      })
    }
  }
}
