// commands/reports/nocumplieron.js
// Comando: #nocumplieron
// Muestra todos los miembros que NO alcanzaron los 35 pts mínimos de cacería semanal
// Lee la hoja "Stats" (índice 0) del Excel caza.xlsx

const xlsx = require('xlsx')
const { getSheet } = require('../../cache/excelCache')

const META_SEMANAL = 35

// Determina los puntos efectivos según la cuota del miembro
function getPuntos(u) {
  const cuota = String(u.Cuota ?? '').toLowerCase()
  if (cuota.includes('5lvl2')) return Number(u['Puntos Nvl 2'] ?? 0)
  if (cuota.includes('5lvl1')) return Number(u['Puntos Nvl 1'] ?? 0)
  // Fallback: si tiene ambos, toma el mayor
  return Math.max(Number(u['Puntos Nvl 2'] ?? 0), Number(u['Puntos Nvl 1'] ?? 0))
}

module.exports = {
  name: 'nocumplieron',
  admin: false,

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid

    try {
      // Reacción de carga
      await sock.sendMessage(chatId, {
        react: { text: '🔍', key: msg.key },
      })

      // ── Leer hoja Stats (índice 0) ──────────────────────────────
      const sheet = getSheet(0)

      if (!sheet) {
        await sock.sendMessage(chatId, {
          text: '⚠️ No se encontró la hoja *Stats* en el Excel.',
        })
        return
      }

      const data = xlsx.utils.sheet_to_json(sheet)

      if (!data.length) {
        await sock.sendMessage(chatId, {
          text: '⚠️ La hoja *Stats* no tiene registros.',
        })
        return
      }

      // ── Fecha del reporte (primera fila) ────────────────────────
      const fechaReporte = data[0]['Fecha de Reporte'] || 'Fecha desconocida'

      // ── Filtrar los que NO cumplieron ────────────────────────────
      // Criterio principal: columna Status === 'No cumplio'
      // Doble verificación: puntos efectivos < META_SEMANAL
      const noCumplieron = data
        .filter(u => {
          const status = String(u.Status ?? '').toLowerCase()
          const puntos = getPuntos(u)
          // Ambos criterios deben coincidir; si Status dice "No cumplio" O puntos < meta
          return status.includes('no cumplio') || puntos < META_SEMANAL
        })
        .map(u => ({
          nombre: u.Nombre || 'Sin nombre',
          puntos: getPuntos(u),
          mobs: Number(u['Total Semanal'] ?? 0),
          cuota: String(u.Cuota ?? '').toLowerCase().includes('5lvl1') ? 'Nvl 1' : 'Nvl 2',
          le_faltan: META_SEMANAL - getPuntos(u),
        }))
        // Ordenar de mayor a menor puntos (los más cercanos a la meta primero)
        .sort((a, b) => b.puntos - a.puntos)

      if (!noCumplieron.length) {
        await sock.sendMessage(chatId, {
          text: `✅ *¡Todos los miembros cumplieron la meta!* 🎉\n\n📅 Semana: ${fechaReporte}\n🎯 Meta: ${META_SEMANAL} pts\n\n🅣🅗 — 🅑🅞🅣`,
        })
        return
      }

      // ── Construir mensaje ────────────────────────────────────────
      const total = data.filter(u => u.Nombre).length
      const porcentaje = ((noCumplieron.length / total) * 100).toFixed(0)

      let txt = `🚨 *Miembros que NO cumplieron la meta* 🚨\n`
      txt += `📅 Semana: *${fechaReporte}*\n`
      txt += `🎯 Meta mínima: *${META_SEMANAL} puntos*\n`
      txt += `❌ Incumplieron: *${noCumplieron.length} de ${total}* (${porcentaje}%)\n`
      txt += `─────────────────────────\n\n`

      noCumplieron.forEach((u, i) => {
        const barra = u.puntos > 0
          ? `[${'█'.repeat(Math.floor(u.puntos / 5))}${'░'.repeat(Math.max(0, 7 - Math.floor(u.puntos / 5)))}]`
          : `[░░░░░░░]`
        txt += `${i + 1}. ❌ *${u.nombre}*\n`
        txt += `   📊 ${barra} ${u.puntos}/${META_SEMANAL} pts`
        txt += ` (faltan *${u.le_faltan}* pts)\n`
        txt += `   🎯 ${u.mobs} mobs — Cuota: ${u.cuota}\n\n`
      })

      txt += `─────────────────────────\n`
      txt += `⚔️ ¡A ponerse las pilas, cazadores! 🏹\n`
      txt += `🅣🅗 — 🅑🅞🅣`

      await sock.sendMessage(chatId, { text: txt })

    } catch (error) {
      console.error('❌ Error en #nocumplieron:', error)
      await sock.sendMessage(chatId, {
        text: '⚠️ Ocurrió un error al obtener el reporte. Intenta más tarde.',
      })
    }
  },
}