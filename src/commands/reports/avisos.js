const xlsx = require('xlsx')
const { getSheet } = require('../../cache/excelCache')

module.exports = {
  name: 'avisos',
  admin: true,

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid

    try {
      await sock.sendMessage(chatId, {
        text: '📢 Enviando avisos...',
      })

      const sheet = getSheet('Avisos')

      if (!sheet) {
        await sock.sendMessage(chatId, {
          text: '*⚠️ No se encontró la hoja "Avisos" en el Excel.*',
        })
        return
      }

      const data = xlsx.utils.sheet_to_json(sheet)

      if (!data.length) {
        await sock.sendMessage(chatId, {
          text: '*⚠️ No hay registros en la hoja "Avisos".*',
        })
        return
      }

      // 🔎 Obtener encabezados
      const headers = Object.keys(data[0])

      // Buscar la columna "Puntos x cumplir"
      const indexPuntosCumplir = headers.indexOf('Puntos x cumplir')

      // Todas las columnas después de esa serán historial
      let columnasHistorial = []

      if (indexPuntosCumplir !== -1) {
        columnasHistorial = headers.slice(indexPuntosCumplir + 1)
      }

      for (const u of data) {
        if (!u.Numero) continue

        let tipo = 'General'
        let puntos = 0

        const cuota = String(u['Cuota Diaria'] || '').toLowerCase()

        if (cuota.includes('5lvl2')) {
          tipo = 'Nivel 2'
          puntos = u['Puntos Nvl 2'] || 0
        } else if (cuota.includes('5lvl1')) {
          tipo = 'Nivel 1'
          puntos = u['Puntos Nvl 1'] || 0
        }

        const meta = 35
        const debeActual = Number(u.Debe) || 0

        // 📂 Construir historial de deudas (>0)
        let historialDeuda = ''
        let deudaAnteriorTotal = 0

        for (const columna of columnasHistorial) {
          const valor = Number(u[columna]) || 0

          if (valor > 0) {
            historialDeuda += `📂 ${columna}: ${valor} puntos\n`
            deudaAnteriorTotal += valor
          }
        }

        // 🔥 TOTAL REAL
        const total = meta + debeActual + deudaAnteriorTotal

        // 🔥 Bloque de deudas anteriores
        let bloqueDeudas = ''

        if (deudaAnteriorTotal > 0) {
          bloqueDeudas = `📜 *Deudas anteriores:*\n${historialDeuda}`
        } else {
          bloqueDeudas = `📜 *Deudas anteriores:* Ninguna`
        }

        const texto = `📢 *Aviso de Cacería* 📢

👋 ¡Hola, *${u.Nombre}*! 👋

⚠️ Tu *status* esta semana fue: ❌ *NO CUMPLIÓ*

🎯 *Tipo de Caza:* ${tipo}
🎯 *Total de Caza Semanal:* ${u['Total Semanal'] || 0} Mobs
🧮 *Total de Puntos:* ${puntos} Puntos

📊 *Detalle de mobs realizados:*
🔹 *L1*: ${u.Mob1 || 0} Mobs 🐰
🔹 *L2*: ${u.Mob2 || 0} Mobs 🐺
🔹 *L3*: ${u.Mob3 || 0} Mobs 🐲
🔹 *L4*: ${u.Mob4 || 0} Mobs 🐧
🔹 *L5*: ${u.Mob5 || 0} Mobs 🐯

❌ Esta semana quedaste debiendo *${debeActual} puntos*.

${bloqueDeudas}

📌 Recuerda que debes cumplir la meta semanal más tu deuda acumulada.

🎯 *Total a cumplir esta semana: ${total} puntos.*

🅣🅗 ​- ​🅑🅞🅣`

        await sock.sendMessage(`${u.Numero}@c.us`, {
          text: texto,
        })
      }

      await sock.sendMessage(chatId, {
        text: '✅ *Avisos enviados correctamente.*',
      })

    } catch (error) {
      console.error('❌ Error en comando /avisos:', error)

      await sock.sendMessage(chatId, {
        text: '*⚠️ Ocurrió un error al enviar los avisos.*',
      })
    }
  },
}
