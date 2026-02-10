const fs = require('fs')
const path = require('path')
const xlsx = require('xlsx')
const { getSheet } = require('../../cache/excelCache')
const isAdmin = require('../../utils/isAdmin') // tu función isAdmin

// Archivo JSON
const FILE_MULTICUENTAS = path.join(__dirname, '../../data/multicuentas.json')

// ======================
// UTILIDADES
// ======================
function getText(msg) {
  return (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    ''
  )
}

function normalizeKey(name) {
  return String(name || '').trim().toLowerCase()
}

function parseIds(raw) {
  return String(raw || '')
    .split(',')
    .map(i => i.trim())
    .filter(Boolean)
}

function joinIds(ids) {
  return ids.join(', ')
}

function sortStrings(arr) {
  return arr.slice().sort((a, b) => a.localeCompare(b))
}

// ======================
// EXCEL (CACHE)
// ======================
function cargarCazaDesdeCache() {
  const sheet = getSheet('Caza')
  if (!sheet) return []
  return xlsx.utils.sheet_to_json(sheet, { defval: '' })
}

// ======================
// JSON
// ======================
function cargarMulticuentas() {
  if (!fs.existsSync(FILE_MULTICUENTAS)) return {}
  try {
    return JSON.parse(fs.readFileSync(FILE_MULTICUENTAS, 'utf8'))
  } catch {
    return {} // archivo vacío o corrupto
  }
}

function guardarMulticuentas(base) {
  fs.writeFileSync(FILE_MULTICUENTAS, JSON.stringify(base, null, 2), 'utf8')
}

// ======================
// VALIDACIONES
// ======================
function obtenerNombresPorIds(ids, hoja) {
  const nombres = []
  const idsValidos = []
  const noEncontrados = []

  ids.forEach(id => {
    const reg = hoja.find(r => String(r['IGG ID']).trim() === id)
    if (reg) {
      nombres.push(String(reg['Nombre'] || 'Desconocido').trim())
      idsValidos.push(id)
    } else {
      noEncontrados.push(id)
    }
  })

  return { nombres, idsValidos, noEncontrados }
}

function filtrarIdsRepetidos(ids, base) {
  const permitidos = []
  const repetidos = []

  ids.forEach(id => {
    let existe = false
    for (const key in base) {
      const registrados = base[key].ids.split(',').map(i => i.trim())
      if (registrados.includes(id)) {
        repetidos.push({ id, usuario: base[key].nombreDado })
        existe = true
        break
      }
    }
    if (!existe) permitidos.push(id)
  })

  return { permitidos, repetidos }
}

// ======================
// COMANDO
// ======================
module.exports = {
  name: 'addcuentas',
  admin: false, // todos pueden usarlo

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid
    const senderId = msg.key.participant || msg.key.remoteJid
    let body = getText(msg).trim()
    if (!body) return

    try {
      await sock.sendMessage(chatId, { react: { text: '📝', key: msg.key } })

      // 🔹 Quitamos el comando
      body = body.replace(/^[!/#.]\w+\s+/i, '')

      const primerEspacio = body.indexOf(' ')
      if (primerEspacio === -1) {
        await sock.sendMessage(chatId, {
          text:
            '⚠️ Uso correcto:\n' +
            '#addcuentas Nombre IGGID1,IGGID2\n\n' +
            'Ejemplo:\n' +
            '#addcuentas Axel 123,456'
        })
        return
      }

      const nombreDado = body.slice(0, primerEspacio).trim()
      let idsRaw = body.slice(primerEspacio + 1).trim()

      // 🔹 Detectar menciones
      const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []

      // 🔹 Validar permisos si hay mención
      if (mentions.length > 0 && !isAdmin(senderId)) {
        await sock.sendMessage(chatId, {
          text: '❌ Solo los admins pueden registrar cuentas para otros usando menciones.'
        })
        return
      }

      // 🔹 Quitar menciones de los IDs y cualquier elemento que empiece con @
      let rawIdsArray = idsRaw.split(',').map(i => i.trim()).filter(Boolean)
      const idsFinales = rawIdsArray.filter(i => !i.startsWith('@'))

      const ids = parseIds(idsFinales.join(','))

      if (!ids.length) {
        await sock.sendMessage(chatId, { text: '⚠️ No se detectaron IDs válidos.' })
        return
      }

      // 🔹 JSON base
      const base = cargarMulticuentas()

      // 🔹 Determinar ownerId
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
          await sock.sendMessage(chatId, {
            text: '❌ Ya tienes cuentas registradas.'
          })
          return
        }
      }

      // 🔹 Validar IDs contra Excel
      const hojaCaza = cargarCazaDesdeCache()
      const { nombres, idsValidos, noEncontrados } = obtenerNombresPorIds(ids, hojaCaza)
      if (!idsValidos.length) {
        await sock.sendMessage(chatId, { text: '⚠️ Ningún ID válido encontrado en Excel.' })
        return
      }

      const key = normalizeKey(nombreDado)
      if (base[key]) {
        await sock.sendMessage(chatId, { text: `⚠️ El usuario *${nombreDado}* ya existe.` })
        return
      }

      const { permitidos, repetidos } = filtrarIdsRepetidos(idsValidos, base)
      if (!permitidos.length) {
        await sock.sendMessage(chatId, {
          text:
            '⚠️ Todos los IDs ya están registrados:\n' +
            repetidos.map(r => `🆔 ${r.id} → ${r.usuario}`).join('\n')
        })
        return
      }

      const nombresFinales = nombres.filter((_, i) => permitidos.includes(idsValidos[i]))

      // 🔹 Guardar
      base[key] = {
        nombreDado,
        ids: joinIds(permitidos),
        nombresDeCuentas: sortStrings(nombresFinales).join(', '),
        ownerId
      }
      guardarMulticuentas(base)

      // 🔹 Mensaje final
      let respuesta = `🎉 *CUENTAS AGREGADAS* 🎉\n\n`
      respuesta += `👤 Usuario: ${nombreDado}\n`
      respuesta += `🆔 IDs: ${joinIds(permitidos)}\n`
      respuesta += `💻 Cuentas: ${nombresFinales.join(', ')}\n`

      if (repetidos.length)
        respuesta += `\n⚠️ Omitidos:\n${repetidos.map(r => `🆔 ${r.id} → ${r.usuario}`).join('\n')}`

      if (noEncontrados.length)
        respuesta += `\n❌ No encontrados en Excel:\n${noEncontrados.join(', ')}`

      await sock.sendMessage(chatId, { text: respuesta })
    } catch (error) {
      console.error('❌ Error en comando /addcuentas:', error)
      await sock.sendMessage(chatId, { text: '❌ Ocurrió un error al ejecutar el comando.' })
    }
  }
}
