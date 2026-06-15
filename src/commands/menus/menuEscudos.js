// commands/menus/menuEscudos.js  ← NUEVO
module.exports = {
  name: 'mescudos',
  admin: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid

    const texto = `🦊 *SoNy BOT*
━━━━━━━━━━━━━━━━━━━━━━━
🛡️ *MENÚ ESCUDOS*
━━━━━━━━━━━━━━━━━━━━━━━

🛡️ *#escudo [Nick/ID]*       → Alertar escudo caído de un jugador
👁️ *#miescudo*               → Ver tus cuentas y escudo activo
📋 *#listescudos*             → Ver todos los jugadores registrados

─────────────────────────
✏️ *GESTIÓN DE REGISTRO*
➕ *#addescudo [Nick, ID]*    → Registrarse manualmente
✏️ *#editescudo [ID, datos]*  → Editar tu registro
🗑️ *#delescudo*              → Eliminar tu registro

─────────────────────────
⏱️ *ESCUDO ACTIVO*
🛡️ *#ponescudo [tipo]*       → Registrar escudo activo
_Tipos: 4h · 8h · 12h · 24h · 3d · 7d · 14d_

━━━━━━━━━━━━━━━━━━━━━━━
📚 *#helpescudos*            → Guía completa con ejemplos

💡 Usa *#menu* para ver todos los menús
🅣🅗 — 🅑🅞🅣`

    try {
      await sock.sendMessage(chatId, { text: texto })
    } catch (error) {
      console.error('❌ Error en #mescudos:', error)
      await sock.sendMessage(chatId, { text: '🚨 Ocurrió un error al mostrar el menú. Intenta más tarde.' })
    }
  }
}
