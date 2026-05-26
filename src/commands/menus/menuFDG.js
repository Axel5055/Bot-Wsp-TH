module.exports = {
  name: 'mfdg',
  admin: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid

    const texto = `*🦊 SoNy BOT 🦊*

*📜 MENÚ FDG*

🦊 > *#fdg*  → \`Reglas del evento\`
🦊 > *#fgeneral*  → \`Estadisticas genrales de FDG\`  
🦊 > *#fdgtop*  → \`Top 3 con mejor puntaje\`
🦊 > *#fdgstats [Nombre]*  → \`Ver estadísticas de un jugador\`
🦊 > *#helpfdg*  → \`Ejemplos de como usa los comandos\`

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