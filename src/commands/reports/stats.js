// commands/reports/buscar.js
const xlsx = require('xlsx')
const { getSheet } = require('../../cache/excelCache')

const META_SEMANAL = 35

function normalizar(texto = '') {
  return String(texto)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function getPuntos(u) {
  const cuota = String(u['Cuota'] ?? '').toLowerCase()
  if (cuota.includes('5lvl2')) return Number(u['Puntos Nvl 2'] ?? 0)
  if (cuota.includes('5lvl1')) return Number(u['Puntos Nvl 1'] ?? 0)
  return Math.max(Number(u['Puntos Nvl 2'] ?? 0), Number(u['Puntos Nvl 1'] ?? 0))
}

function barra(puntos, meta = META_SEMANAL) {
  const bloques = 8
  const llenos  = Math.min(bloques, Math.floor((puntos / meta) * bloques))
  return `[${'█'.repeat(llenos)}${'░'.repeat(bloques - llenos)}]`
}

module.exports = {
  name: 'stats',
  admin: false,

  async execute(sock, msg, args) {
    const chatId = msg.key.remoteJid

    if (!args || args.length === 0) {
      return sock.sendMessage(chatId, {
        text: '⚠️ Debes indicar un nombre.\n\nEjemplo: *#buscar ZOOMBI3XX*',
      })
    }

    const nombreBuscado = args.join(' ').trim()

    try {
      await sock.sendMessage(chatId, { react: { text: '🔎', key: msg.key } })

      // ── Stats: semana actual ─────────────────────────────────────
      const sheetStats = getSheet(0)
      const dataStats  = xlsx.utils.sheet_to_json(sheetStats, { range: 2 })

      const u = dataStats.find(
        r => normalizar(r['Nombre']) === normalizar(nombreBuscado)
      )

      if (!u) {
        return sock.sendMessage(chatId, {
          text:
            `❌ No se encontró a *"${nombreBuscado}"*.\n\n` +
            `Verifica que el nombre esté escrito igual que en el Excel.\n` +
            `💡 Tip: respeta mayúsculas/minúsculas como aparece en el grupo.`,
        })
      }

      const puntos      = getPuntos(u)
      const cumplio     = String(u['Status'] ?? '').trim() === 'Cumplio'
      const statusIcono = cumplio ? '✅' : '❌'
      const cuotaTipo   = String(u['Cuota'] ?? '').toLowerCase().includes('5lvl1') ? 'Nvl 1' : 'Nvl 2'
      const fechaSemana = dataStats.find(r => r['Fecha Reporte'])?.['Fecha Reporte'] || 'Semana actual'
      const leFaltan    = Math.max(0, META_SEMANAL - puntos)

      // ── Ranking Evento: total del mes (hoja índice 2) ────────────
      const sheetRank = getSheet(2)
      const rawRank   = xlsx.utils.sheet_to_json(sheetRank, { header: 1 })

      const headerRank = rawRank[0]
      const idxTotal   = headerRank.findIndex(
        c => String(c ?? '').toLowerCase() === 'total'
      )
      // El mes está en la última columna con valor (col 10)
      const mesNombre  = String(rawRank[1]?.[10] ?? '')

      const filaRank = rawRank.slice(1).find(
        row => normalizar(row[2]) === normalizar(u['Nombre'])
      )

      const totalMes = filaRank && idxTotal !== -1
        ? Number(filaRank[idxTotal] ?? 0)
        : null

      const posicion = filaRank ? Number(filaRank[0]) : null

      // ── Construir mensaje ────────────────────────────────────────
      let txt = `🔎 *Perfil de Cazador*\n`
      txt += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`

      txt += `👤 *${u['Nombre']}*\n`
      txt += `🎯 Cuota: *${cuotaTipo}*\n`
      if (u['IGG ID']) txt += `🆔 IGG ID: \`${u['IGG ID']}\`\n`
      txt += `\n`

      txt += `📅 *Semana actual* _(${fechaSemana})_\n`
      txt += `${statusIcono} Status: *${cumplio ? 'Cumplió' : 'No cumplió'}*\n`
      txt += `${barra(puntos)} *${puntos}/${META_SEMANAL}* pts\n`
      if (!cumplio) txt += `⚠️ Le faltan *${leFaltan} pts* para cumplir\n`
      txt += `\n`

      txt += `🏹 Mobs cazados: *${Number(u['Total'] ?? 0)}*\n`
      txt += `🐰 L1: ${u['Total Mobs lvl 1'] ?? 0}  `
      txt += `🐺 L2: ${u['Total Mobs lvl 2'] ?? 0}  `
      txt += `🐲 L3: ${u['Total Mobs lvl 3'] ?? 0}\n`
      txt += `🐧 L4: ${u['Total Mobs lvl 4'] ?? 0}  `
      txt += `🐯 L5: ${u['Total Mobs lvl 5'] ?? 0}\n`

      if (totalMes !== null) {
        txt += `\n`
        txt += `🗓️ *Mes de ${mesNombre}*\n`
        txt += `🏆 Puntos acumulados: *${totalMes} pts*\n`
        if (posicion) {
          const emoji = posicion === 1 ? '🥇' : posicion === 2 ? '🥈' : posicion === 3 ? '🥉' : '🏅'
          txt += `${emoji} Posición en ranking: *#${posicion}*\n`
        }
      }

      txt += `\n━━━━━━━━━━━━━━━━━━━━━━━\n`
      txt += `🅣🅗 — 🅑🅞🅣`

      await sock.sendMessage(chatId, { text: txt })

    } catch (error) {
      console.error('❌ Error en #buscar:', error)
      await sock.sendMessage(chatId, {
        text: '⚠️ Ocurrió un error al buscar el perfil. Intenta más tarde.',
      })
    }
  },
}