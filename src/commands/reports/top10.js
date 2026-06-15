'use strict'

const { getSheet } = require('../../cache/excelCache')
const xlsx = require('xlsx')
const moment = require('moment-timezone')
const { getRandomIcono } = require('../../utils/caceriaUtils')

module.exports = {
  name: 'top10',
  keywords: ['top 10'],
  admin: false,

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid

    try {
      await sock.sendMessage(chatId, { react: { text: '🏅', key: msg.key } })

      const sheet = getSheet(0)
      if (!sheet) {
        await sock.sendMessage(chatId, { text: '⚠️ No se encontró la hoja de Top 10 semanal en el Excel.' })
        return
      }

      const data = xlsx.utils.sheet_to_json(sheet, { range: 2 })
      if (!data.length) {
        await sock.sendMessage(chatId, { text: '⚠️ No hay datos en la hoja de Top 10.' })
        return
      }

      const fechaReporte = data.find(u => u['Fecha Reporte'])?.['Fecha Reporte']
        || moment().tz('America/Mexico_City').format('DD/MM/YYYY')

      const medals = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟']

      const top = data
        .filter(u => u['Nombre'])
        .sort((a, b) => Number(b['Puntos Nvl 2'] ?? 0) - Number(a['Puntos Nvl 2'] ?? 0))
        .slice(0, 10)

      let txt = `━━━━━━━━━━━━━━━━━━━━━━━\n`
      txt    += `👏 *TOP 10 CAZADORES DE LA SEMANA*\n`
      txt    += `━━━━━━━━━━━━━━━━━━━━━━━\n`

      top.forEach((u, i) => {
        txt += `${medals[i]} *${u['Nombre']}* — ${Number(u['Puntos Nvl 2'] ?? 0)} pts | 🏹 ${Number(u['Total'] ?? 0)} mobs ${getRandomIcono()}\n`
      })

      txt += `━━━━━━━━━━━━━━━━━━━━━━━\n`
      txt += `📅 Semana del: *${fechaReporte}*\n\n`
      txt += `💡 Consulta tus stats con *#stats [nick]*\n\n`
      txt += `🅣🅗 — 🅑🅞🅣`

      await sock.sendMessage(chatId, { text: txt })

    } catch (error) {
      console.error('❌ Error en top10:', error)
      await sock.sendMessage(chatId, { text: '⚠️ Ocurrió un error al ejecutar el comando. Intenta de nuevo.' })
    }
  },
}