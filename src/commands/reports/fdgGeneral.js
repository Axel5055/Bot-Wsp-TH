'use strict'

const xlsx = require('xlsx')
const moment = require('moment-timezone')
const { getSheet } = require('../../cache/excelCache')
const { getConfig } = require('../../config/fdgConfig')

module.exports = {
  name: 'fdgresumen',
  keywords: ['generales de fdg'],
  admin: false,

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid

    try {
      await sock.sendMessage(chatId, { react: { text: '📊', key: msg.key } })

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

      const fecha  = data[0]['Fecha de Reporte'] || 'Semana actual'

      const config = getConfig()
      const puntajeMinimo = Number(config.puntajeMinimo) || 0

      let cumplieron   = 0
      let noCumplieron = 0
      let totalPuntos  = 0
      let maxPuntos    = 0
      let topJugador   = ''

      for (const p of data) {
        const puntos = Number(p['Puntos']) || 0
        totalPuntos += puntos
        if (puntos >= puntajeMinimo) {
          cumplieron++
        } else {
          noCumplieron++
        }
        if (puntos > maxPuntos) {
          maxPuntos  = puntos
          topJugador = p['Nombre'] || ''
        }
      }

      const totalJugadores = data.length
      const promedio       = totalJugadores > 0 ? Math.round(totalPuntos / totalJugadores) : 0
      const porcentaje     = totalJugadores > 0
        ? ((cumplieron / totalJugadores) * 100).toFixed(1)
        : 0

      // Barra de progreso
      const barraLength = 10
      const llenos      = Math.round((porcentaje / 100) * barraLength)
      const barra       = '█'.repeat(llenos) + '░'.repeat(barraLength - llenos)

      // Emoji de estado general
      const nivelEmoji = porcentaje >= 80 ? '🔥' : porcentaje >= 50 ? '⚡' : '💤'

      let txt = `━━━━━━━━━━━━━━━━━━━━━━━\n`
      txt    += `🎉 *RESUMEN FDG*\n`
      txt    += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`

      txt    += `🎯 Meta: *${puntajeMinimo} pts* | 👥 Participantes: *${totalJugadores}*\n\n`

      txt    += `✅ Cumplieron:    *${cumplieron}*\n`
      txt    += `❌ No cumplieron: *${noCumplieron}*\n\n`

      txt    += `📊 *Cumplimiento del gremio*\n`
      txt    += `${barra} *${porcentaje}%* ${nivelEmoji}\n\n`

      txt    += `⭐ Puntos totales: *${totalPuntos}*\n`
      txt    += `📈 Promedio:       *${promedio} pts*\n`
      if (topJugador) {
        txt  += `🏆 Mejor jugador: *${topJugador}* (${maxPuntos} pts)\n`
      }

      txt    += `\n📅 ${fecha}\n`
      txt    += `🅣🅗 — 🅑🅞🅣`

      await sock.sendMessage(chatId, { text: txt })

    } catch (error) {
      console.error('❌ Error en fdgresumen:', error)
      await sock.sendMessage(chatId, {
        text: '⚠️ Ocurrió un error al ejecutar el comando. Intenta de nuevo.',
      })
    }
  },
}
