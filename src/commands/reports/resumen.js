// commands/reports/resumen.js
const xlsx = require('xlsx')
const { getSheet } = require('../../cache/excelCache')

const META_SEMANAL = 35
const MEDALLAS     = ['🥇', '🥈', '🥉']

function getPuntos(u) {
  const cuota = String(u['Cuota'] ?? '').toLowerCase()
  if (cuota.includes('5lvl2')) return Number(u['Puntos Nvl 2'] ?? 0)
  if (cuota.includes('5lvl1')) return Number(u['Puntos Nvl 1'] ?? 0)
  return Math.max(Number(u['Puntos Nvl 2'] ?? 0), Number(u['Puntos Nvl 1'] ?? 0))
}

function barraGrupo(cumplieron, total) {
  const bloques = 10
  const llenos  = Math.round((cumplieron / total) * bloques)
  return `[${'█'.repeat(llenos)}${'░'.repeat(bloques - llenos)}]`
}

module.exports = {
  name: 'resumen',
  admin: false,

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid

    try {
      await sock.sendMessage(chatId, { react: { text: '📊', key: msg.key } })

      const sheetStats = getSheet(0)
      if (!sheetStats) {
        return sock.sendMessage(chatId, { text: '⚠️ No se encontró la hoja *Stats* en el Excel.' })
      }

      // ── Leer totales globales de la fila 0 (antes de los encabezados) ──
      const rawRows = xlsx.utils.sheet_to_json(sheetStats, { header: 1 })
      // rawRows[0] = [null, null, null, 'Total Semanal', totalMobs, L1, L2, L3, L4, L5, ptsNvl2, ptsNvl1, debe]
      const filaTotal = rawRows[0]
      const totalMobsGlobal = Number(filaTotal[4] ?? 0)
      const mobsL1Global    = Number(filaTotal[5] ?? 0)
      const mobsL2Global    = Number(filaTotal[6] ?? 0)
      const mobsL3Global    = Number(filaTotal[7] ?? 0)
      const mobsL4Global    = Number(filaTotal[8] ?? 0)
      const mobsL5Global    = Number(filaTotal[9] ?? 0)

      // ── Leer filas de miembros (encabezado en fila 2, índice 2) ──
      const stats = xlsx.utils.sheet_to_json(sheetStats, { range: 2 })
      if (!stats.length) {
        return sock.sendMessage(chatId, { text: '⚠️ La hoja *Stats* no tiene registros.' })
      }

      // ── Métricas ─────────────────────────────────────────────────
      const totalMemb    = stats.filter(u => u['Nombre']).length
      const cumplieron   = stats.filter(u => String(u['Status'] ?? '').trim() === 'Cumplio').length
      const noCumplieron = totalMemb - cumplieron
      const pctCumplio   = ((cumplieron / totalMemb) * 100).toFixed(0)

      const puntosLista = stats.filter(u => u['Nombre']).map(getPuntos)
      const puntosTotal = puntosLista.reduce((a, b) => a + b, 0)
      const promedio    = (puntosTotal / totalMemb).toFixed(1)
      const maximo      = Math.max(...puntosLista)

      const inactivos    = stats.filter(u => u['Nombre'] && Number(u['Total'] ?? 0) === 0)
      const fechaReporte = stats.find(u => u['Fecha Reporte'])?.['Fecha Reporte'] || 'Semana actual'

      // ── Top 3 por Puntos Nvl 2 ───────────────────────────────────
      const top3 = stats
        .filter(u => u['Nombre'] && String(u['Cuota'] ?? '').toLowerCase().includes('5lvl2'))
        .sort((a, b) => Number(b['Puntos Nvl 2'] ?? 0) - Number(a['Puntos Nvl 2'] ?? 0))
        .slice(0, 3)

      // ── Mensaje ──────────────────────────────────────────────────
      let txt = `📊 *Resumen Semanal de Cacería*\n`
      txt    += `📅 *${fechaReporte}*\n`
      txt    += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`

      txt    += `🏹 *Mobs cazados esta semana*\n`
      txt    += `🔢 Total: *${totalMobsGlobal.toLocaleString()} mobs*\n`
      txt    += `🐰 L1: ${mobsL1Global.toLocaleString()}  🐺 L2: ${mobsL2Global.toLocaleString()}  🐲 L3: ${mobsL3Global.toLocaleString()}\n`
      txt    += `🐧 L4: ${mobsL4Global.toLocaleString()}  🐯 L5: ${mobsL5Global.toLocaleString()}\n\n`

      txt    += `⚔️ *Cumplimiento* _(meta: ${META_SEMANAL} pts)_\n`
      txt    += `${barraGrupo(cumplieron, totalMemb)} ${pctCumplio}%\n`
      txt    += `✅ Cumplieron:    *${cumplieron}* miembros\n`
      txt    += `❌ No cumplieron: *${noCumplieron}* miembros\n`
      txt    += `👥 Total activos: *${totalMemb}* miembros\n`
      if (inactivos.length > 0) txt += `😴 Sin cazar:     *${inactivos.length}* (0 mobs)\n`
      txt    += `\n`

      txt    += `🧮 *Puntos del grupo*\n`
      txt    += `📈 Promedio semanal: *${promedio} pts*\n`
      txt    += `🏆 Mejor puntaje:    *${maximo} pts*\n\n`

      txt    += `🏅 *Top 3 de la semana*\n`
      if (!top3.length) {
        txt  += `_Sin datos de ranking_\n`
      } else {
        top3.forEach((u, i) => {
          const pts = Number(u['Puntos Nvl 2'] ?? 0)
          txt += `${MEDALLAS[i]} *${u['Nombre']}*\n`
          txt += `   ⭐ ${pts} pts · 🏹 ${u['Total'] ?? 0} mobs\n`
        })
      }

      txt    += `\n━━━━━━━━━━━━━━━━━━━━━━━\n`
      txt    += `🅣🅗 — 🅑🅞🅣`

      await sock.sendMessage(chatId, { text: txt })

    } catch (error) {
      console.error('❌ Error en #resumen:', error)
      await sock.sendMessage(chatId, {
        text: '⚠️ Ocurrió un error al generar el resumen. Intenta más tarde.',
      })
    }
  },
}