// src/commands/escudos/ponescudo.js
const {
  jugadoresPorJid,
  escudoActivoPorJugadorId,
  guardarEscudoActivo,
  formatearFechaEnTz,
  detectarInfo,
} = require('../../database/escudos.db')

const TIPOS_ESCUDO = {
  '4h':  4  * 60 * 60 * 1000,
  '8h':  8  * 60 * 60 * 1000,
  '12h': 12 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '3d':  3  * 24 * 60 * 60 * 1000,
  '7d':  7  * 24 * 60 * 60 * 1000,
  '14d': 14 * 24 * 60 * 60 * 1000,
}

async function registrarEscudo(sock, chatId, jid, jugador, tipo) {
  const ahora   = Date.now()
  const duracion = TIPOS_ESCUDO[tipo]
  const venceEn = ahora + duracion
  const tz      = jugador.timezone || detectarInfo(jugador.numero).tz
  const pais    = jugador.pais     || detectarInfo(jugador.numero).pais

  await guardarEscudoActivo({
    jugador_id: jugador.id,
    jid,
    nombre:   jugador.nombre,
    numero:   jugador.numero,
    timezone: tz,
    pais,
    tipo,
    puesto_en: ahora,
    vence_en:  venceEn,
    avisado:   false,
  })

  return sock.sendMessage(chatId, {
    text:
      `✅ *Escudo registrado correctamente*\n\n` +
      `👤 *Jugador:* ${jugador.nombre}\n` +
      `🛡️ *Tipo:* ${tipo}\n` +
      `🕐 *Puesto:* ${formatearFechaEnTz(ahora, tz)}\n` +
      `⏰ *Vence:* ${formatearFechaEnTz(venceEn, tz)}\n` +
      `🌍 *País:* ${pais}\n` +
      `🕰️ *Zona horaria:* ${tz}\n\n` +
      `_Te avisaré 10 minutos antes de que caiga._\n\n🅣🅗 - 🅑🅞🅣`
  })
}

module.exports = {
  name: 'ponescudo',
  admin: false,
  mensajero: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid
    const jid    = msg.key.participant || msg.key.remoteJid
    const texto  = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const params = texto.replace(/^#\S+\s*/i, '').trim().toLowerCase().split(/\s+/)

    const cuentasDelJid = await jugadoresPorJid(jid)
    const lista = Object.keys(TIPOS_ESCUDO).map(t => `• *${t}*`).join('\n')

    if (cuentasDelJid.length === 0) {
      return sock.sendMessage(chatId, {
        text: '❌ No estás registrado en el sistema de escudos.\n\nUsa *#addescudo NombreIngame, NumeroConLada* primero.'
      })
    }

    // Una sola cuenta
    if (cuentasDelJid.length === 1) {
      const tipo = params[0]
      if (!tipo || !TIPOS_ESCUDO[tipo]) {
        return sock.sendMessage(chatId, {
          text: `📋 Uso correcto:\n*#ponescudo TipoDeEscudo*\n\nEscudos disponibles:\n${lista}\n\nEjemplo:\n#ponescudo 8h`
        })
      }
      return registrarEscudo(sock, chatId, jid, cuentasDelJid[0], tipo)
    }

    // Múltiples cuentas
    const primerParam  = params[0]
    const segundoParam = params[1]

    if (!primerParam || TIPOS_ESCUDO[primerParam]) {
      const listaCuentas = cuentasDelJid
        .map(r => `▫️ [ID: *${r.id}*] *${r.nombre}* — ****${r.tag}`)
        .join('\n')
      return sock.sendMessage(chatId, {
        text: `⚠️ Tienes *${cuentasDelJid.length}* cuentas registradas. Especifica a cuál le pones el escudo:\n\n${listaCuentas}\n\nUso:\n*#ponescudo ID TipoDeEscudo*\n\nEjemplo:\n#ponescudo ${cuentasDelJid[0].id} 8h`
      })
    }

    const idBuscado = parseInt(primerParam)
    if (isNaN(idBuscado)) {
      return sock.sendMessage(chatId, {
        text: `⚠️ Formato incorrecto. Con múltiples cuentas debes indicar el ID primero.\n\nEjemplo:\n*#ponescudo ${cuentasDelJid[0].id} 8h*`
      })
    }

    const jugador = cuentasDelJid.find(r => r.id === idBuscado)
    if (!jugador) {
      const listaCuentas = cuentasDelJid.map(r => `▫️ [ID: *${r.id}*] *${r.nombre}*`).join('\n')
      return sock.sendMessage(chatId, {
        text: `❌ No tienes ninguna cuenta con ID *${idBuscado}*.\n\nTus cuentas:\n${listaCuentas}`
      })
    }

    if (!segundoParam || !TIPOS_ESCUDO[segundoParam]) {
      return sock.sendMessage(chatId, {
        text: `📋 Escudos disponibles:\n${lista}\n\nEjemplo:\n*#ponescudo ${jugador.id} 8h*`
      })
    }

    return registrarEscudo(sock, chatId, jid, jugador, segundoParam)
  }
}