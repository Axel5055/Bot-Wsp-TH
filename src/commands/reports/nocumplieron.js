// commands/reports/nocumplieron.js
const xlsx = require('xlsx')
const { getSheet } = require('../../cache/excelCache')

const META_SEMANAL = 35

function getPuntos(u) {
  const cuota = String(u.Cuota ?? '').toLowerCase()
  if (cuota.includes('5lvl2')) return Number(u['Puntos Nvl 2'] ?? 0)
  if (cuota.includes('5lvl1')) return Number(u['Puntos Nvl 1'] ?? 0)
  return Math.max(Number(u['Puntos Nvl 2'] ?? 0), Number(u['Puntos Nvl 1'] ?? 0))
}

module.exports = {
  name: 'nocumplieron',
  admin: false,

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid

    try {
      await sock.sendMessage(chatId, { react: { text: '🔍', key: msg.key } })

      const sheet = getSheet(0)
      if (!sheet) {
        return sock.sendMessage(chatId, { text: '⚠️ No se encontró la hoja *Stats* en el Excel.' })
      }

      const data = xlsx.utils.sheet_to_json(sheet, { range: 2 })
      if (!data.length) {
        return sock.sendMessage(chatId, { text: '⚠️ La hoja *Stats* no tiene registros.' })
      }

      const fechaReporte = data.find(u => u['Fecha Reporte'])?.['Fecha Reporte'] || 'Semana actual'

      const noCumplieron = data
        .filter(u => u['Nombre'] && (
          String(u.Status ?? '').toLowerCase().includes('no cumplio') ||
          getPuntos(u) < META_SEMANAL
        ))
        .map(u => ({
          nombre:    u['Nombre'],
          puntos:    getPuntos(u),
          mobs:      Number(u['Total'] ?? 0),
          leFaltan:  META_SEMANAL - getPuntos(u),
        }))
        .sort((a, b) => b.puntos - a.puntos)

      if (!noCumplieron.length) {
        return sock.sendMessage(chatId, {
          text: `✅ *¡Todos cumplieron la meta!* 🎉\n📅 ${fechaReporte}\n\n🅣🅗 — 🅑🅞🅣`,
        })
      }

      const total = data.filter(u => u['Nombre']).length
      const pct   = ((noCumplieron.length / total) * 100).toFixed(0)

      let txt = `🚨 *No cumplieron* — ${fechaReporte}\n`
      txt    += `❌ ${noCumplieron.length}/${total} miembros (${pct}%)\n`
      txt    += `━━━━━━━━━━━━━━━━━━━━━━━\n`

      noCumplieron.forEach((u, i) => {
        txt += `${i + 1}. *${u.nombre}* — ${u.puntos}/${META_SEMANAL} pts · faltan *${u.leFaltan}* · 🏹 ${u.mobs}\n`
      })

      txt += `━━━━━━━━━━━━━━━━━━━━━━━\n`
      txt += `🅣🅗 — 🅑🅞🅣`

      await sock.sendMessage(chatId, { text: txt })

    } catch (error) {
      console.error('❌ Error en #nocumplieron:', error)
      await sock.sendMessage(chatId, { text: '⚠️ Ocurrió un error al obtener el reporte. Intenta más tarde.' })
    }
  },
}