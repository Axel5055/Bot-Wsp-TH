const xlsx = require('xlsx')
const { getSheet } = require('../../cache/excelCache')

module.exports = {
  name: 'avisos',
  admin: true, // 👈 isadmin se encarga

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid

    try {
      await sock.sendMessage(chatId, {
        text: '📢 Enviando avisos...',
      })

      // 🧠 Hoja desde cache (por nombre)
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
        const debe = u.Debe || 0
        const total = meta + debe

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

❌ Te faltaron *${debe} puntos* para llegar a la meta mínima de *${meta}*.

📌 Recuerda que tienes *1 semana para reponer esos ${debe} puntos* más los ${meta} de la nueva semana.

➡️ En total deberás cumplir: *${total} puntos*.

🅣🅗 ​- ​🅑🅞🅣`

        await sock.sendMessage(`${u.Numero}@c.us`, {
          text: texto,
        })
      }

      await sock.sendMessage(chatId, {
        text: '✅ *Avisos enviados a todos los jugadores con status "No Cumplió".*',
      })
    } catch (error) {
      console.error('❌ Error en comando /avisos:', error)

      await sock.sendMessage(chatId, {
        text: '*⚠️ Ocurrió un error al enviar los avisos.*',
      })
    }
  },
}
