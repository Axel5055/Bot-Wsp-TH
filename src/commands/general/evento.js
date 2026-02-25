const fs = require('fs')
const path = require('path')

const modoPath = path.join(
  __dirname,
  '../../data/modo_evento.json'
)

// Obtener texto del mensaje
function getText(msg) {
  return (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    ''
  )
}

// Leer modo actual del evento
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
  name: 'evento',
  admin: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid
    const body = getText(msg).trim()
    const args = body.split(/\s+/).slice(1) // quitar /evento

    try {
      // 📌 /evento (mostrar evento actual)
      if (args.length === 0) {
        const { modo } = getModoEvento()

        const texto =
          modo === 1
            ? `🎯 *EVENTO INTERNO — MEJOR CAZADOR DEL MES* 🎯

🏆 *Premio a elegir:* 
- 💎 499 DIAMANTES
- 💰 Full Bank
- 🔷 100k de Gemas

⚔️ *Objetivo:*  
Ser el jugador con más puntos de cacería

📅 *Vigencia:*  
Del 2 de Febrero al 1 de Marzo del 2026

🔥 ¡Demuestra tu habilidad y conviértete en el mejor cazador!

📘 Consulta las reglas de cacería con: */caza*

🅣🅗 — 🅑🅞🅣`
            : `🎯 *EVENTO INTERNO — RIFA DE CAZADORES* 🎟️

🎁 *Premio a elegir:* 
- 💎 499 DIAMANTES
- 💰 Full Bank
- 🔷 100k de Gemas

🎯 *Objetivo:*  
Cumplir semanalmente con la cacería sin fallar para participar en la rifa.

🗳️ *Participan:*  
Todos los que cumplan las semanas del mes de Febrero

🔥 Cada cazador que cumpla con el objetivo semanal obtendrá un boleto para la rifa.
Para conseguir más entradas, se tomará en cuenta el excedente de cacería: por cada 5 mobs adicionales a los 35 base, se otorgará un boleto extra.

📘 Consulta las reglas con: */caza*

🅣🅗 — 🅑🅞🅣`

        await sock.sendMessage(chatId, { text: texto })
        return
      }

      // 📌 /evento set 1 | 2
      if (args[0] === 'set') {
        const nuevoModo = parseInt(args[1])

        if (![1, 2].includes(nuevoModo)) {
          await sock.sendMessage(chatId, {
            text: '❌ Uso correcto:\n/evento set 1\n/evento set 2'
          })
          return
        }

        fs.writeFileSync(
          modoPath,
          JSON.stringify({ modo: nuevoModo }, null, 2)
        )

        await sock.sendMessage(chatId, {
          text: `✅ Evento cambiado a modo ${nuevoModo}`
        })
        return
      }

      // ❌ Subcomando desconocido
      await sock.sendMessage(chatId, {
        text: '❌ Subcomando desconocido.'
      })

    } catch (error) {
      console.error('❌ Error en comando #evento:', error)

      await sock.sendMessage(chatId, {
        text: '🚨 Ocurrió un error al mostrar el evento. Intenta más tarde.'
      })
    }
  }
}
