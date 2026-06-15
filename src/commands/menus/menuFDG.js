// commands/menus/menuFDG.js
module.exports = {
  name: 'mfdg',
  admin: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid

    const texto = `🦊 *SoNy BOT*
━━━━━━━━━━━━━━━━━━━━━━━
🎪 *MENÚ FDG — FIESTA DE GREMIO*
━━━━━━━━━━━━━━━━━━━━━━━

📖 *#fdg*                    → Reglas del evento
📊 *#fdgresumen*             → Estadísticas generales
🏆 *#fdgtop*                 → Top 3 con mejor puntaje y premios
🔍 *#fdgstats [Nick]*        → Stats individuales de un jugador

━━━━━━━━━━━━━━━━━━━━━━━
📚 *#helpfdg*                → Guía de uso con ejemplos

💡 Usa *#menu* para ver todos los menús
🅣🅗 — 🅑🅞🅣`

    try {
      await sock.sendMessage(chatId, { text: texto })
    } catch (error) {
      console.error('❌ Error en #mfdg:', error)
      await sock.sendMessage(chatId, { text: '🚨 Ocurrió un error al mostrar el menú. Intenta más tarde.' })
    }
  }
}
