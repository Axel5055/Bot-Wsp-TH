// commands/reports/inactivos.js
// Comando: #inactivos
// Lista los miembros que tuvieron 0 mobs cazados en la semana actual.
// Fuente: hoja "Stats" (índice 0)

const xlsx = require('xlsx')
const { getSheet } = require('../../cache/excelCache')

module.exports = {
  name: 'inactivos',
  admin: false,

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid

    try {
      await sock.sendMessage(chatId, {
        react: { text: '😴', key: msg.key },
      })

      // ── Leer Stats ───────────────────────────────────────────────
      const sheet = getSheet(0)
      if (!sheet) {
        return sock.sendMessage(chatId, {
          text: '⚠️ No se encontró la hoja *Stats* en el Excel.',
        })
      }

      const data = xlsx.utils.sheet_to_json(sheet)
      if (!data.length) {
        return sock.sendMessage(chatId, {
          text: '⚠️ La hoja *Stats* no tiene registros.',
        })
      }

      const fechaReporte = data[0]['Fecha de Reporte'] || 'Semana actual'
      const totalMemb    = data.filter(u => u['Nombre']).length

      // Filtrar los que tienen exactamente 0 mobs
      const inactivos = data.filter(
        u => u['Nombre'] && Number(u['Total Semanal'] ?? 0) === 0
      )

      // ── Sin inactivos ────────────────────────────────────────────
      if (inactivos.length === 0) {
        return sock.sendMessage(chatId, {
          text:
            `✅ *¡No hay inactivos esta semana!* 🎉\n\n` +
            `📅 ${fechaReporte}\n` +
            `👥 Todos los *${totalMemb}* miembros cazaron al menos 1 mob.\n\n` +
            `🅣🅗 — 🅑🅞🅣`,
        })
      }

      // ── Construir mensaje ────────────────────────────────────────
      const pct = ((inactivos.length / totalMemb) * 100).toFixed(0)

      let txt = `😴 *Miembros Inactivos esta semana*\n`
      txt += `📅 *${fechaReporte}*\n`
      txt += `─────────────────────────\n\n`
      txt += `🚫 *${inactivos.length} de ${totalMemb}* miembros no cazaron nada (${pct}%)\n\n`

      inactivos.forEach((u, i) => {
        const cuotaTipo = String(u['Cuota'] ?? '').toLowerCase().includes('5lvl1')
          ? 'Nvl 1'
          : 'Nvl 2'
        txt += `${i + 1}. 💤 *${u['Nombre']}*  _(${cuotaTipo})_\n`
      })

      txt += `\n─────────────────────────\n`
      txt += `⚠️ Recuerda que 0 mobs = 0 puntos = *incumplimiento automático.*\n`
      txt += `\n🅣🅗 — 🅑🅞🅣`

      await sock.sendMessage(chatId, { text: txt })

    } catch (error) {
      console.error('❌ Error en #inactivos:', error)
      await sock.sendMessage(chatId, {
        text: '⚠️ Ocurrió un error al obtener los inactivos. Intenta más tarde.',
      })
    }
  },
}