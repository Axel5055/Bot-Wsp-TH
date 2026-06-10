// src/commands/multicuentas/list.js
'use strict'

const {
  normalizeKey,
  parseIds,
  sortStrings,
  todosLosUsuarios,
  usuarioPorKey,
} = require('../../database/multicuentas.db')
const { leerCaza } = require('../../database/excel')

function getText(msg) {
  return msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
}

module.exports = {
  name: 'listcuentas',
  admin: false,

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid
    const body   = getText(msg).trim()
    if (!body) return

    try {
      const args = body.replace(/^[!/#.]\w+\s*/i, '').trim()
      const todos = await todosLosUsuarios()

      if (!todos.length) {
        return sock.sendMessage(chatId, { text: '⚠️ No hay usuarios registrados aún.' })
      }

      // Detalle de un usuario
      if (args) {
        const usuario = await usuarioPorKey(args)
        if (!usuario) {
          return sock.sendMessage(chatId, {
            text: `⚠️ No se encontró ningún usuario con el nombre *${args}*.`
          })
        }

        const ids    = parseIds(usuario.ids_juego)
        const caza   = leerCaza()
        const nombres = []
        const noEncontrados = []

        for (const id of ids) {
          const entrada = caza.find(f => f.igg_id === id)
          if (entrada) nombres.push(entrada.nombre)
          else noEncontrados.push(id)
        }

        let respuesta = `📋 *Detalle de ${usuario.nombre_dado}*\n`
        respuesta    += `🆔 IDs: ${ids.join(', ') || 'Ninguno'}\n`
        respuesta    += `💻 Cuentas: ${sortStrings(nombres).join(', ') || 'Ninguna'}\n`

        if (noEncontrados.length)
          respuesta += `⚠️ No encontrados en Excel: ${noEncontrados.join(', ')}`

        return sock.sendMessage(chatId, { text: respuesta.trim() })
      }

      // Lista global
      let respuesta = `📋 *Usuarios registrados (${todos.length}):*\n`
      for (const u of todos) {
        respuesta += `  • ${u.nombre_dado}\n`
      }
      respuesta += `\n💡 Usa \`#listcuentas Nombre\` para ver el detalle de un usuario.`

      return sock.sendMessage(chatId, { text: respuesta.trim() })

    } catch (err) {
      console.error('❌ [listcuentas]:', err)
      return sock.sendMessage(chatId, { text: '❌ Ocurrió un error. Inténtalo de nuevo.' })
    }
  }
}