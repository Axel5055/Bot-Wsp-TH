// commands/menus/menuMobs.js
module.exports = {
  name: 'mobs',
  admin: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid

    const texto = `🦊 *SoNy BOT*
━━━━━━━━━━━━━━━━━━━━━━━
🐾 *MENÚ MOBS*
━━━━━━━━━━━━━━━━━━━━━━━

#abeja      #alaescarcha   #alanegra
#apetito    #araña         #ballena
#bestia     #buho          #caballo
#chaman     #gargantua     #gorila
#grifo      #jade          #lamuerte
#megalarva  #moai          #necrosis
#noceros    #rugido        #saberfang
#serpiente  #terrospin     #titan

━━━━━━━━━━━━━━━━━━━━━━━
💡 Escribe el comando para ver puntos y detalles del mob
💡 Usa *#menu* para ver todos los menús
🅣🅗 — 🅑🅞🅣`

    try {
      await sock.sendMessage(chatId, { text: texto })
    } catch (error) {
      console.error('❌ Error en #mobs:', error)
      await sock.sendMessage(chatId, { text: '🚨 Ocurrió un error al mostrar el menú. Intenta más tarde.' })
    }
  }
}
