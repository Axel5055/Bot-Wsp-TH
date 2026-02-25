module.exports = {
  name: 'menu',
  admin: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid

    const texto = `*🦊 SoNy BOT 🦊*

*📜 MENÚS DISPONIBLES*

🦊 *#mgeneral*  → \`Menú de Comandos generales\`  
🦊 *#meventos*  → \`Menú de Eventos (FDG, arena, etc.)\`  
🦊 *#mcaceria*  → \`Menú de Cacería/Evento Interno\`
🦊 *#mtodos*    → \`Menú de Menciones\`
🦊 *#marmaduras* → \`Menú de Armaduras\` 
🦊 *#mreportes* → \`Menú de Reportes\`
🦊 *#mescudos*  → \`Menú de Aviso de escudos\`
🦊 *#mcuentas*  → \`Menú de Multicuentas\`

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