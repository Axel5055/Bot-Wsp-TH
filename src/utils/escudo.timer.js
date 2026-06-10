// src/utils/escudo.timer.js
const {
  todosLosEscudosActivos,
  eliminarEscudoActivo,
  marcarEscudoAvisado,
  formatearFechaEnTz,
} = require('../database/escudos.db')

const AVISO_ANTICIPACION = 10 * 60 * 1000

function iniciarTimer(sock) {
  console.log('⏱️ Timer de escudos iniciado')

  setInterval(async () => {
    const ahora   = Date.now()
    const activos = await todosLosEscudosActivos()

    for (const escudo of activos) {
      const diff = escudo.vence_en - ahora

      // Ya venció — eliminar sin avisar
      if (diff <= 0) {
        console.log(`🗑️ Escudo vencido eliminado: ${escudo.nombre}`)
        await eliminarEscudoActivo(escudo.jugador_id)
        continue
      }

      // Faltan ~10 min
      if (diff <= AVISO_ANTICIPACION + 30000 && !escudo.avisado) {
        const minutosReales = Math.ceil(diff / 1000 / 60)
        const tz            = escudo.timezone || 'America/Mexico_City'
        const horaVence     = formatearFechaEnTz(escudo.vence_en, tz)

        try {
          await sock.sendMessage(`${escudo.numero}@s.whatsapp.net`, {
            text:
              `⏰ *¡ATENCIÓN ${escudo.nombre}!*\n\n` +
              `🛡️ Tu escudo de *${escudo.tipo}* vence en aproximadamente *${minutosReales} minutos*.\n` +
              `🕐 Hora de vencimiento: *${horaVence}*\n\n` +
              `⚔️ ¡Recuerda renovarlo antes de que caiga!`
          })
          console.log(`✅ Aviso enviado a ${escudo.nombre}`)
          await marcarEscudoAvisado(escudo.jugador_id)
        } catch (err) {
          console.error(`Error enviando aviso a ${escudo.nombre}:`, err.message)
        }
      }
    }
  }, 60 * 1000)
}

module.exports = { iniciarTimer }