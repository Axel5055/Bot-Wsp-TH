'use strict'

const xlsx = require('xlsx')
const moment = require('moment-timezone')
const { getSheet } = require('../../cache/excelCache')
const { getConfig } = require('../../config/fdgConfig')

module.exports = {
  name: 'fdgtop',
  admin: false,

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid

    try {
      await sock.sendMessage(chatId, { react: { text: '🏆', key: msg.key } })

      const sheet = getSheet('FDG')
      if (!sheet) {
        await sock.sendMessage(chatId, {
          text: '⚠️ No se encontró la hoja *FDG* en el Excel.',
        })
        return
      }

      const data = xlsx.utils.sheet_to_json(sheet)
      if (!data.length) {
        await sock.sendMessage(chatId, {
          text: '⚠️ La hoja *FDG* está vacía.',
        })
        return
      }

      const config  = getConfig()
      const premios = config.premios || {}

      const top3   = data
        .sort((a, b) => (Number(b['Puntos']) || 0) - (Number(a['Puntos']) || 0))
        .slice(0, 3)

      const medals = ['🥇', '🥈', '🥉']
      const fecha  = data[0]['Fecha de Reporte'] || 'Semana actual'

      let txt = `━━━━━━━━━━━━━━━━━━━━━━━\n`
      txt    += `🏆 *TOP 3 — FIESTA DE GREMIO*\n`
      txt    += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`

      top3.forEach((p, i) => {
        const nombre   = p['Nombre'] || 'Jugador'
        const puntos   = Number(p['Puntos']) || 0
        const comp     = p['Misiones completadas'] || 0
        const tom      = p['Misiones tomadas'] || 0
        const pct      = tom > 0 ? ((comp / tom) * 100).toFixed(0) : 0
        const premio   = premios[i + 1] || 'Sin premio definido'

        txt += `${medals[i]} *${nombre}*\n`
        txt += `   ⭐ Puntos: *${puntos}*\n`
        txt += `   📜 Misiones: ${comp}/${tom} (${pct}%)\n`
        txt += `   🎁 Premio: *${premio}*\n\n`
      })

      txt += `🔥 ¡Felicitaciones a los mejores del evento!\n\n`
      txt += `📅 ${fecha}\n`
      txt += `🅣🅗 — 🅑🅞🅣`

      await sock.sendMessage(chatId, { text: txt })

    } catch (error) {
      console.error('❌ Error en fdgtop:', error)
      await sock.sendMessage(chatId, {
        text: '⚠️ Ocurrió un error al ejecutar el comando. Intenta de nuevo.',
      })
    }
  },
}
