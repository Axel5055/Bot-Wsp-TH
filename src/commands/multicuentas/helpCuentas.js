'use strict'

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
🦊 \`#addcuentas TuNombre\`
Registro *automático* — el bot busca tu número en el Excel y registra todas tus cuentas de una vez. También registra tus escudos automáticamente.

*Ejemplo:*
\`#addcuentas Axel\`

─────────────────────
🦊 \`#addcuentas TuNombre ID1,ID2\`
Registro *manual* — si tu número no está en el Excel, indica tus IGG IDs directamente.

*Ejemplo:*
\`#addcuentas Axel 123456789,987654321\`

> Los IDs deben existir en el Excel de Cacería.
> Solo puedes tener un registro a tu nombre.
> El registro automático también registra tus escudos.

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
Sincroniza los nombres de tus cuentas con el Excel de Cacería.
Si algún nombre cambió en el Excel, se actualiza automáticamente tanto en multicuentas como en escudos.

> Admins pueden omitir el nombre para actualizar todos.

━━━━━━━━━━━━━━━━━━━━
📊 *REPORTE COMPLETO* _(Solo admins)_
━━━━━━━━━━━━━━━━━━━━
🦊 \`#reportecuentas\`
Genera un reporte con todos los jugadores y sus cuentas ordenadas A-Z.

━━━━━━━━━━━━━━━━━━━━
⚠️ *REGLAS*
━━━━━━━━━━━━━━━━━━━━
- Los IDs deben existir en el Excel de Cacería.
- No se permiten IDs duplicados entre usuarios.
- Cada usuario solo puede tener un registro.
- Solo admins pueden registrar/editar cuentas ajenas con @menciones.

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