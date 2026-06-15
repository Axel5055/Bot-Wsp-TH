// commands/menus/menuCaza.js
module.exports = {
  name: 'mcaceria',
  admin: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid

    const texto = `🦊 *SoNy BOT*
━━━━━━━━━━━━━━━━━━━━━━━
🏹 *MENÚ CACERÍA & REPORTES*
━━━━━━━━━━━━━━━━━━━━━━━

📖 *INFORMACIÓN*
🏹 *#caza*                    → Reglas de cacería
🎯 *#evento*                  → Evento mensual interno

━━━━━━━━━━━━━━━━━━━━━━━
📊 *STATS SEMANALES*
🔎 *#stats [Nick]*            → Perfil completo de un cazador
📊 *#resumen*                 → Resumen general de la semana
🏅 *#top10*                   → Top 10 cazadores de la semana
❌ *#nocumplieron*            → Miembros que no alcanzaron la meta
😴 *#inactivos*               → Miembros con 0 mobs esta semana

━━━━━━━━━━━━━━━━━━━━━━━
🗓️ *STATS DEL MES*
🏆 *#ranking*                 → Top 10 cazadores del mes
📜 *#smes [Nick]*             → Historial mensual de un cazador

━━━━━━━━━━━━━━━━━━━━━━━
🐾 *#mobs*                    → Lista de mobs disponibles

━━━━━━━━━━━━━━━━━━━━━━━
💡 Usa *#menu* para ver todos los menús
🅣🅗 — 🅑🅞🅣`

    try {
      await sock.sendMessage(chatId, { text: texto })
    } catch (error) {
      console.error('❌ Error en #mcaceria:', error)
      await sock.sendMessage(chatId, { text: '🚨 Ocurrió un error al mostrar el menú. Intenta más tarde.' })
    }
  }
}
