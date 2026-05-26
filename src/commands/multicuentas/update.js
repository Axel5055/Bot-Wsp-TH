'use strict'

const isAdmin = require('../../utils/isAdmin')
const {
  getText,
  normalizeKey,
  parseIds,
  joinIds,
  sortStrings,
  sortIds,
  cargarMulticuentas,
  guardarMulticuentas,
  cargarCazaDesdeCache,
  obtenerNombresPorIds,
  filtrarIdsRepetidos,
} = require('../../utils/multiManager')

// ─── Comando ──────────────────────────────────────────────────────────────────
module.exports = {
  name: 'editcuentas',
  admin: false,
  description: 'Edita los IDs de un usuario: agregar (+), quitar (-) o reemplazar (=)',

  async execute(sock, msg) {
    const chatId   = msg.key.remoteJid
    const senderId = msg.key.participant || msg.key.remoteJid
    let   body     = getText(msg).trim()
    if (!body) return

    try {
      await sock.sendMessage(chatId, { react: { text: '📝', key: msg.key } })

      // Quitar prefijo del comando
      body = body.replace(/^[!/#.]\w+\s*/i, '').trim()

      const primerEspacio = body.indexOf(' ')
      if (primerEspacio === -1) {
        await sock.sendMessage(chatId, {
          text:
            '⚠️ *Uso correcto:*\n' +
            '`#editcuentas Nombre +ID1,ID2` → Agregar IDs\n' +
            '`#editcuentas Nombre -ID1,ID2` → Eliminar IDs\n' +
            '`#editcuentas Nombre =ID1,ID2` → Reemplazar todos los IDs\n\n' +
            '*Ejemplo:*\n' +
            '`#editcuentas Axel +123456789`'
        })
        return
      }

      const nombreDado = body.slice(0, primerEspacio).trim()
      let   idsRaw     = body.slice(primerEspacio + 1).trim()

      // ── Leer operador (+/-/=), por defecto "=" ────────────────────────────
      let action = '='
      if (['+', '-', '='].includes(idsRaw[0])) {
        action = idsRaw[0]
        idsRaw = idsRaw.slice(1).trim()
      }

      const ids = parseIds(idsRaw)
      if (!ids.length && action !== '-') {
        await sock.sendMessage(chatId, { text: '⚠️ Debes indicar al menos un ID.' })
        return
      }

      // ── Cargar datos ───────────────────────────────────────────────────────
      const base = cargarMulticuentas()
      const key  = normalizeKey(nombreDado)

      if (!base[key]) {
        await sock.sendMessage(chatId, {
          text: `⚠️ El usuario *${nombreDado}* no existe. Revisa el nombre e intenta de nuevo.`
        })
        return
      }

      // ── Permisos ───────────────────────────────────────────────────────────
      const mentions  = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid ?? []
      const esAdmin   = isAdmin(senderId)
      let   ownerId   = base[key].ownerId

      if (mentions.length > 0 && !esAdmin) {
        await sock.sendMessage(chatId, {
          text: '❌ Solo los administradores pueden editar cuentas ajenas con menciones.'
        })
        return
      }

      if (mentions.length > 0 && esAdmin) {
        ownerId = mentions[0]
      } else if (!esAdmin && ownerId !== senderId) {
        await sock.sendMessage(chatId, {
          text: `❌ No tienes permiso para editar las cuentas de *${nombreDado}*.`
        })
        return
      }

      // ── Cargar hoja Excel ──────────────────────────────────────────────────
      const hojaCaza = cargarCazaDesdeCache()
      if (!hojaCaza.length) {
        await sock.sendMessage(chatId, {
          text: '⚠️ No se pudo cargar la hoja Caza. Intenta más tarde.'
        })
        return
      }

      let actuales                  = parseIds(base[key].ids)
      let idsAgregados              = []
      let idsEliminados             = []
      let idsOmitidosNoEncontrados  = []
      let idsOmitidosRepetidos      = []

      // ── Aplicar operación ──────────────────────────────────────────────────
      if (action === '+') {
        const { idsValidos, noEncontrados } = obtenerNombresPorIds(ids, hojaCaza)
        const { permitidos, repetidos }     = filtrarIdsRepetidos(idsValidos, base, key)

        for (const id of permitidos) {
          if (!actuales.includes(id)) {
            actuales.push(id)
            idsAgregados.push(id)
          }
        }
        idsOmitidosNoEncontrados = noEncontrados
        idsOmitidosRepetidos     = repetidos

      } else if (action === '-') {
        for (const id of ids) {
          if (actuales.includes(id)) {
            actuales    = actuales.filter(i => i !== id)
            idsEliminados.push(id)
          }
        }

      } else { // '='
        const { idsValidos, noEncontrados } = obtenerNombresPorIds(ids, hojaCaza)
        const { permitidos, repetidos }     = filtrarIdsRepetidos(idsValidos, base, key)

        actuales                 = permitidos
        idsAgregados             = permitidos
        idsOmitidosNoEncontrados = noEncontrados
        idsOmitidosRepetidos     = repetidos
      }

      // ── Actualizar nombres y guardar ───────────────────────────────────────
      const { nombres: nombresFinales } = obtenerNombresPorIds(actuales, hojaCaza)
      const actualesOrdenados           = sortIds(actuales)

      base[key].ids              = joinIds(actualesOrdenados)
      base[key].nombresDeCuentas = sortStrings(nombresFinales).join(', ')
      base[key].ownerId          = ownerId

      guardarMulticuentas(base)

      // ── Respuesta ──────────────────────────────────────────────────────────
      let respuesta = `📌 *Multicuentas de ${nombreDado} actualizadas*\n\n`

      if (action === '+') respuesta += `➕ IDs agregados: ${idsAgregados.join(', ') || 'Ninguno'}\n`
      if (action === '-') respuesta += `➖ IDs eliminados: ${idsEliminados.join(', ') || 'Ninguno'}\n`
      if (action === '=') respuesta += `🔄 IDs reemplazados completamente\n`

      respuesta += `🆔 IDs actuales: ${joinIds(actualesOrdenados) || 'Ninguno'}\n`
      respuesta += `💻 Cuentas: ${sortStrings(nombresFinales).join(', ') || 'Ninguna'}\n`

      if (idsOmitidosNoEncontrados.length)
        respuesta += `\n⚠️ *No encontrados en Excel:* ${idsOmitidosNoEncontrados.join(', ')}`

      if (idsOmitidosRepetidos.length)
        respuesta +=
          `\n⚠️ *IDs omitidos* (ya registrados por otro usuario):\n` +
          idsOmitidosRepetidos.map(r => `  🆔 ${r.id} → ${r.usuario}`).join('\n')

      await sock.sendMessage(chatId, { text: respuesta.trim() })

    } catch (err) {
      console.error('❌ [editcuentas] Error:', err)
      await sock.sendMessage(chatId, {
        text: '❌ Ocurrió un error al ejecutar el comando. Inténtalo de nuevo.'
      })
    }
  }
}
