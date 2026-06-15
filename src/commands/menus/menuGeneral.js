// commands/menus/menuGeneral.js
module.exports = {
  name: 'mgeneral',
  admin: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid

    const texto = `🦊 *SoNy BOT*
━━━━━━━━━━━━━━━━━━━━━━━
🗂️ *MENÚ GENERAL*
━━━━━━━━━━━━━━━━━━━━━━━

📜 *#reglas*           → Reglas del gremio y grupo
🏹 *#caza*             → Reglas de cacería semanal
🎯 *#evento*           → Evento interno del mes
📅 *#calendario*       → Calendario de eventos 2026
🕐 *#hora [país]*      → Hora actual de cualquier país LATAM
🔍 *#kinfo [reino]*    → Info general de un reino

━━━━━━━━━━━━━━━━━━━━━━━
💡 Usa *#menu* para ver todos los menús
🅣🅗 — 🅑🅞🅣`

    try {
      await sock.sendMessage(chatId, { text: texto })
    } catch (error) {
      console.error('❌ Error en #mgeneral:', error)
      await sock.sendMessage(chatId, { text: '🚨 Ocurrió un error al mostrar el menú. Intenta más tarde.' })
    }
  }
}
