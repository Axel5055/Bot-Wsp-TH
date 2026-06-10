// src/commands/escudos/miescudo.js
const {
  jugadoresPorJid,
  buscarJugador,
  escudoActivoPorJugadorId,
  formatearFechaEnTz,
  detectarInfo,
} = require('../../database/escudos.db')

function formatearTiempoRestante(ms) {
  if (ms <= 0) return 'Vencido'
  const dias    = Math.floor(ms / (1000 * 60 * 60 * 24))
  const horas   = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutos = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
  if (dias > 0)  return `${dias}d ${horas}h ${minutos}m`
  if (horas > 0) return `${horas}h ${minutos}m`
  return `${minutos}m`
}

function getTz(jugador)   { return jugador.timezone || detectarInfo(jugador.numero).tz }
function getPais(jugador) { return jugador.pais     || detectarInfo(jugador.numero).pais }

function seccionEscudo(escudoActivo, tz) {
  if (!escudoActivo) return '🛡️ Sin escudo activo'
  const diff = escudoActivo.vence_en - Date.now()
  return (
    `🛡️ *Escudo:* ${escudoActivo.tipo}\n` +
    `   🕐 Iniciado: ${formatearFechaEnTz(escudoActivo.puesto_en, tz)}\n` +
    `   ⏰ Vence:    ${formatearFechaEnTz(escudoActivo.vence_en, tz)}\n` +
    `   ⏳ Restante: ${formatearTiempoRestante(diff)}`
  )
}

async function bloquesCuentas(cuentas) {
  const bloques = []
  for (let i = 0; i < cuentas.length; i++) {
    const cuenta = cuentas[i]
    const escudoActivo = await escudoActivoPorJugadorId(cuenta.id)
    const tz   = getTz(cuenta)
    const pais = getPais(cuenta)
    bloques.push(
      `━━━ Cuenta ${i + 1} ━━━\n` +
      `👤 *${cuenta.nombre}*  [ID: ${cuenta.id}  |  ****${cuenta.tag}]\n` +
      `📱 +${cuenta.numero}  |  🌍 ${pais}\n\n` +
      seccionEscudo(escudoActivo, tz)
    )
  }
  return bloques.join('\n\n')
}

module.exports = {
  name: 'miescudo',
  admin: false,
  mensajero: false,

  execute: async (sock, msg) => {
    const chatId    = msg.key.remoteJid
    const jid       = msg.key.participant || msg.key.remoteJid
    const texto     = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const parametro = texto.replace(/^#\S+\s*/i, '').trim()

    // Sin parámetro → perfil propio
    if (!parametro) {
      const cuentas = await jugadoresPorJid(jid)

      if (cuentas.length === 0) {
        return sock.sendMessage(chatId, {
          text: '❌ No tienes ningún registro. Usa *#addescudo NombreIngame, NumeroConLada* para registrarte.'
        })
      }

      if (cuentas.length === 1) {
        const escudoActivo = await escudoActivoPorJugadorId(cuentas[0].id)
        const tz   = getTz(cuentas[0])
        const pais = getPais(cuentas[0])
        return sock.sendMessage(chatId, {
          text:
            `📋 *Mi Perfil*\n\n` +
            `👤 *Nombre:* ${cuentas[0].nombre}\n` +
            `🪪 *ID:* ${cuentas[0].id}  |  🔖 ****${cuentas[0].tag}\n` +
            `📱 *Número:* +${cuentas[0].numero}\n` +
            `🌍 *País:* ${pais}\n\n` +
            seccionEscudo(escudoActivo, tz) +
            `\n\n_Usa #editescudo para modificar tu perfil._\n\n🅣🅗 - 🅑🅞🅣`
        })
      }

      return sock.sendMessage(chatId, {
        text: `📋 *Mis Cuentas* (${cuentas.length})\n\n${await bloquesCuentas(cuentas)}\n\n_Usa #editescudo ID para modificar una cuenta._\n\n🅣🅗 - 🅑🅞🅣`
      })
    }

    // Con parámetro → buscar jugador
    const { jugador, tipo, coincidencias } = await buscarJugador(parametro)

    if (tipo === 'tag_duplicado') {
      const lista = coincidencias.map(r => `▫️ [ID: ${r.id}] *${r.nombre}*`).join('\n')
      return sock.sendMessage(chatId, {
        text: `⚠️ Hay *${coincidencias.length}* registros con el tag *${parametro}*:\n\n${lista}\n\nUsa el *ID* o el *nombre* para identificarlo.`
      })
    }

    if (!jugador) {
      const mensajes = {
        id:     `❌ No existe ningún registro con ID *${parametro}*.`,
        tag:    `❌ No existe ningún registro con los últimos 4 dígitos *${parametro}*.`,
        nombre: `❌ No se encontró ningún registro con el nombre *${parametro}*.`,
      }
      return sock.sendMessage(chatId, { text: mensajes[tipo] })
    }

    // Si tiene más cuentas bajo el mismo JID mostrarlas todas
    const cuentasDelJid = await jugadoresPorJid(jugador.jid)
    if (cuentasDelJid.length > 1) {
      return sock.sendMessage(chatId, {
        text: `📋 *Cuentas de ${jugador.nombre}* (${cuentasDelJid.length})\n\n${await bloquesCuentas(cuentasDelJid)}\n\n🅣🅗 - 🅑🅞🅣`
      })
    }

    const escudoActivo = await escudoActivoPorJugadorId(jugador.id)
    const tz   = getTz(jugador)
    const pais = getPais(jugador)
    return sock.sendMessage(chatId, {
      text:
        `📋 *Perfil de ${jugador.nombre}*\n\n` +
        `👤 *Nombre:* ${jugador.nombre}\n` +
        `🪪 *ID:* ${jugador.id}  |  🔖 ****${jugador.tag}\n` +
        `📱 *Número:* +${jugador.numero}\n` +
        `🌍 *País:* ${pais}\n\n` +
        seccionEscudo(escudoActivo, tz) +
        `\n\n🅣🅗 - 🅑🅞🅣`
    })
  }
}