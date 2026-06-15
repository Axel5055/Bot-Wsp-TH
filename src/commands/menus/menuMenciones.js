// commands/menus/menuMenciones.js
module.exports = {
  name: 'mtodos',
  admin: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid

    const texto = `🦊 *SoNy BOT*
━━━━━━━━━━━━━━━━━━━━━━━
📢 *MENÚ MENCIONES*
━━━━━━━━━━━━━━━━━━━━━━━

📢 *#all*           → Mencionar a todos en el grupo
💪 *#forta*         → Mencionar para fortalezas
⚔️ *#rally*         → Mencionar para rallys

━━━━━━━━━━━━━━━━━━━━━━━
💡 Usa *#menu* para ver todos los menús
🅣🅗 — 🅑🅞🅣`

    try {
      await sock.sendMessage(chatId, { text: texto })
    } catch (error) {
      console.error('❌ Error en #mtodos:', error)
      await sock.sendMessage(chatId, { text: '🚨 Ocurrió un error al mostrar el menú. Intenta más tarde.' })
    }
  }
}
