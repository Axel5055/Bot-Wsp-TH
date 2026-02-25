const xlsx = require('xlsx')
const { getSheet } = require('../../cache/excelCache')
const { getText, normalizarTexto } = require('../../utils/caceriaUtils')

module.exports = {
  name: 'stats',
  keywords: ['stats', 'estadisticas'],
  admin: false,

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid
    const body = getText(msg).trim()
    const nombre = body.substring(6).trim()

    if (!nombre) {
      await sock.sendMessage(chatId, {
        text: '*⚠️ Proporciona un nombre para buscar. Ejemplo: /stats Juan Pérez*',
      })
      return
    }

    try {
      // 🦊 reacción opcional
      await sock.sendMessage(chatId, {
        react: { text: '🦊', key: msg.key },
      })

      // 🧠 hoja de estadísticas individuales (índice 0)
      const sheet = getSheet(0)

      if (!sheet) {
        await sock.sendMessage(chatId, {
          text: '*⚠️ No se encontró la hoja de estadísticas.*',
        })
        return
      }

      const data = xlsx.utils.sheet_to_json(sheet)
      const fechaReporte = sheet['M2']?.v || 'Fecha desconocida'

      const u = data.find(
        r => normalizarTexto(r.Nombre) === normalizarTexto(nombre)
      )

      if (!u) {
        await sock.sendMessage(chatId, {
          text: `*⚠️ No se encontraron estadísticas para "${nombre}".*`,
        })
        return
      }

      const statusIcon = u.Status === 'Cumplio' ? '✅' : '❌'
      let tipo = 'General'
      let puntos = u.Puntos || 0

      if (u.Cuota?.includes('5lvl2')) {
        tipo = 'Nivel 2'
        puntos = u['Puntos Nvl 2'] || 0
      } else if (u.Cuota?.includes('5lvl1')) {
        tipo = 'Nivel 1'
        puntos = u['Puntos Nvl 1'] || 0
      }

      const txt = `👋 ¡Hola, *${u.Nombre}*! 👋
Aquí están tus *Estadísticas de Cacería* 🤩

🎯 *Tipo de Caza:* ${tipo}
🎯 *Total de Caza Semanal:* ${u['Total Semanal'] || 0} Mobs
🧮 *Total de Puntos:* ${puntos} Puntos
*Status:* ${u.Status} ${statusIcon}

🎯 *L1:* ${u['Total Mobs lvl 1'] || 0} Mobs 🐰
🎯 *L2:* ${u['Total Mobs lvl 2'] || 0} Mobs 🐺
🎯 *L3:* ${u['Total Mobs lvl 3'] || 0} Mobs 🐲
🎯 *L4:* ${u['Total Mobs lvl 4'] || 0} Mobs 🐧
🎯 *L5:* ${u['Total Mobs lvl 5'] || 0} Mobs 🐯

📅 *Fecha Reporte:* ${fechaReporte}

🅣🅗 — 🅑🅞🅣`

      await sock.sendMessage(chatId, { text: txt })
    } catch (error) {
      console.error('❌ Error en /stats:', error)
      await sock.sendMessage(chatId, {
        text: '*⚠️ Ocurrió un error ejecutando /stats*',
      })
    }
  },
}
