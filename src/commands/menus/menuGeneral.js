module.exports = {
  name: 'mgeneral',
  admin: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid

    const texto = `*🦊 SoNy BOT 🦊*

*📜 MENÚ GENERAL*

🦊 > *#reglas*  → \`Reglas del Grupo y Gremio\`  
🦊 > *#kinfo [reino]*  → \`Obten información General de un Reino\`
🦊 > *#calendario*  → \`Calendario de eventos de todo 2026\`
🦊 > *#formaciones*  → \`Formaciones para WOW\`

🅣🅗 - 🅑🅞🅣
`
    try {
      await sock.sendMessage(chatId, {
        text: texto
      })
    } catch (error) {
      console.error('❌ Error en comando #menu:', error)

      await sock.sendMessage(chatId, {
        text: '🚨 Ocurrió un error al mostrar el menú. Intenta más tarde.'
      })
    }
  }
}