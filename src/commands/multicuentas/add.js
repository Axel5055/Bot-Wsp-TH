'use strict'

const isAdmin = require('../../utils/isAdmin')
const {
  getText,
  normalizeKey,
  parseIds,
  joinIds,
  sortStrings,
  cargarMulticuentas,
  guardarMulticuentas,
  cargarCazaDesdeCache,
  obtenerNombresPorIds,
  filtrarIdsRepetidos,
} = require('../../utils/multiManager')

// ─── Comando ──────────────────────────────────────────────────────────────────
module.exports = {
  name: 'addcuentas',
  admin: false,
  description: 'Registra tus IGG IDs asociados a un nombre de usuario',

  async execute(sock, msg) {
    const chatId   = msg.key.remoteJid
    const senderId = msg.key.participant || msg.key.remoteJid
    let   body     = getText(msg).trim()
    if (!body) return

    try {
      await sock.sendMessage(chatId, { react: { text: '📝', key: msg.key } })

      // Quitar prefijo del comando (#addcuentas, /addcuentas, etc.)
      body = body.replace(/^[!/#.]\w+\s*/i, '').trim()

      const primerEspacio = body.indexOf(' ')
      if (primerEspacio === -1) {
        await sock.sendMessage(chatId, {
          text:
            '⚠️ *Uso correcto:*\n' +
            '`#addcuentas Nombre ID1,ID2`\n\n' +
            '*Ejemplo:*\n' +
            '`#addcuentas Axel 123456789,987654321`'
        })
        return
      }

      const nombreDado = body.slice(0, primerEspacio).trim()
      const idsRaw     = body.slice(primerEspacio + 1).trim()

      // ── Menciones ─────────────────────────────────────────────────────────
      const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid ?? []

      if (mentions.length > 0 && !isAdmin(senderId)) {
        await sock.sendMessage(chatId, {
          text: '❌ Solo los admins pueden registrar cuentas para otros usando menciones.'
        })
        return
      }

      // Filtrar tokens "@..." que WhatsApp inyecta en el cuerpo del mensaje
      const ids = parseIds(
        idsRaw.split(',').filter(i => !i.trim().startsWith('@')).join(',')
      )

      if (!ids.length) {
        await sock.sendMessage(chatId, { text: '⚠️ No se detectaron IDs válidos.' })
        return
      }

      // ── Cargar datos ───────────────────────────────────────────────────────
      const base = cargarMulticuentas()

      // ── Determinar propietario ─────────────────────────────────────────────
      let ownerId
      if (mentions.length > 0) {
        ownerId = mentions[0]
        if (Object.values(base).some(u => u.ownerId === ownerId)) {
          await sock.sendMessage(chatId, {
            text: '❌ El usuario mencionado ya tiene cuentas registradas.'
          })
          return
        }
      } else {
        ownerId = senderId
        if (Object.values(base).some(u => u.ownerId === senderId)) {
          await sock.sendMessage(chatId, { text: '❌ Ya tienes cuentas registradas.' })
          return
        }
      }

      // ── Verificar nombre duplicado ─────────────────────────────────────────
      const key = normalizeKey(nombreDado)
      if (base[key]) {
        await sock.sendMessage(chatId, {
          text: `⚠️ El nombre *${nombreDado}* ya está en uso. Elige otro.`
        })
        return
      }

      // ── Validar IDs contra Excel ───────────────────────────────────────────
      const hojaCaza = cargarCazaDesdeCache()
      if (!hojaCaza.length) {
        await sock.sendMessage(chatId, { text: '⚠️ No se pudo cargar la hoja Caza. Intenta más tarde.' })
        return
      }

      const { nombres, idsValidos, noEncontrados } = obtenerNombresPorIds(ids, hojaCaza)
      if (!idsValidos.length) {
        await sock.sendMessage(chatId, { text: '⚠️ Ningún ID fue encontrado en el Excel de Cacería.' })
        return
      }

      // ── Descartar IDs ya registrados por otro usuario ──────────────────────
      const { permitidos, repetidos } = filtrarIdsRepetidos(idsValidos, base)
      if (!permitidos.length) {
        await sock.sendMessage(chatId, {
          text:
            '⚠️ Todos los IDs ya están registrados:\n' +
            repetidos.map(r => `  🆔 ${r.id} → ${r.usuario}`).join('\n')
        })
        return
      }

      // Nombres que corresponden solo a los IDs permitidos
      const indexPermitidos  = new Set(permitidos)
      const nombresPermitidos = nombres.filter((_, i) => indexPermitidos.has(idsValidos[i]))

      // ── Guardar ────────────────────────────────────────────────────────────
      base[key] = {
        nombreDado,
        ids:              joinIds(permitidos),
        nombresDeCuentas: sortStrings(nombresPermitidos).join(', '),
        ownerId,
      }
      guardarMulticuentas(base)

      // ── Respuesta ──────────────────────────────────────────────────────────
      let respuesta = `🎉 *CUENTAS AGREGADAS* 🎉\n\n`
      respuesta    += `👤 Usuario: *${nombreDado}*\n`
      respuesta    += `🆔 IDs: ${joinIds(permitidos)}\n`
      respuesta    += `💻 Cuentas: ${nombresPermitidos.join(', ')}\n`

      if (repetidos.length)
        respuesta +=
          `\n⚠️ *IDs omitidos* (ya registrados):\n` +
          repetidos.map(r => `  🆔 ${r.id} → ${r.usuario}`).join('\n')

      if (noEncontrados.length)
        respuesta += `\n❌ *No encontrados en Excel:* ${noEncontrados.join(', ')}`

      await sock.sendMessage(chatId, { text: respuesta })

    } catch (error) {
      console.error('❌ [addcuentas] Error:', error)
      await sock.sendMessage(chatId, {
        text: '❌ Ocurrió un error al ejecutar el comando. Inténtalo de nuevo.'
      })
    }
  }
}
