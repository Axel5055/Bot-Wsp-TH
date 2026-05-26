'use strict'

const xlsx = require('xlsx')
const { getSheet } = require('../../cache/excelCache')
const { getConfig } = require('../../config/fdgConfig')

module.exports = {
  name: 'fdgstats',
  admin: false,

  async execute(sock, msg, args) {
    const chatId = msg.key.remoteJid

    try {
      if (!args || !args.length) {
        await sock.sendMessage(chatId, {
          text:
            `⚠️ *Uso correcto:*\n` +
            `\`#fdgstats Nombre\`\n\n` +
            `*Ejemplo:*\n` +
            `\`#fdgstats Axel\``,
        })
        return
      }

      await sock.sendMessage(chatId, { react: { text: '📊', key: msg.key } })

      const sheet = getSheet('FDG')
      if (!sheet) {
        await sock.sendMessage(chatId, {
          text: '⚠️ No se encontró la hoja *FDG* en el Excel.',
        })
        return
      }

      const data = xlsx.utils.sheet_to_json(sheet)
      const config = getConfig()
      const puntajeMinimo = Number(config.puntajeMinimo) || 0

      const nombreBuscado = args.join(' ').toLowerCase().trim()
      const jugador = data.find(
        p => String(p['Nombre'] || '').toLowerCase().trim() === nombreBuscado
      )

      if (!jugador) {
        await sock.sendMessage(chatId, {
          text:
            `❌ No se encontró al jugador *"${args.join(' ')}"*.\n\n` +
            `💡 Verifica que el nombre esté escrito igual que en el Excel.`,
        })
        return
      }

      const fecha  = data[0]['Fecha de Reporte'] || 'Semana actual'
      const nombre      = jugador['Nombre'] || 'Jugador'
      const puntos      = Number(jugador['Puntos']) || 0
      const completadas = jugador['Misiones completadas'] || 0
      const tomadas     = jugador['Misiones tomadas'] || 0
      const cumplio     = puntos >= puntajeMinimo
      const faltante    = Math.max(0, puntajeMinimo - puntos)
      const excedente   = Math.max(0, puntos - puntajeMinimo)

      // Barra de progreso con emojis
      const progreso  = Math.min(1, puntos / puntajeMinimo)
      const totalBar  = 10
      const filled    = Math.round(progreso * totalBar)
      const barra     = '🟩'.repeat(filled) + '⬜'.repeat(totalBar - filled)

      // Porcentaje de misiones completadas
      const pctMisiones = tomadas > 0
        ? ((completadas / tomadas) * 100).toFixed(0)
        : 0

      let txt = `━━━━━━━━━━━━━━━━━━━━━━━\n`
      txt    += `📊 *STATS FDG*\n`
      txt    += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`

      txt    += `👤 *${nombre}*\n\n`

      txt    += `⭐ Puntos: *${puntos}* / ${puntajeMinimo}\n`
      txt    += `${barra}\n\n`

      txt    += `📜 Misiones: *${completadas}/${tomadas}* (${pctMisiones}%)\n\n`

      if (cumplio) {
        txt  += `✅ *Estado: CUMPLIÓ* 🔥\n`
        if (excedente > 0) {
          txt += `💪 Superó la meta por *${excedente} pts*\n`
        }
      } else {
        txt  += `❌ *Estado: NO CUMPLIÓ*\n`
        txt  += `⚠️ Le faltan: *${faltante} pts*\n`
      }

      txt += `\n📅 *Semana del:* ${fecha}\n`

      txt    += `\n━━━━━━━━━━━━━━━━━━━━━━━\n`
      txt    += `🅣🅗 — 🅑🅞🅣`

      await sock.sendMessage(chatId, { text: txt })

    } catch (error) {
      console.error('❌ Error en fdgstats:', error)
      await sock.sendMessage(chatId, {
        text: '⚠️ Ocurrió un error al ejecutar el comando. Intenta de nuevo.',
      })
    }
  },
}
