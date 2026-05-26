'use strict'

const xlsx = require('xlsx')
const moment = require('moment-timezone')
const { getSheet } = require('../../cache/excelCache')
const { getConfig } = require('../../config/fdgConfig')

module.exports = {
  name: 'fdgfaltan',
  admin: true,

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid

    try {
      await sock.sendMessage(chatId, { react: { text: '🔍', key: msg.key } })

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

      const faltaron = []

      for (const p of data) {
        const puntos = Number(p['Puntos']) || 0
        if (puntos < puntajeMinimo) {
          faltaron.push({
            nombre:      p['Nombre'] || 'Jugador',
            puntos,
            completadas: p['Misiones completadas'] || 0,
            tomadas:     p['Misiones tomadas'] || 0,
            faltante:    puntajeMinimo - puntos,
          })
        }
      }

      if (!faltaron.length) {
        await sock.sendMessage(chatId, {
          text:
            `✅ *¡Todos cumplieron la FDG!*\n\n` +
            `🔥 Excelente trabajo del gremio.\n` +
            `👥 Total participantes: *${data.length}*\n\n` +
            `📅 *Semana del:* ${fecha}\n` +
            `🅣🅗 — 🅑🅞🅣`,
        })
        return
      }

      // Ordenar por puntos ascendente (los que menos tienen, primero)
      faltaron.sort((a, b) => a.puntos - b.puntos)

      let txt = `━━━━━━━━━━━━━━━━━━━━━━━\n`
      txt    += `❌ *JUGADORES SIN CUMPLIR FDG*\n`
      txt    += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`
      txt    += `🎯 Meta: *${puntajeMinimo} pts* | ❌ Sin cumplir: *${faltaron.length}/${data.length}*\n`
      txt += `\n📅 *Semana del:* ${fecha}\n\n`

      faltaron.forEach((p, i) => {
        const progreso = Math.min(1, p.puntos / puntajeMinimo)
        const bloques  = 6
        const llenos   = Math.round(progreso * bloques)
        const barra    = '█'.repeat(llenos) + '░'.repeat(bloques - llenos)

        txt += `${i + 1}. 👤 *${p.nombre}*\n`
        txt += `   ${barra} ${p.puntos}/${puntajeMinimo} pts\n`
        txt += `   📜 Misiones: ${p.completadas}/${p.tomadas}\n`
        txt += `   ⚠️ Faltan: *${p.faltante} pts*\n\n`
      })

      txt += `🅣🅗 — 🅑🅞🅣`

      await sock.sendMessage(chatId, { text: txt })

    } catch (error) {
      console.error('❌ Error en fdgfaltan:', error)
      await sock.sendMessage(chatId, {
        text: '⚠️ Ocurrió un error al ejecutar el comando. Intenta de nuevo.',
      })
    }
  },
}
