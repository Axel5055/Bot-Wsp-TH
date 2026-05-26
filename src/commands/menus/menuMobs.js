module.exports = {
  name: 'mobs',
  admin: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid

    const texto = `*🦊 SoNy BOT 🦊*

*📜 MENÚ MOBS*

🦊 > *#abeja*
🦊 > *#alaescarcha*
🦊 > *#alanegra*
🦊 > *#apetito*
🦊 > *#ballena*
🦊 > *#bestia*
🦊 > *#buho*
🦊 > *#chaman*
🦊 > *#araña*
🦊 > *#gargantua*
🦊 > *#gorila*
🦊 > *#grifo*
🦊 > *#jade*
🦊 > *#megalarva*
🦊 > *#moai*
🦊 > *#lamuerte*
🦊 > *#necrosis*
🦊 > *#noceros*
🦊 > *#rugido*
🦊 > *#saberfang*
🦊 > *#serpiente*
🦊 > *#terrospin*
🦊 > *#titan*
🦊 > *#caballo*

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