// commands/menus/menuFun.js  ← NUEVO
module.exports = {
  name: 'mfun',
  admin: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid

    const texto = `🦊 *SoNy BOT*
━━━━━━━━━━━━━━━━━━━━━━━
🎮 *MENÚ DIVERSIÓN*
━━━━━━━━━━━━━━━━━━━━━━━

💕 *#pareja*     → Descubre tu pareja del día
🌈 *#topgay*     → Ranking gay del día
🫂 *#caricias*   → Envía caricias a alguien

━━━━━━━━━━━━━━━━━━━━━━━
💡 Usa *#menu* para ver todos los menús
🅣🅗 — 🅑🅞🅣`

    try {
      await sock.sendMessage(chatId, { text: texto })
    } catch (error) {
      console.error('❌ Error en #mfun:', error)
      await sock.sendMessage(chatId, { text: '🚨 Ocurrió un error al mostrar el menú. Intenta más tarde.' })
    }
  }
}
