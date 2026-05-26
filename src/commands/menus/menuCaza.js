module.exports = {
  name: 'mcaceria',
  admin: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid

    const texto = `*🦊 SoNy BOT 🦊*

*📜 MENÚ CACERÍA*

🦊 > *#caza*  → \`Reglas de Cacería\`  
🦊 > *#evento*  → \`Evento Mensual Interno\`  
🦊 > *#mobs*  → \`Menú de Mobs\`
🦊 > *#stats [NickName]*    → \`Estadisticas de Cacería Individual\`
🦊 > *#sgeneral* → \`Estadisticas de Cacería General de la semana\`
🦊 > *#top10* → \`Top 10 de los Mejores Cazadores de la Semana\`
🦊 > *#ranking* → \`Ranking de los Mejores Cazadores del Mes\`
🦊 > *#smes* → \`Estadisticas Generales de Cacería del Mes\`

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