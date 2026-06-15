'use strict'

const xlsx = require('xlsx')
const { getSheet } = require('../../cache/excelCache')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function buildAvisoText(u, tipo, puntos, debeActual, bloqueDeudas, total, deudaAnteriorTotal, META_SEMANAL) {
  const mobs = [
    u.Mob1 ?? 0, u.Mob2 ?? 0, u.Mob3 ?? 0,
    u.Mob4 ?? 0, u.Mob5 ?? 0,
  ]
  const iconos = ['🐰', '🐺', '🐲', '🐧', '🐯']

  const detalleMobs = mobs
    .map((v, i) => `   🔹 *L${i + 1}* ${iconos[i]}: ${v} Mobs`)
    .join('\n')

  return (
    `📢 *AVISO DE CACERÍA*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `👋 Hola, *${u.Nombre}*\n\n` +
    `❌ Esta semana tu status fue: *NO CUMPLIÓ*\n\n` +
    `🎯 *Tipo de caza:* ${tipo}\n` +
    `🏹 *Total semanal:* ${u['Total Semanal'] ?? 0} Mobs\n` +
    `⭐ *Puntos obtenidos:* ${puntos} pts\n` +
    `🎯 *Meta semanal:* 35 pts\n\n` +
    `📊 *Detalle de mobs:*\n${detalleMobs}\n\n` +
    `❌ *Deuda esta semana:* ${debeActual} pts\n\n` +
    `${bloqueDeudas}\n\n` +
    `📌 *Desglose de tu deuda total:*\n` +
    `   📅 Meta semanal:      ${META_SEMANAL} pts\n` +
    `   ❌ Deuda esta semana:  ${debeActual} pts\n` +
    `   📂 Deudas anteriores:  ${deudaAnteriorTotal} pts\n` +
    `   ─────────────────────\n` +
    `   🎯 *Total a cumplir esta semana: ${total} pts*\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🅣🅗 — 🅑🅞🅣`
  )
}

module.exports = {
  name: 'avisos',
  admin: true,

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid
    const META_SEMANAL = 35

    try {
      await sock.sendMessage(chatId, { react: { text: '📢', key: msg.key } })

      const sheet = getSheet('Avisos')
      if (!sheet) {
        await sock.sendMessage(chatId, {
          text: '⚠️ No se encontró la hoja *"Avisos"* en el Excel.',
        })
        return
      }

      const data = xlsx.utils.sheet_to_json(sheet)
      if (!data.length) {
        await sock.sendMessage(chatId, {
          text: '⚠️ No hay registros en la hoja *"Avisos"*.',
        })
        return
      }

      // ── Detectar columnas de historial ───────────────────────────
      const headers = Object.keys(data[0])
      const indexSemanaAnterior = headers.indexOf('Semana anterior')
      const columnasHistorial =
        indexSemanaAnterior !== -1 ? headers.slice(indexSemanaAnterior + 1) : []

      await sock.sendMessage(chatId, {
        text: `📋 Iniciando envío de avisos...\n👥 Total a notificar: *${data.filter(u => u.Numero).length}*`,
      })

      let enviados = 0
      let errores = 0
      let sinNumero = 0

      for (const u of data) {
        if (!u.Numero) { sinNumero++; continue }

        try {
          const cuota = String(u['Cuota'] ?? '').toLowerCase()
          let tipo = 'General'
          let puntos = 0

          if (cuota.includes('5lvl2')) {
            tipo = 'Nivel 2'
            puntos = u['Puntos Nvl 2'] ?? 0
          } else if (cuota.includes('5lvl1')) {
            tipo = 'Nivel 1'
            puntos = u['Puntos Nvl 1'] ?? 0
          }

          const debeActual = Number(u.Debe) || 0
          let historialDeuda = ''
          let deudaAnteriorTotal = 0

          for (const col of columnasHistorial) {
            const valor = Number(u[col]) || 0
            if (valor > 0) {
              historialDeuda += `   📂 ${col}: ${valor} pts\n`
              deudaAnteriorTotal += valor
            }
          }

          const bloqueDeudas =
            deudaAnteriorTotal > 0
              ? `📜 *Deudas anteriores:*\n${historialDeuda.trimEnd()}\n   💰 *Subtotal deudas:* ${deudaAnteriorTotal} pts`
              : `📜 *Deudas anteriores:* Ninguna ✅`

          const total = META_SEMANAL + debeActual + deudaAnteriorTotal
          const texto = buildAvisoText(u, tipo, puntos, debeActual, bloqueDeudas, total, deudaAnteriorTotal, META_SEMANAL)

          await sock.sendMessage(`${u.Numero}@s.whatsapp.net`, { text: texto })
          enviados++
          await sleep(1500)

        } catch (innerError) {
          errores++
          console.error(`❌ Error enviando aviso a ${u.Numero}:`, innerError)
        }
      }

      // ── Reporte final ────────────────────────────────────────────
      let resumen = `✅ *Avisos enviados correctamente*\n\n`
      resumen    += `📤 Enviados: *${enviados}*\n`
      if (errores > 0)   resumen += `❌ Con error: *${errores}*\n`
      if (sinNumero > 0) resumen += `⚠️ Sin número: *${sinNumero}*\n`

      await sock.sendMessage(chatId, { text: resumen.trim() })

    } catch (error) {
      console.error('❌ Error en comando avisos:', error)
      await sock.sendMessage(chatId, {
        text: '⚠️ Ocurrió un error al enviar los avisos. Intenta de nuevo.',
      })
    }
  },
}