const { buscarPorNombre, buscarPorId, cargarRegistros } = require('../../utils/escudos.utils')

const ALERTAS = [
  '🚨 *¡ESCUDO CAÍDO!* 🚨\n\n⚔️ ¡Entra YA al juego!\n¡Te están quemando la ciudad!',
  '🔥 *¡ALERTA MÁXIMA!* 🔥\n\n🛡️ Tu escudo ha caído.\n¡Escuda INMEDIATAMENTE o pierdes todo!',
  '⚠️ *¡PELIGRO!* ⚠️\n\n💀 Sin escudo = ciudad quemada.\n¡Entra ahora mismo!',
  '📢 *¡ÚLTIMA ADVERTENCIA!* 📢\n\n🔴 Llevas tiempo sin escudo.\n¡El reino está en riesgo!',
  '🆘 *¡SOS - ESCUDO CAÍDO!* 🆘\n\n🏰 ¡Tu ciudad está expuesta!\n¡Entra y escuda AHORA!'
]

const registroUsos = new Map()
const MAX_USOS = 3
const COOLDOWN_MS = 5 * 60 * 1000
const DELAY_ENTRE_MENSAJES = 3000

function obtenerEstado(key) {
  if (!registroUsos.has(key)) {
    registroUsos.set(key, { usos: 0, bloqueadoDesde: null })
  }
  return registroUsos.get(key)
}

function tiempoRestante(bloqueadoDesde) {
  return COOLDOWN_MS - (Date.now() - bloqueadoDesde)
}

function formatearTiempo(ms) {
  const minutos = Math.floor(ms / 1000 / 60)
  const segundos = Math.ceil((ms / 1000) % 60)
  if (minutos > 0 && segundos > 0) return `${minutos} min ${segundos} seg`
  if (minutos > 0) return `${minutos} min`
  return `${segundos} seg`
}

function buscarRegistro(parametro) {
  const registros = cargarRegistros()

  // Es ID: solo dígitos de cualquier longitud pero no exactamente 4
  if (/^\d+$/.test(parametro) && parametro.length !== 4) {
    return { registro: registros.find(r => r.id === parseInt(parametro)) || null, tipo: 'id' }
  }

  // Es tag: exactamente 4 dígitos
  if (/^\d{4}$/.test(parametro)) {
    const coincidencias = registros.filter(r => r.tag === parametro)
    if (coincidencias.length > 1) return { registro: null, tipo: 'tag_duplicado', coincidencias }
    return { registro: coincidencias[0] || null, tipo: 'tag' }
  }

  // Es nombre
  return {
    registro: registros.find(r => r.nombre.toLowerCase() === parametro.toLowerCase()) || null,
    tipo: 'nombre'
  }
}

module.exports = {
  name: 'escudo',
  keywords: ['escudo'],
  admin: false,
  mensajero: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid
    const texto = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const parametro = texto.replace(/^#\S+\s*/i, '').trim()

    if (!parametro) {
      return await sock.sendMessage(chatId, {
        text: '📋 Uso correcto:\n*#escudo NombreIngame*\n*#escudo ID*\n*#escudo 4digitos*\n\nEjemplos:\n#escudo SoNy\n#escudo 3\n#escudo 5678'
      })
    }

    const { registro, tipo, coincidencias } = buscarRegistro(parametro)

    // Caso especial: tag duplicado entre registros
    if (tipo === 'tag_duplicado') {
      const lista = coincidencias.map(r => `▫️ [ID: ${r.id}] *${r.nombre}*`).join('\n')
      return await sock.sendMessage(chatId, {
        text: `⚠️ Hay *${coincidencias.length}* registros con el tag *${parametro}*:\n\n${lista}\n\nUsa el *ID* o el *nombre* para identificar a quién alertar.`
      })
    }

    if (!registro) {
      const mensajes = {
        id: `❌ No existe ningún registro con ID *${parametro}*.`,
        tag: `❌ No existe ningún registro con los últimos 4 dígitos *${parametro}*.`,
        nombre: `❌ No se encontró ningún registro con el nombre *${parametro}*.`
      }
      return await sock.sendMessage(chatId, { text: mensajes[tipo] })
    }

    const key = registro.nombre.toLowerCase()
    const estado = obtenerEstado(key)

    if (estado.bloqueadoDesde !== null) {
      const restanteMs = tiempoRestante(estado.bloqueadoDesde)
      if (restanteMs > 0) {
        return await sock.sendMessage(chatId, {
          text: `⛔ *${registro.nombre}* está en cooldown por spam.\n\n⏳ Tiempo restante: *${formatearTiempo(restanteMs)}*`
        })
      }
      estado.usos = 0
      estado.bloqueadoDesde = null
    }

    estado.usos += 1

    if (estado.usos >= MAX_USOS) {
      estado.bloqueadoDesde = Date.now()
      estado.usos = 0
    }

    registroUsos.set(key, estado)

    const usosRestantes = MAX_USOS - estado.usos
    const destinoJid = `${registro.numero}@s.whatsapp.net`

    await sock.sendMessage(chatId, {
      text: `📡 Enviando alertas a *${registro.nombre}* (ID: ${registro.id} — ****${registro.tag})...${
        estado.bloqueadoDesde
          ? '\n\n⚠️ Límite alcanzado. Próximo uso en *5 minutos*.'
          : usosRestantes > 0
            ? `\n\n_Usos disponibles antes del cooldown: ${usosRestantes}_`
            : ''
      }`
    })

    // Reemplaza el loop de envío de alertas por este:
    for (let i = 0; i < ALERTAS.length; i++) {
      await new Promise(resolve => setTimeout(resolve, DELAY_ENTRE_MENSAJES))
      try {
        // Último mensaje: agregar instrucción de respuesta
        if (i === ALERTAS.length - 1) {
          await sock.sendMessage(destinoJid, {
            text: ALERTAS[i] + '\n\n💬 _Responde *voy* para notificar al gremio que ya vas entrando._\n\n🅣🅗 - 🅑🅞🅣'
          })
        } else {
          await sock.sendMessage(destinoJid, { text: ALERTAS[i] })
        }
      } catch (err) {
        console.error(`Error enviando alerta ${i + 1} a ${registro.numero}:`, err.message)
      }
    }

    return await sock.sendMessage(chatId, {
      text: `✅ *${registro.nombre}* notificado con 5 alertas.\n\n🅣🅗 - 🅑🅞🅣`
    })
  }
}