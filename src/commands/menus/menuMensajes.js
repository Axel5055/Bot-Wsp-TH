// commands/menus/menuMensajes.js  ← NUEVO
module.exports = {
  name: 'mmensajes',
  admin: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid

    const texto = `🦊 *SoNy BOT*
━━━━━━━━━━━━━━━━━━━━━━━
💬 *MENÚ MENSAJES*
━━━━━━━━━━━━━━━━━━━━━━━

📤 *#mensajes*              → Ver IDs disponibles
📤 *#mensajes [ID]*         → Enviar un mensaje por su ID
📄 *#listmensajes*          → Lista de mensajes con título y ID

─────────────────────────
_Solo mensajeros/admins:_
➕ *#addmensaje [Titulo, Texto]*   → Agregar mensaje
✏️ *#editmensaje [ID | Texto]*    → Editar mensaje
🗑️ *#delmensaje [ID]*            → Eliminar mensaje

━━━━━━━━━━━━━━━━━━━━━━━
📚 *#helpmensajes*          → Guía completa

💡 Usa *#menu* para ver todos los menús
🅣🅗 — 🅑🅞🅣`

    try {
      await sock.sendMessage(chatId, { text: texto })
    } catch (error) {
      console.error('❌ Error en #mmensajes:', error)
      await sock.sendMessage(chatId, { text: '🚨 Ocurrió un error al mostrar el menú. Intenta más tarde.' })
    }
  }
}
