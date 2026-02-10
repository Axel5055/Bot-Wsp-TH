const { getSheet } = require('../../cache/excelCache')
const xlsx = require('xlsx')
const { getRandomIcono } = require('../../utils/caceriaUtils')

module.exports = {
  name: 'top10',
  admin: false,

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid

    try {
      // 🧠 hoja Top 10 semanal (índice 1)
      const sheet = getSheet(1)

      if (!sheet) {
        await sock.sendMessage(chatId, {
          text: '*⚠️ No se encontró la hoja de Top 10 semanal.*',
        })
        return
      }

      const data = xlsx.utils.sheet_to_json(sheet)
      const fechaReporte = sheet['E2']?.v || 'Fecha desconocida'

      const top = data
        .sort((a, b) => (b.Puntos || 0) - (a.Puntos || 0))
        .slice(0, 10)

      const medals = ['🥇','🥈','🥉','🏅','🏅','🏅','🏅','🏅','🏅','🏅']

      let txt = `👏 ¡Felicidades a los *10 Mejores Cazadores de la Semana*! 👏\n\n`

      top.forEach((u, i) => {
        txt += `${i + 1}. ${medals[i]} *${u.Nombre}:* ${u.Puntos || 0} Pts / ${u.Total || 0} Mobs ${getRandomIcono()}\n`
      })

      txt += `\n📅 *Fecha de Caza:* ${fechaReporte}\n\n🅣🅗 — 🅑🅞🅣`

      await sock.sendMessage(chatId, { text: txt })
    } catch (error) {
      console.error('❌ Error en /top10:', error)
      await sock.sendMessage(chatId, {
        text: '⚠️ Error ejecutando top10.',
      })
    }
  },
}
