const fs = require('fs')
const path = require('path')

const ACTIVOS_PATH = path.join(__dirname, '../data/escudos_activos.json')
const AVISO_ANTICIPACION = 10 * 60 * 1000 // 10 minutos antes

function cargarActivos() {
  try {
    return JSON.parse(fs.readFileSync(ACTIVOS_PATH, 'utf8'))
  } catch {
    return []
  }
}

function guardarActivos(activos) {
  fs.writeFileSync(ACTIVOS_PATH, JSON.stringify(activos, null, 2))
}

function iniciarTimer(sock) {
  console.log('⏱️ Timer de escudos iniciado')

  setInterval(async () => {
    const ahora = Date.now()
    const activos = cargarActivos()
    const restantes = []

    for (const escudo of activos) {
      const tiempoVencimiento = escudo.venceEn
      const diff = tiempoVencimiento - ahora

      // Ya venció — eliminar sin avisar
      if (diff <= 0) {
        console.log(`🗑️ Escudo vencido eliminado: ${escudo.nombre}`)
        continue
      }

      // Faltan exactamente 10 min (con margen de ±30 segundos para no perder el tick)
      if (diff <= AVISO_ANTICIPACION + 30000 && !escudo.avisado) {
        const minutosReales = Math.ceil(diff / 1000 / 60)
        try {
          await sock.sendMessage(`${escudo.numero}@s.whatsapp.net`, {
            text: `⏰ *¡ATENCIÓN ${escudo.nombre}!*\n\n🛡️ Tu escudo de *${escudo.tipo}* vence en aproximadamente *${minutosReales} minutos*.\n\n⚔️ ¡Recuerda renovarlo antes de que caiga!`
          })
          console.log(`✅ Aviso de escudo enviado a ${escudo.nombre}`)
          escudo.avisado = true
        } catch (err) {
          console.error(`Error enviando aviso a ${escudo.nombre}:`, err.message)
        }
      }

      restantes.push(escudo)
    }

    guardarActivos(restantes)
  }, 60 * 1000) // revisar cada minuto
}

module.exports = { iniciarTimer, cargarActivos, guardarActivos }