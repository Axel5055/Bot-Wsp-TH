// commands/menus/menuArmaduras.js
module.exports = {
  name: 'marmaduras',
  admin: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid

    const texto = `🦊 *SoNy BOT*
━━━━━━━━━━━━━━━━━━━━━━━
🧬 *MENÚ ARMADURAS*
━━━━━━━━━━━━━━━━━━━━━━━

🗡️ *#infa*    → Armadura de Infantería
🏹 *#art*     → Armadura de Artillería
🐴 *#cab*     → Armadura de Caballería
⚔️ *#mix*     → Armadura Mixta
💎 *#joyas*   → Joyas para armaduras

━━━━━━━━━━━━━━━━━━━━━━━
💡 También puedes preguntarle directamente al bot:
_"Sony, ¿cuál es la armadura de infantería?"_

💡 Usa *#menu* para ver todos los menús
🅣🅗 — 🅑🅞🅣`

    try {
      await sock.sendMessage(chatId, { text: texto })
    } catch (error) {
      console.error('❌ Error en #marmaduras:', error)
      await sock.sendMessage(chatId, { text: '🚨 Ocurrió un error al mostrar el menú. Intenta más tarde.' })
    }
  }
}
