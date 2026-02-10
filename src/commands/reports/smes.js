const xlsx = require('xlsx')
const {
  getText,
  normalizarTexto,
  getMesActual,
} = require('../../utils/caceriaUtils')
const { getSheet } = require('../../cache/excelCache')

module.exports = {
  name: 'smes',
  admin: false,

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid
    const body = getText(msg).trim()
    const args = body.split(/\s+/).slice(1)

    if (!args.length) {
      await sock.sendMessage(chatId, {
        text: '⚠️ Debes indicar un nombre.\nEjemplo:\n/smes Juan Perez',
      })
      return
    }

    try {
      // 🧠 Hoja desde cache (por nombre)
      const sheet = getSheet('Ranking Evento')

      if (!sheet) {
        await sock.sendMessage(chatId, {
          text: '❌ No se encontró la hoja "Ranking Evento".',
        })
        return
      }

      const data = xlsx.utils.sheet_to_json(sheet, {
        header: 'A',
        defval: 0,
      })

      const nombre = normalizarTexto(args.join(' '))
      const u = data.find(r => normalizarTexto(r.C) === nombre)

      if (!u) {
        await sock.sendMessage(chatId, {
          text: `⚠️ No se encontraron estadísticas para *${args.join(' ')}*.`,
        })
        return
      }

      const semanas = [u.D, u.E, u.F, u.G, u.H].map(n => Number(n) || 0)
      const total = semanas.reduce((a, b) => a + b, 0)

      const txt = `📅 *Estadísticas Mensuales de Cacería*

👤 *Jugador:* ${u.C}
📆 *Mes:* ${getMesActual()}

📊 *Desglose semanal:*
${semanas.map((v, i) => `• Semana ${i + 1}: *${v} puntos*`).join('\n')}

🔥 *Total del mes:* ${total} puntos 🐉

🅣🅗 — 🅑🅞🅣`

      await sock.sendMessage(chatId, { text: txt })
    } catch (error) {
      console.error('❌ Error en /smes:', error)
      await sock.sendMessage(chatId, {
        text: '⚠️ Ocurrió un error al consultar las estadísticas mensuales.',
      })
    }
  },
}
