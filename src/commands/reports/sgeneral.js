const { getSheet } = require('../../cache/excelCache')

module.exports = {
  name: 'sgeneral',
  admin: false,

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid

    try {
      // 🧠 Hoja desde cache (índice 2)
      const sheet = getSheet(0)

      if (!sheet) {
        await sock.sendMessage(chatId, {
          text: '⚠️ No se encontró la hoja de estadísticas generales.',
        })
        return
      }

      const total = sheet['E1']?.v || 0
      const niveles = ['F1', 'G1', 'H1', 'I1', 'J1'].map(
        c => sheet[c]?.v || 0
      )
      const fecha = sheet['N4']?.v || 'Fecha desconocida'

      const txt = `👋 *¡Hola, cazadores!* 👋

📊 *Estadísticas Generales de Cacería*

🧮 *Total de Caza:* ${total} mobs

🔹 *L1:* ${niveles[0]} 🐰
🔹 *L2:* ${niveles[1]} 🐺
🔹 *L3:* ${niveles[2]} 🐲
🔹 *L4:* ${niveles[3]} 🐧
🔹 *L5:* ${niveles[4]} 🐯

📅 *Fecha del reporte:* ${fecha}

🅣🅗 — 🅑🅞🅣`

      await sock.sendMessage(chatId, { text: txt })
    } catch (error) {
      console.error('❌ Error en /sgeneral:', error)
      await sock.sendMessage(chatId, {
        text: '⚠️ Ocurrió un error al obtener las estadísticas de cacería.',
      })
    }
  },
}
