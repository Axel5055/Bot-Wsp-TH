// commands/menus/help.js — alias de #menu
module.exports = {
  name: 'help',
  admin: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid

    const texto = `🦊 *SoNy BOT*
━━━━━━━━━━━━━━━━━━━━━━━
📜 *MENÚS DISPONIBLES*
━━━━━━━━━━━━━━━━━━━━━━━

🗂️ *#mgeneral*   → Comandos generales
🏹 *#mcaceria*   → Cacería & Reportes
🛡️ *#mescudos*   → Sistema de Escudos
⚔️ *#meventos*   → Eventos del gremio
🎪 *#mfdg*       → Fiesta de Gremio
🧬 *#marmaduras* → Guías de Armaduras
👥 *#mcuentas*   → Multicuentas
📢 *#mtodos*     → Menciones grupales
💬 *#mmensajes*  → Mensajes del bot
🎮 *#mfun*       → Comandos de diversión

━━━━━━━━━━━━━━━━━━━━━━━
🅣🅗 — 🅑🅞🅣`

    try {
      await sock.sendMessage(chatId, { text: texto })
    } catch (error) {
      console.error('❌ Error en #help:', error)
      await sock.sendMessage(chatId, { text: '🚨 Ocurrió un error al mostrar el menú. Intenta más tarde.' })
    }
  }
}
