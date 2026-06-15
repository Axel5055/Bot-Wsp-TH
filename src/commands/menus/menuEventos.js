// commands/menus/menuEventos.js
module.exports = {
  name: 'meventos',
  admin: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid

    const texto = `🦊 *SoNy BOT*
━━━━━━━━━━━━━━━━━━━━━━━
⚔️ *MENÚ EVENTOS*
━━━━━━━━━━━━━━━━━━━━━━━

🎪 *#fdg*     → Reglas de Fiesta de Gremio
🏟️ *#arena*   → Reglas de Arena Dragón
💥 *#caos*    → Reglas de Arena del Caos
🌍 *#wow*     → Reglas de WoW (War of Wars)

━━━━━━━━━━━━━━━━━━━━━━━
📊 Stats de FDG → *#mfdg*

💡 Usa *#menu* para ver todos los menús
🅣🅗 — 🅑🅞🅣`

    try {
      await sock.sendMessage(chatId, { text: texto })
    } catch (error) {
      console.error('❌ Error en #meventos:', error)
      await sock.sendMessage(chatId, { text: '🚨 Ocurrió un error al mostrar el menú. Intenta más tarde.' })
    }
  }
}
