'use strict'

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
      await sock.sendMessage(chatId, { react: { text: '🏆', key: msg.key } })

      const sheet = getSheet(2)
      if (!sheet) {
        await sock.sendMessage(chatId, { text: '⚠️ No se encontró la hoja de ranking en el Excel.' })
        return
      }

      const data = xlsx.utils.sheet_to_json(sheet)
      if (!data.length) {
        await sock.sendMessage(chatId, { text: '⚠️ No hay datos en la hoja de ranking.' })
        return
      }

      const top    = data.sort((a, b) => (b.Total || 0) - (a.Total || 0)).slice(0, 10)
      const mes    = sheet['K2']?.v || 'Mes actual'
      const year   = moment().tz('America/Mexico_City').format('YYYY')
      const medals = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟']

      let txt = `━━━━━━━━━━━━━━━━━━━━━━━\n`
      txt    += `🏆 *TOP 10 CAZADORES DEL MES*\n`
      txt    += `📅 *${mes} ${year}*\n`
      txt    += `━━━━━━━━━━━━━━━━━━━━━━━\n`

      top.forEach((u, i) => {
        txt += `${medals[i]} *${u.Nombre}* — ${u.Total || 0} pts ${getRandomIcono()}\n`
      })

      txt += `━━━━━━━━━━━━━━━━━━━━━━━\n`
      txt += `🔥 ¡Sigan cazando y demostrando su habilidad! 💪\n\n`
      txt += `💡 Consulta tus stats con *#stats [nick]*\n\n`
      txt += `🅣🅗 — 🅑🅞🅣`

      await sock.sendMessage(chatId, { text: txt })

    } catch (error) {
      console.error('❌ Error en ranking:', error)
      await sock.sendMessage(chatId, { text: '⚠️ Ocurrió un error al ejecutar el comando. Intenta de nuevo.' })
    }
  },
}