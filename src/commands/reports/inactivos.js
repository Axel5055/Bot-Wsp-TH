// commands/reports/inactivos.js
const xlsx = require('xlsx')
const { getSheet } = require('../../cache/excelCache')

module.exports = {
  name: 'inactivos',
  admin: false,

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid

    try {
      await sock.sendMessage(chatId, { react: { text: '😴', key: msg.key } })

      const sheet = getSheet(0)
      if (!sheet) {
        return sock.sendMessage(chatId, { text: '⚠️ No se encontró la hoja *Stats* en el Excel.' })
      }

      const data = xlsx.utils.sheet_to_json(sheet, { range: 2 })
      if (!data.length) {
        return sock.sendMessage(chatId, { text: '⚠️ La hoja *Stats* no tiene registros.' })
      }

      const fechaReporte = data.find(u => u['Fecha Reporte'])?.['Fecha Reporte'] || 'Semana actual'
      const totalMemb    = data.filter(u => u['Nombre']).length
      const inactivos    = data.filter(u => u['Nombre'] && Number(u['Total'] ?? 0) === 0)

      if (!inactivos.length) {
        return sock.sendMessage(chatId, {
          text: `✅ *¡No hay inactivos esta semana!* 🎉\n📅 ${fechaReporte}\n👥 Todos los *${totalMemb}* miembros cazaron al menos 1 mob.\n\n🅣🅗 — 🅑🅞🅣`,
        })
      }

      const pct = ((inactivos.length / totalMemb) * 100).toFixed(0)

      let txt = `😴 *Inactivos* — ${fechaReporte}\n`
      txt    += `🚫 ${inactivos.length}/${totalMemb} miembros sin cazar (${pct}%)\n`
      txt    += `━━━━━━━━━━━━━━━━━━━━━━━\n`

      inactivos.forEach((u, i) => {
        const cuota = String(u['Cuota'] ?? '').toLowerCase().includes('5lvl1') ? 'Nvl 1' : 'Nvl 2'
        txt += `${i + 1}. 💤 *${u['Nombre']}* _(${cuota})_\n`
      })

      txt += `━━━━━━━━━━━━━━━━━━━━━━━\n`
      txt += `🅣🅗 — 🅑🅞🅣`

      await sock.sendMessage(chatId, { text: txt })

    } catch (error) {
      console.error('❌ Error en #inactivos:', error)
      await sock.sendMessage(chatId, { text: '⚠️ Ocurrió un error al obtener los inactivos. Intenta más tarde.' })
    }
  },
}