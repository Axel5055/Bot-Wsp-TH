// src/commands/multicuentas/refresh.js
'use strict'

const { admins } = require('../../config/settings')
const {
  normalizeKey,
  parseIds,
  sortStrings,
  sortIds,
  todosLosUsuarios,
  actualizarUsuario,
} = require('../../database/multicuentas.db')
const {
  todosLosJugadores,
  editarJugador,
} = require('../../database/escudos.db')
const { leerCaza } = require('../../database/excel')

function getText(msg) {
  return msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
}

module.exports = {
  name: 'refreshcuentas',
  admin: false,

  async execute(sock, msg) {
    const chatId   = msg.key.remoteJid
    const senderId = msg.key.participant || msg.key.remoteJid
    const esAdmin  = admins.includes(senderId)
    const body     = getText(msg).trim()
    if (!body) return

    try {
      await sock.sendMessage(chatId, { react: { text: '🔄', key: msg.key } })

      const args = body.replace(/^[!/#.]\w+\s*/i, '').trim()
                       .split(/\s+/).filter(Boolean)

      // Leer Excel
      const caza = leerCaza()
      if (!caza.length) {
        return sock.sendMessage(chatId, {
          text: '⚠️ No se pudo cargar la hoja Caza del Excel. Intenta más tarde.'
        })
      }

      // Construir mapa rápido: igg_id → nombre actual en Excel
      const mapaExcel = {}
      for (const entrada of caza) {
        mapaExcel[entrada.igg_id] = entrada.nombre
      }

      // ── Detectar cambios en multicuentas ──────────────────────────────────
      const todos = await todosLosUsuarios()
      if (!todos.length) {
        return sock.sendMessage(chatId, { text: '⚠️ No hay registros para actualizar.' })
      }

      // Si no es admin debe especificar su nombre
      let usuariosARevisar = todos
      if (!esAdmin) {
        if (!args.length) {
          return sock.sendMessage(chatId, {
            text: '❌ Indica tu nombre de usuario:\n`#refreshcuentas TuNombre`'
          })
        }
        const usuario = todos.find(u => normalizeKey(u.nombre_dado) === normalizeKey(args[0]))
        if (!usuario) {
          return sock.sendMessage(chatId, {
            text: `⚠️ El usuario *${args[0]}* no existe.`
          })
        }
        if (usuario.owner_jid !== senderId) {
          return sock.sendMessage(chatId, {
            text: '❌ Solo puedes actualizar tus propias cuentas.'
          })
        }
        usuariosARevisar = [usuario]
      } else if (args.length) {
        // Admin con nombre específico
        const usuario = todos.find(u => normalizeKey(u.nombre_dado) === normalizeKey(args[0]))
        if (!usuario) {
          return sock.sendMessage(chatId, {
            text: `⚠️ El usuario *${args[0]}* no existe.`
          })
        }
        usuariosARevisar = [usuario]
      }

      const cambiosMulti = []
      const idsNoEncontrados = []

      for (const usuario of usuariosARevisar) {
        const ids = parseIds(usuario.ids_juego)
        const nombresNuevos = []
        let   huboCambio    = false

        for (const id of ids) {
          const nombreExcel = mapaExcel[id]
          if (!nombreExcel) {
            idsNoEncontrados.push(id)
            continue
          }
          nombresNuevos.push(nombreExcel)
        }

        const nombresActuales = usuario.nombres_cuentas
        const nombresNuevosStr = sortStrings(nombresNuevos).join(', ')

        if (nombresNuevosStr !== nombresActuales) {
          huboCambio = true
          cambiosMulti.push(`  • *${usuario.nombre_dado}*: ${nombresNuevosStr}`)
          await actualizarUsuario(usuario.key_nombre, {
            ids_juego:       ids,
            nombres_cuentas: nombresNuevos,
          })
        }
      }

      // ── Detectar cambios en jugadores (escudos) ───────────────────────────
      // Ahora usamos igg_id como llave — mucho más confiable que el nombre
      const cambiosEscudos = []
      const jugadores = await todosLosJugadores()

      // Solo jugadores que tienen igg_id registrado
      const jugadoresConId = jugadores.filter(j => j.igg_id && j.igg_id !== '')

      for (const jugador of jugadoresConId) {
        const nombreExcel = mapaExcel[jugador.igg_id]
        if (!nombreExcel) continue // IGG ID no está en el Excel esta semana, ignorar
        if (nombreExcel === jugador.nombre) continue // Sin cambio

        // Nombre cambió — actualizar
        cambiosEscudos.push(
          `  • *${jugador.nombre}* → *${nombreExcel}* (ID escudo: ${jugador.id})`
        )
        await editarJugador(jugador.id, { nombre: nombreExcel })
      }

      // ── Respuesta ─────────────────────────────────────────────────────────
      let mensaje =
        `🔄 *Actualización completada*\n` +
        `✅ ${usuariosARevisar.length} usuario${usuariosARevisar.length !== 1 ? 's' : ''} revisado${usuariosARevisar.length !== 1 ? 's' : ''}`

      if (cambiosMulti.length)
        mensaje += `\n\n📋 *Cambios en multicuentas:*\n${cambiosMulti.join('\n')}`
      else
        mensaje += `\n\n✨ Multicuentas al día, no hubo cambios.`

      if (cambiosEscudos.length)
        mensaje += `\n\n🛡️ *Cambios en escudos:*\n${cambiosEscudos.join('\n')}`
      else
        mensaje += `\n\n🛡️ Escudos al día, no hubo cambios.`

      if (idsNoEncontrados.length)
        mensaje += `\n\n⚠️ *IDs sin match en Excel:* ${idsNoEncontrados.join(', ')}`

      return sock.sendMessage(chatId, { text: mensaje })

    } catch (err) {
      console.error('❌ [refreshcuentas]:', err)
      return sock.sendMessage(chatId, { text: '❌ Ocurrió un error. Inténtalo de nuevo.' })
    }
  }
}