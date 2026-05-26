module.exports = {
  name: 'marmaduras',
  admin: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid

    const texto = `*🦊 SoNy BOT 🦊*

*📜 MENÚ ARMADURAS*

🦊 > *#infa*  → \`Armadura de Infantería\`  
🦊 > *#art*  → \`Armadura de Artillería\`  
🦊 > *#cab*  → \`Armadura de Caballería\`
🦊 > *#mix*    → \`Armadura de Mixta\`
🦊 > *#joyas* → \`Joyas de Armaduras\` 

**Nota:* Puedes pedir a Sony (bot de whatsapp) el tipo de armadura que prefieras; Ejem: \`Sony cual es la armadura de infanteria\` 

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