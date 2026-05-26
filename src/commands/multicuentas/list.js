'use strict'

const {
  getText,
  normalizeKey,
  parseIds,
  sortStrings,
  cargarMulticuentas,
  cargarCazaDesdeCache,
  obtenerNombresPorIds,
} = require('../../utils/multiManager')

// ─── Comando ──────────────────────────────────────────────────────────────────
module.exports = {
  name: 'listcuentas',
  admin: false,
  description: 'Lista todos los usuarios registrados, o el detalle de uno en concreto',

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid
    const body   = getText(msg).trim()
    if (!body) return

    try {
      // Quitar prefijo del comando
      const args = body.replace(/^[!/#.]\w+\s*/i, '').trim()

      const base = cargarMulticuentas()

      if (!Object.keys(base).length) {
        await sock.sendMessage(chatId, { text: '⚠️ No hay usuarios registrados aún.' })
        return
      }

      let respuesta = ''

      // ── Detalle de un usuario ───────────────────────────────────────────────
      if (args) {
        const key = normalizeKey(args)
        if (!base[key]) {
          await sock.sendMessage(chatId, {
            text: `⚠️ No se encontró ningún usuario con el nombre *${args}*.`
          })
          return
        }

        const user      = base[key]
        const ids       = parseIds(user.ids)
        const hojaCaza  = cargarCazaDesdeCache()
        const { nombres, noEncontrados } = obtenerNombresPorIds(ids, hojaCaza)

        respuesta += `📋 *Detalle de ${user.nombreDado}*\n`
        respuesta += `🆔 IDs: ${ids.join(', ') || 'Ninguno'}\n`
        respuesta += `💻 Cuentas: ${sortStrings(nombres).join(', ') || 'Ninguna'}\n`
        if (noEncontrados.length)
          respuesta += `⚠️ No encontrados en Excel: ${noEncontrados.join(', ')}`

      // ── Lista global ────────────────────────────────────────────────────────
      } else {
        const usuarios = Object.values(base)
        respuesta += `📋 *Usuarios registrados (${usuarios.length}):*\n`
        // Ordenar la lista alfabéticamente
        const ordenados = usuarios.slice().sort((a, b) =>
          a.nombreDado.localeCompare(b.nombreDado)
        )
        for (const u of ordenados) {
          respuesta += `  • ${u.nombreDado}\n`
        }
        respuesta += `\n💡 Usa \`#listcuentas Nombre\` para ver el detalle de un usuario.`
      }

      await sock.sendMessage(chatId, { text: respuesta.trim() })

    } catch (err) {
      console.error('❌ [listcuentas] Error:', err)
      await sock.sendMessage(chatId, {
        text: '❌ Ocurrió un error al ejecutar el comando. Inténtalo de nuevo.'
      })
    }
  }
}
