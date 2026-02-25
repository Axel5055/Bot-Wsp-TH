const xlsx = require('xlsx')
const moment = require('moment-timezone')
const fs = require('fs')
const path = require('path')
const { getRandomIcono } = require('../../utils/caceriaUtils')
const { getSheet } = require('../../cache/excelCache')

// 📁 Ruta del modo del evento
const modoPath = path.join(
  __dirname,
  '../../data/modo_evento.json'
)

// 🔎 Leer modo actual del evento
function getModoEvento() {
  if (!fs.existsSync(modoPath)) {
    return { modo: 1 }
  }

  try {
    return JSON.parse(fs.readFileSync(modoPath, 'utf-8'))
  } catch (error) {
    console.error('❌ Error leyendo modo_evento.json:', error)
    return { modo: 1 }
  }
}

module.exports = {
  name: 'ranking',
  admin: false,

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid

    try {
      // 🔥 Excel desde memoria
      const sheet = getSheet(3)

      if (!sheet) {
        await sock.sendMessage(chatId, {
          text: '*⚠️ No se encontró la hoja de ranking.*',
        })
        return
      }

      const data = xlsx.utils.sheet_to_json(sheet)

      const top = data
        .sort((a, b) => (b.Total || 0) - (a.Total || 0))
        .slice(0, 10)

      const mes = sheet['J1']?.v || 'Mes desconocido'
      const year = moment().tz('America/Mexico_City').format('YYYY')
      const medals = ['🥇','🥈','🥉','🏅','🏅','🏅','🏅','🏅','🏅','🏅']

      // 🔎 Obtener modo del evento actual
      const { modo } = getModoEvento()

      let txt = `🏆 *¡Ranking de los 10 Mejores Cazadores del Mes!* 🏆\n\n`

      top.forEach((u, i) => {
        txt += `${i + 1}. ${medals[i]} *${u.Nombre}:* ${u.Total || 0} Pts ${getRandomIcono()}\n`
      })

      // 🔥 Mensaje dinámico según modo
      if (modo === 1) {
        txt += `\n🌟 *El mejor cazador del mes podrá elegir entre:*\n`
        txt += `- *499 Diamantes*\n`
        txt += `- *1 Full Bank*\n`
        txt += `- *100K de Gemas*\n\n`
      } else {
        txt += `\n🎟️ *Este mes el evento es modalidad RIFA de cazadores.*\n`
        txt += `🔥 Cada cazador que cumpla con el objetivo semanal obtendrá un boleto para la rifa.\n`
        txt += `🎁 Premio a elegir:\n`
        txt += `- *499 Diamantes*\n`
        txt += `- *1 Full Bank*\n`
        txt += `- *100K de Gemas*\n\n`
      }

      txt += `📘 Consulta las bases con el comando: *#evento*\n\n`
      txt += `*Evento de Cacería - Mes de ${mes} ${year}*\n`
      txt += `\n🔥 ¡Sigan cazando y demostrando su habilidad! 💪\n\n🅣🅗 — 🅑🅞🅣`

      await sock.sendMessage(chatId, { text: txt })

    } catch (error) {
      console.error('❌ Error en /ranking:', error)
      await sock.sendMessage(chatId, {
        text: '⚠️ Error ejecutando ranking.',
      })
    }
  },
}
