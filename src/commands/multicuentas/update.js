// src/commands/multicuentas/update.js
'use strict'

const isAdmin = require('../../utils/isAdmin')
const {
  normalizeKey,
  parseIds,
  joinIds,
  sortStrings,
  sortIds,
  todosLosUsuarios,
  usuarioPorKey,
  actualizarUsuario,
} = require('../../database/multicuentas.db')
const { leerCaza } = require('../../database/excel')

function getText(msg) {
  return msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
}

module.exports = {
  name: 'editcuentas',
  admin: false,

  async execute(sock, msg) {
    const chatId   = msg.key.remoteJid
    const senderId = msg.key.participant || msg.key.remoteJid
    let   body     = getText(msg).trim()
    if (!body) return

    try {
      await sock.sendMessage(chatId, { react: { text: '📝', key: msg.key } })

      body = body.replace(/^[!/#.]\w+\s*/i, '').trim()

      const primerEspacio = body.indexOf(' ')
      if (primerEspacio === -1) {
        return sock.sendMessage(chatId, {
          text:
            '⚠️ *Uso correcto:*\n' +
            '`#editcuentas Nombre +ID1,ID2` → Agregar IDs\n' +
            '`#editcuentas Nombre -ID1,ID2` → Eliminar IDs\n' +
            '`#editcuentas Nombre =ID1,ID2` → Reemplazar todos los IDs\n\n' +
            '*Ejemplo:*\n' +
            '`#editcuentas Axel +123456789`'
        })
      }

      const nombreDado = body.slice(0, primerEspacio).trim()
      let   idsRaw     = body.slice(primerEspacio + 1).trim()

      let action = '='
      if (['+', '-', '='].includes(idsRaw[0])) {
        action = idsRaw[0]
        idsRaw = idsRaw.slice(1).trim()
      }

      const ids = parseIds(idsRaw)
      if (!ids.length && action !== '-') {
        return sock.sendMessage(chatId, { text: '⚠️ Debes indicar al menos un ID.' })
      }

      const usuario = await usuarioPorKey(nombreDado)
      if (!usuario) {
        return sock.sendMessage(chatId, {
          text: `⚠️ El usuario *${nombreDado}* no existe.`
        })
      }

      // Permisos
      const esAdmin  = isAdmin(senderId)
      const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid ?? []

      if (mentions.length > 0 && !esAdmin) {
        return sock.sendMessage(chatId, {
          text: '❌ Solo los administradores pueden editar cuentas ajenas con menciones.'
        })
      }

      if (!esAdmin && usuario.owner_jid !== senderId) {
        return sock.sendMessage(chatId, {
          text: `❌ No tienes permiso para editar las cuentas de *${nombreDado}*.`
        })
      }

      const caza    = leerCaza()
      const todos   = await todosLosUsuarios()
      let actuales  = parseIds(usuario.ids_juego)

      const idsAgregados   = []
      const idsEliminados  = []
      const noEncontrados  = []
      const duplicados     = []

      if (action === '+') {
        for (const id of ids) {
          const entrada = caza.find(f => f.igg_id === id)
          if (!entrada) { noEncontrados.push(id); continue }
          const yaDeOtro = todos.find(u =>
            parseIds(u.ids_juego).includes(id) &&
            u.key_nombre !== normalizeKey(nombreDado)
          )
          if (yaDeOtro) { duplicados.push(`${id} → ${yaDeOtro.nombre_dado}`); continue }
          if (!actuales.includes(id)) {
            actuales.push(id)
            idsAgregados.push(id)
          }
        }

      } else if (action === '-') {
        for (const id of ids) {
          if (actuales.includes(id)) {
            actuales = actuales.filter(i => i !== id)
            idsEliminados.push(id)
          }
        }

      } else { // '='
        actuales = []
        for (const id of ids) {
          const entrada = caza.find(f => f.igg_id === id)
          if (!entrada) { noEncontrados.push(id); continue }
          const yaDeOtro = todos.find(u =>
            parseIds(u.ids_juego).includes(id) &&
            u.key_nombre !== normalizeKey(nombreDado)
          )
          if (yaDeOtro) { duplicados.push(`${id} → ${yaDeOtro.nombre_dado}`); continue }
          actuales.push(id)
          idsAgregados.push(id)
        }
      }

      // Actualizar nombres desde Excel
      const nombresActuales = actuales
        .map(id => caza.find(f => f.igg_id === id)?.nombre)
        .filter(Boolean)

      await actualizarUsuario(normalizeKey(nombreDado), {
        ids_juego:       actuales,
        nombres_cuentas: nombresActuales,
      })

      let respuesta = `📌 *Multicuentas de ${nombreDado} actualizadas*\n\n`
      if (action === '+') respuesta += `➕ IDs agregados: ${idsAgregados.join(', ') || 'Ninguno'}\n`
      if (action === '-') respuesta += `➖ IDs eliminados: ${idsEliminados.join(', ') || 'Ninguno'}\n`
      if (action === '=') respuesta += `🔄 IDs reemplazados completamente\n`
      respuesta += `🆔 IDs actuales: ${joinIds(sortIds(actuales)) || 'Ninguno'}\n`
      respuesta += `💻 Cuentas: ${sortStrings(nombresActuales).join(', ') || 'Ninguna'}\n`
      if (noEncontrados.length) respuesta += `\n❌ *No encontrados en Excel:* ${noEncontrados.join(', ')}`
      if (duplicados.length)    respuesta += `\n⚠️ *Ya registrados por otro:* ${duplicados.join(', ')}`

      return sock.sendMessage(chatId, { text: respuesta.trim() })

    } catch (err) {
      console.error('❌ [editcuentas]:', err)
      return sock.sendMessage(chatId, { text: '❌ Ocurrió un error. Inténtalo de nuevo.' })
    }
  }
}