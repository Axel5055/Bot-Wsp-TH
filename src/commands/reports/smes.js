'use strict'

const xlsx = require('xlsx')
const {
  getText,
  normalizarTexto,
  getMesActual,
} = require('../../utils/caceriaUtils')
const { getSheet } = require('../../cache/excelCache')

module.exports = {
  name: 'smes',
  admin: false,

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid
    const body   = getText(msg).trim()
    const args   = body.split(/\s+/).slice(1)

    if (!args.length) {
      await sock.sendMessage(chatId, {
        text:
          `⚠️ *Uso correcto:*\n` +
          `\`#smes Nombre\`\n\n` +
          `*Ejemplo:*\n` +
          `\`#smes Juan Perez\``,
      })
      return
    }

    try {
      await sock.sendMessage(chatId, { react: { text: '📅', key: msg.key } })

      const sheet = getSheet('Ranking Evento')
      if (!sheet) {
        await sock.sendMessage(chatId, {
          text: '⚠️ No se encontró la hoja *"Ranking Evento"* en el Excel.',
        })
        return
      }

      const data   = xlsx.utils.sheet_to_json(sheet, { header: 'A', defval: 0 })
      const nombre = normalizarTexto(args.join(' '))
      const u      = data.find(r => normalizarTexto(r.C) === nombre)

      if (!u) {
        await sock.sendMessage(chatId, {
          text:
            `❌ No se encontraron estadísticas para *"${args.join(' ')}"*.\n\n` +
            `💡 Verifica que el nombre esté escrito igual que en el Excel.`,
        })
        return
      }

      const semanas      = [u.D, u.E, u.F, u.G, u.H].map(n => Number(n) || 0)
      const total        = semanas.reduce((a, b) => a + b, 0)
      const mejorSemana  = Math.max(...semanas)
      const semanasActivas = semanas.filter(v => v > 0).length

      // Barra visual del total (sobre 175 pts — 5 semanas × 35)
      const metaTotal = 175
      const progreso  = Math.min(1, total / metaTotal)
      const bloques   = 10
      const llenos    = Math.round(progreso * bloques)
      const barra     = '█'.repeat(llenos) + '░'.repeat(bloques - llenos)

      let txt = `━━━━━━━━━━━━━━━━━━━━━━━\n`
      txt    += `📅 *ESTADÍSTICAS MENSUALES*\n`
      txt    += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`

      txt    += `👤 *${u.C}*\n`
      txt    += `📆 Mes: *${getMesActual()}*\n\n`

      txt    += `📊 *Desglose semanal:*\n`
      semanas.forEach((v, i) => {
        const icono = v >= 35 ? '✅' : v > 0 ? '⚠️' : '❌'
        txt += `   ${icono} Semana ${i + 1}: *${v} pts*\n`
      })

      txt    += `\n${barra} ${((progreso) * 100).toFixed(0)}%\n`
      txt    += `🔥 *Total del mes: ${total} pts*\n\n`

      txt    += `📈 Mejor semana: *${mejorSemana} pts*\n`
      txt    += `📌 Semanas activas: *${semanasActivas}/5*\n`

      txt    += `\n━━━━━━━━━━━━━━━━━━━━━━━\n`
      txt    += `🅣🅗 — 🅑🅞🅣`

      await sock.sendMessage(chatId, { text: txt })

    } catch (error) {
      console.error('❌ Error en smes:', error)
      await sock.sendMessage(chatId, {
        text: '⚠️ Ocurrió un error al consultar las estadísticas. Intenta de nuevo.',
      })
    }
  },
}
