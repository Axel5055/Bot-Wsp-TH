const { cargarRegistros, guardarRegistros, buscarPorJid, buscarPorNombre, validarTelefono } = require('../../utils/escudos.utils')
const isAdmin = require('../../utils/isAdmin')

module.exports = {
  name: 'editescudo',
  keywords: ['editarme', 'editescudo'],
  admin: false,
  mensajero: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid
    const senderJid = msg.key.participant || msg.key.remoteJid
    const texto = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const adminEjecutando = isAdmin(senderJid)

    const contenido = texto.replace(/^#\S+\s*/i, '').trim()
    const partes = contenido.split(',').map(p => p.trim())

    // ── Modo admin: #editescudo NombreActual, NombreNuevo, NumeroNuevo ──
    if (partes.length === 3 || adminEjecutando && partes.length === 3) {

      if (!adminEjecutando) {
        return await sock.sendMessage(chatId, {
          text: '⛔ Solo los administradores pueden editar el registro de otros usuarios.'
        })
      }

      const [nombreActual, nombreNuevo, numeroNuevo] = partes

      if (!nombreActual || !nombreNuevo || !numeroNuevo) {
        return await sock.sendMessage(chatId, {
          text: '📋 Formato para admin:\n*#editescudo NombreActual, NombreNuevo, NumeroNuevo*\n\nEjemplo:\n#editescudo SoNy, SoNy_RoK, 5215598765432'
        })
      }

      const registro = buscarPorNombre(nombreActual)

      if (!registro) {
        return await sock.sendMessage(chatId, {
          text: `❌ No existe ningún registro con el nombre *${nombreActual}*.`
        })
      }

      if (!validarTelefono(numeroNuevo)) {
        return await sock.sendMessage(chatId, {
          text: '⚠️ Número inválido. Recuerda incluir la lada de país sin el +.\n\nEjemplo México: 5215512345678'
        })
      }

      const registros = cargarRegistros()
      const index = registros.findIndex(r => r.jid === registro.jid)
      registros[index].nombre = nombreNuevo
      registros[index].numero = numeroNuevo
      guardarRegistros(registros)

      return await sock.sendMessage(chatId, {
        text: `✅ Registro actualizado por admin.\n\n👤 *Nombre anterior:* ${nombreActual}\n👤 *Nombre nuevo:* ${nombreNuevo}\n📱 *Número nuevo:* ${numeroNuevo}`
      })
    }

    // ── Modo normal: #editescudo NombreNuevo, NumeroNuevo ──
    if (partes.length === 2) {
      const [nombreNuevo, numeroNuevo] = partes

      if (!buscarPorJid(senderJid)) {
        return await sock.sendMessage(chatId, {
          text: '❌ No tienes ningún registro. Usa *#addescudo* primero.'
        })
      }

      if (!nombreNuevo) {
        return await sock.sendMessage(chatId, { text: '⚠️ El nombre no puede estar vacío.' })
      }

      if (!validarTelefono(numeroNuevo)) {
        return await sock.sendMessage(chatId, {
          text: '⚠️ Número inválido. Recuerda incluir la lada de país sin el +.'
        })
      }

      const registros = cargarRegistros()
      const index = registros.findIndex(r => r.jid === senderJid)
      registros[index].nombre = nombreNuevo
      registros[index].numero = numeroNuevo
      guardarRegistros(registros)

      return await sock.sendMessage(chatId, {
        text: `✅ Registro actualizado.\n\n👤 *Nombre:* ${nombreNuevo}\n📱 *Número:* ${numeroNuevo}\n\n🅣🅗 - 🅑🅞🅣`
      })
    }

    // ── Formato incorrecto ──
    return await sock.sendMessage(chatId, {
      text: `📋 *Uso del comando:*\n\n👤 *Miembros:*\n#editescudo NombreNuevo, NumeroNuevo\n\n🔑 *Admins:*\n#editescudo NombreActual, NombreNuevo, NumeroNuevo`
    })
  }
}