'use strict'

// ─── Comando ──────────────────────────────────────────────────────────────────
module.exports = {
  name: 'helpcuentas',
  admin: false,
  description: 'Muestra la guía completa del sistema de multicuentas',

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid

    const texto = `🦊 *SoNy BOT — Multicuentas*

━━━━━━━━━━━━━━━━━━━━
📌 *REGISTRAR CUENTAS*
━━━━━━━━━━━━━━━━━━━━
🦊 \`#addcuentas Nombre ID1,ID2\`
Registra tus cuentas con los IGG IDs.

*Ejemplo:*
\`#addcuentas Axel 123456789,987654321\`

> Solo puedes tener un registro a tu nombre.
> Los IDs deben existir en el Excel de Cacería.

━━━━━━━━━━━━━━━━━━━━
📋 *VER USUARIOS*
━━━━━━━━━━━━━━━━━━━━
🦊 \`#listcuentas\`
Muestra todos los usuarios registrados.

🦊 \`#listcuentas Nombre\`
Muestra el detalle de un usuario en concreto.

*Ejemplo:*
\`#listcuentas Axel\`

━━━━━━━━━━━━━━━━━━━━
✏️ *EDITAR CUENTAS*
━━━━━━━━━━━━━━━━━━━━
🦊 \`#editcuentas Nombre +ID1,ID2\` — Agregar IDs
🦊 \`#editcuentas Nombre -ID1,ID2\` — Eliminar IDs
🦊 \`#editcuentas Nombre =ID1,ID2\` — Reemplazar todos

*Ejemplo:*
\`#editcuentas Axel +111222333\`

━━━━━━━━━━━━━━━━━━━━
🔄 *ACTUALIZAR NOMBRES*
━━━━━━━━━━━━━━━━━━━━
🦊 \`#refreshcuentas TuNombre\`
Sincroniza los nombres de tus cuentas con el Excel.

> Admins pueden omitir el nombre para actualizar todos.

━━━━━━━━━━━━━━━━━━━━
⚠️ *REGLAS*
━━━━━━━━━━━━━━━━━━━━
• Los IDs deben existir en el Excel de Cacería.
• No se permiten IDs duplicados entre usuarios.
• Cada usuario solo puede tener un registro.
• Solo admins pueden registrar/editar cuentas ajenas con @menciones.

🦊 Usa *#helpcuentas* para ver esta guía nuevamente.
🅣🅗 — 🅑🅞🅣`

    try {
      await sock.sendMessage(chatId, { react: { text: '📚', key: msg.key } })
      await sock.sendMessage(chatId, { text: texto })
    } catch (error) {
      console.error('❌ [helpcuentas] Error:', error)
      await sock.sendMessage(chatId, {
        text: '🚨 Ocurrió un error al mostrar la ayuda. Intenta más tarde.'
      })
    }
  }
}
