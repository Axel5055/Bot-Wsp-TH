'use strict'

const { admins }  = require('../../config/settings')
const {
  getText,
  normalizeKey,
  parseIds,
  cargarMulticuentas,
  guardarMulticuentas,
  cargarCazaDesdeCache,
  construirParesOrdenados,
} = require('../../utils/multiManager')

// ─── Comando ──────────────────────────────────────────────────────────────────
module.exports = {
  name: 'refreshcuentas',
  admin: false,
  description: 'Actualiza los nombres de las cuentas desde la hoja Caza del Excel',
  category: 'multicuentas',

  async execute(sock, msg) {
    const chatId   = msg.key.remoteJid
    const senderId = msg.key.participant || msg.key.remoteJid
    const esAdmin  = admins.includes(senderId)

    const body = getText(msg).trim()
    if (!body) return

    try {
      await sock.sendMessage(chatId, { react: { text: '🔄', key: msg.key } })

      // Quitar prefijo del comando
      const args = body.replace(/^[!/#.]\w+\s*/i, '').trim()
                       .split(/\s+/).filter(Boolean)

      // ── Validar Excel ──────────────────────────────────────────────────────
      const hojaCaza = cargarCazaDesdeCache()
      if (!hojaCaza.length) {
        await sock.sendMessage(chatId, {
          text: '⚠️ No se pudo cargar la hoja Caza. Intenta más tarde.'
        })
        return
      }

      // ── Validar registros ──────────────────────────────────────────────────
      const base = cargarMulticuentas()
      if (!Object.keys(base).length) {
        await sock.sendMessage(chatId, {
          text: '⚠️ No hay registros para actualizar.'
        })
        return
      }

      // ── Determinar qué claves actualizar ──────────────────────────────────
      let keysAActualizar = []

      if (esAdmin) {
        if (args.length) {
          // Admin indicó un nombre → actualizar solo ese (si existe), sino todos
          const key = normalizeKey(args[0])
          keysAActualizar = base[key] ? [key] : Object.keys(base)
        } else {
          keysAActualizar = Object.keys(base)
        }
      } else {
        // Usuario normal: debe indicar su propio nombre
        if (!args.length) {
          await sock.sendMessage(chatId, {
            text: '❌ Indica tu nombre de usuario:\n`#refreshcuentas TuNombre`'
          })
          return
        }
        const key   = normalizeKey(args[0])
        const entry = base[key]

        if (!entry) {
          await sock.sendMessage(chatId, {
            text: `⚠️ El usuario *${args[0]}* no existe.`
          })
          return
        }
        if (entry.ownerId !== senderId) {
          await sock.sendMessage(chatId, {
            text: '❌ Solo puedes actualizar tus propias cuentas.'
          })
          return
        }
        keysAActualizar.push(key)
      }

      // ── Procesar actualizaciones ───────────────────────────────────────────
      const nombresActualizados    = []
      const idsNoEncontradosGlobal = []

      for (const key of keysAActualizar) {
        const entry = base[key]
        const ids   = parseIds(entry.ids)

        const { idsOrdenados, nombresOrdenados, idsNoEncontrados } =
          construirParesOrdenados(ids, hojaCaza)

        idsNoEncontrados.forEach(id => idsNoEncontradosGlobal.push(id))

        // Solo guardar si algo cambió
        if (nombresOrdenados !== entry.nombresDeCuentas || idsOrdenados !== entry.ids) {
          entry.ids              = idsOrdenados
          entry.nombresDeCuentas = nombresOrdenados
          nombresActualizados.push(`  • *${entry.nombreDado}*: ${nombresOrdenados}`)
        }
      }

      guardarMulticuentas(base)

      // ── Respuesta ──────────────────────────────────────────────────────────
      const total = nombresActualizados.length
      let mensajeFinal =
        `🔄 *Actualización completada*\n` +
        `✅ ${total} usuario${total !== 1 ? 's' : ''} actualizado${total !== 1 ? 's' : ''}`

      if (total)
        mensajeFinal += `\n\n📋 *Cambios detectados:*\n${nombresActualizados.join('\n')}`
      else
        mensajeFinal += `\n\n✨ Todo estaba al día, no hubo cambios.`

      if (idsNoEncontradosGlobal.length)
        mensajeFinal += `\n\n⚠️ *IDs sin match en Excel:* ${idsNoEncontradosGlobal.join(', ')}`

      await sock.sendMessage(chatId, { text: mensajeFinal })

    } catch (err) {
      console.error('❌ [refreshcuentas] Error:', err)
      await sock.sendMessage(chatId, {
        text: '❌ Ocurrió un error al ejecutar el comando. Inténtalo de nuevo.'
      })
    }
  }
}
