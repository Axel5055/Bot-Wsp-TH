const xlsx = require('xlsx')
const moment = require('moment-timezone')
const { getRandomIcono } = require('../../utils/caceriaUtils')
const { getSheet } = require('../../cache/excelCache')

module.exports = {
  name: 'ranking',
  admin: false,

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid

    try {
      // 🔥 Excel desde memoria
      const sheet = getSheet(3)

      if (!sheet) {
        await sock.sendMessage(chatId, {
          text: '*⚠️ No se encontró la hoja de ranking.*',
        })
        return
      }

      const data = xlsx.utils.sheet_to_json(sheet)

      const top = data
        .sort((a, b) => (b.Total || 0) - (a.Total || 0))
        .slice(0, 10)

      const mes = sheet['J1']?.v || 'Mes desconocido'
      const year = moment().tz('America/Mexico_City').format('YYYY')
      const medals = ['🥇','🥈','🥉','🏅','🏅','🏅','🏅','🏅','🏅','🏅']

      let txt = `🏆 *¡Ranking de los 10 Mejores Cazadores del Mes!* 🏆\n\n`

      top.forEach((u, i) => {
        txt += `${i + 1}. ${medals[i]} *${u.Nombre}:* ${u.Total || 0} Pts ${getRandomIcono()}\n`
      })

      txt += `\n🌟 *El mejor cazador del mes podra elegir entre:*\n- *499 Diamantes.*\n- *1 Full Bank*\n- *100K de Gemas*\n\n`
      txt += `*Evento de Cacería - Mes de ${mes} ${year}*\n`
      txt += `\n🔥 ¡Sigan cazando y demostrando su habilidad! 💪\n\n🅣🅗 — 🅑🅞🅣`

      await sock.sendMessage(chatId, { text: txt })
    } catch (error) {
      console.error('❌ Error en /ranking:', error)
      await sock.sendMessage(chatId, {
        text: '⚠️ Error ejecutando ranking.',
      })
    }
  },
}
