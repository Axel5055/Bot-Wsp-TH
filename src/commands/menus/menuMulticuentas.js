module.exports = {
  name: 'mcuentas',
  admin: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid

    const texto = `*🦊 SoNy BOT 🦊*

*📜 MENÚ MULTICUENTAS*

🦊 > *#addcuentas* → \`Registrar nuevas cuentas usando IGG ID\`
🦊 > *#editcuentas* → \`Agregar, quitar o reemplazar IDs registrados\`
🦊 > *#listcuentas* → \`Ver usuarios registrados o detalle de cuentas\`
🦊 > *#refreshcuentas* → \`Actualizar nombres de cuentas desde Excel\`
🦊 > *#helpcuentas* → \`Guía detallada de como usar los comandos\`

🅣🅗 - 🅑🅞🅣
`
    try {
      await sock.sendMessage(chatId, {
        text: texto
      })
    } catch (error) {
      console.error('❌ Error en comando #menu:', error)

      await sock.sendMessage(chatId, {
        text: '🚨 Ocurrió un error al mostrar el menú. Intenta más tarde.'
      })
    }
  }
}