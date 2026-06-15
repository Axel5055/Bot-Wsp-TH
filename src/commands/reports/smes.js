// commands/reports/historial.js
const xlsx = require('xlsx')
const { getSheet } = require('../../cache/excelCache')

const META_SEMANAL = 35

function normalizar(texto = '') {
  return String(texto).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function barra(puntos, meta = META_SEMANAL) {
  const bloques = 8
  const llenos  = Math.min(bloques, Math.floor((puntos / meta) * bloques))
  return `[${'█'.repeat(llenos)}${'░'.repeat(bloques - llenos)}]`
}

function calcularRacha(semanas) {
  let racha = 0
  for (let i = semanas.length - 1; i >= 0; i--) {
    if (semanas[i].cumplio) racha++
    else break
  }
  return racha
}

function getCalificacion(cumplidas, total) {
  if (total === 0) return ''
  const pct = cumplidas / total
  if (pct === 1)   return '🏆 *¡Perfecto! Cumplió todas las semanas del mes.*'
  if (pct >= 0.75) return '💪 *Buen mes, casi sin fallar.*'
  if (pct >= 0.5)  return '⚠️ *Mes irregular, puede mejorar.*'
  if (pct > 0)     return '🚨 *Mes crítico, mayormente incumplido.*'
  return '💀 *No cumplió ninguna semana este mes.*'
}

module.exports = {
  name: 'smes',
  admin: false,

  async execute(sock, msg, args) {
    const chatId = msg.key.remoteJid

    if (!args || args.length === 0) {
      return sock.sendMessage(chatId, {
        text: '⚠️ Debes indicar un nombre.\n\nEjemplo: *#historial ZOOMBI3XX*',
      })
    }

    const nombreBuscado = args.join(' ').trim()

    try {
      await sock.sendMessage(chatId, { react: { text: '📜', key: msg.key } })

      const sheet = getSheet(2)
      if (!sheet) {
        return sock.sendMessage(chatId, { text: '⚠️ No se encontró la hoja *Ranking Evento* en el Excel.' })
      }

      const raw = xlsx.utils.sheet_to_json(sheet, { header: 1 })
      if (raw.length < 2) {
        return sock.sendMessage(chatId, { text: '⚠️ La hoja *Ranking Evento* no tiene datos.' })
      }

      const headerRow = raw[0]

      const idxTotal = headerRow.findIndex(c => String(c ?? '').toLowerCase() === 'total')
      if (idxTotal === -1) {
        return sock.sendMessage(chatId, { text: '⚠️ No se encontró la columna *Total* en el Ranking.' })
      }

      // Solo columnas con fecha real, ignorar vacías y placeholders tipo "Columna4"
      const colsSemanas = []
      for (let i = 3; i < idxTotal; i++) {
        const header = String(headerRow[i] ?? '').trim()
        if (!header || /^columna\d*/i.test(header)) continue
        colsSemanas.push({ idx: i, fecha: header })
      }

      const mesNombre = String(raw[1]?.[10] ?? 'Mes desconocido')

      const filaMemb = raw.slice(1).find(row => normalizar(row[2]) === normalizar(nombreBuscado))
      if (!filaMemb) {
        return sock.sendMessage(chatId, {
          text:
            `❌ No se encontró a *"${nombreBuscado}"* en el Ranking.\n\n` +
            `Verifica que el nombre esté escrito igual que en el Excel.\n` +
            `💡 Tip: respeta mayúsculas/minúsculas como aparece en el grupo.`,
        })
      }

      const nombreReal = String(filaMemb[2])
      const totalMes   = Number(filaMemb[idxTotal] ?? 0)

      const semanas = colsSemanas.map(({ idx, fecha }) => {
        const puntos = Number(filaMemb[idx] ?? 0)
        return { fecha, puntos, cumplio: puntos >= META_SEMANAL }
      })

      if (!semanas.length) {
        return sock.sendMessage(chatId, {
          text: `⚠️ No hay semanas registradas aún para *${nombreReal}* este mes.`,
        })
      }

      const semanasOk   = semanas.filter(s => s.cumplio).length
      const semanasFail = semanas.length - semanasOk
      const promedio    = Math.round(totalMes / semanas.length)
      const racha       = calcularRacha(semanas)

      let txt = `📜 *Historial — ${nombreReal}*\n`
      txt    += `🗓️ Mes: *${mesNombre}*\n`
      txt    += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`

      semanas.forEach((s, i) => {
        const icono = s.cumplio ? '✅' : '❌'
        txt += `${icono} *Sem ${i + 1}* — ${s.fecha}\n`
        txt += `   ${barra(s.puntos)} *${s.puntos}* pts`
        if (!s.cumplio) txt += ` _(faltan ${META_SEMANAL - s.puntos} pts)_`
        txt += `\n\n`
      })

      txt += `━━━━━━━━━━━━━━━━━━━━━━━\n`
      txt += `✅ Cumplidas: *${semanasOk}/${semanas.length}*  ❌ Fallidas: *${semanasFail}/${semanas.length}*\n`
      txt += `🏹 Acumulado: *${totalMes} pts*  📈 Promedio: *${promedio} pts*\n`

      if (racha >= 2)            txt += `🔥 Racha: *${racha} semanas* seguidas\n`
      else if (semanasFail >= 2) txt += `⚠️ Lleva *${semanasFail} semanas* sin cumplir\n`

      txt += `\n${getCalificacion(semanasOk, semanas.length)}\n`
      txt += `\n🅣🅗 — 🅑🅞🅣`

      await sock.sendMessage(chatId, { text: txt })

    } catch (error) {
      console.error('❌ Error en #historial:', error)
      await sock.sendMessage(chatId, { text: '⚠️ Ocurrió un error al obtener el historial. Intenta más tarde.' })
    }
  },
}