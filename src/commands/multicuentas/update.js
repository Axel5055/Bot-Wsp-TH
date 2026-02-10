const fs = require('fs')
const path = require('path')
const xlsx = require('xlsx')
const { getSheet } = require('../../cache/excelCache')
const isAdmin = require('../../utils/isAdmin')

// Archivos
const FILE_CAZA = path.join(__dirname, '../../media/excel/caza.xlsx')
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

function sortIds(arr) {
  return arr.slice().sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

// ======================
// JSON
// ======================
function cargarMulticuentas() {
  if (!fs.existsSync(FILE_MULTICUENTAS)) return {}
  try {
    return JSON.parse(fs.readFileSync(FILE_MULTICUENTAS, 'utf8'))
  } catch {
    return {}
  }
}

function guardarMulticuentas(base) {
  fs.writeFileSync(FILE_MULTICUENTAS, JSON.stringify(base, null, 2), 'utf8')
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
// VALIDACIONES
// ======================
function obtenerNombresPorIds(ids, hoja) {
  const nombres = []
  const idsValidos = []
  const noEncontrados = []

  ids.forEach(id => {
    if (id.startsWith('@')) return // ignorar menciones
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

function filtrarIdsRepetidos(ids, base, usuarioActual) {
  const idsPermitidos = []
  const idsRepetidos = []

  ids.forEach(id => {
    let repetido = false
    for (const key in base) {
      if (key === usuarioActual) continue // ignorar la propia cuenta
      const userIds = base[key].ids.split(',').map(i => i.trim())
      if (userIds.includes(id)) {
        idsRepetidos.push({ id, usuario: base[key].nombreDado })
        repetido = true
        break
      }
    }
    if (!repetido) idsPermitidos.push(id)
  })

  return { idsPermitidos, idsRepetidos }
}

// ======================
// COMANDO
// ======================
module.exports = {
  name: 'editcuentas',
  admin: false, // todos pueden usarlo
  description: 'Edita los IDs de un usuario: agregar (+), quitar (-) o reemplazar (=)',

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid
    const senderId = msg.key.participant || msg.key.remoteJid
    let body = getText(msg).trim()
    if (!body) return

    try {
      await sock.sendMessage(chatId, { react: { text: '📝', key: msg.key } })

      // 🔹 Quitar comando
      body = body.replace(/^[!/#.]\w+\s+/i, '')

      const primerEspacio = body.indexOf(' ')
      if (primerEspacio === -1) {
        await sock.sendMessage(chatId, { text: '⚠️ Uso: #editcuentas Nombre [+|-|=]ID1,ID2,... [@tag]' })
        return
      }

      const nombreDado = body.slice(0, primerEspacio).trim()
      let idsRaw = body.slice(primerEspacio + 1).trim()
      let action = '='

      if (idsRaw.startsWith('+') || idsRaw.startsWith('-') || idsRaw.startsWith('=')) {
        action = idsRaw[0]
        idsRaw = idsRaw.slice(1).trim()
      }

      const ids = parseIds(idsRaw)
      if (ids.length === 0 && action !== '-') {
        await sock.sendMessage(chatId, { text: '⚠️ Debes proveer al menos un ID.' })
        return
      }

      const base = cargarMulticuentas()
      const key = normalizeKey(nombreDado)
      if (!base[key]) {
        await sock.sendMessage(chatId, { text: `⚠️ *${nombreDado}* no existe.` })
        return
      }

      // 🔹 Admin y menciones
      const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
      let ownerId = base[key].ownerId
      if (mentions.length > 0 && !isAdmin(senderId)) {
        await sock.sendMessage(chatId, { text: '❌ Solo los administradores pueden usar menciones (@tag).' })
        return
      }
      if (mentions.length > 0 && isAdmin(senderId)) ownerId = mentions[0]
      else if (!isAdmin(senderId) && ownerId !== senderId) {
        await sock.sendMessage(chatId, { text: `❌ No puedes editar la cuenta de *${nombreDado}*.` })
        return
      }

      const hojaCaza = cargarCazaDesdeCache()
      if (!hojaCaza.length) {
        await sock.sendMessage(chatId, { text: '⚠️ No se pudo cargar la hoja Caza.' })
        return
      }

      let actuales = parseIds(base[key].ids)
      let idsAgregados = []
      let idsEliminados = []
      let idsOmitidosNoEncontrados = []
      let idsOmitidosRepetidos = []

      if (action === '+') {
        const { nombres, idsValidos, noEncontrados } = obtenerNombresPorIds(ids, hojaCaza)
        const { idsPermitidos, idsRepetidos } = filtrarIdsRepetidos(idsValidos, base, key)
        idsPermitidos.forEach(id => {
          if (!actuales.includes(id)) {
            actuales.push(id)
            idsAgregados.push(id)
          }
        })
        idsOmitidosNoEncontrados = noEncontrados
        idsOmitidosRepetidos = idsRepetidos

      } else if (action === '-') {
        ids.forEach(id => {
          if (actuales.includes(id)) {
            actuales = actuales.filter(i => i !== id)
            idsEliminados.push(id)
          }
        })

      } else if (action === '=') {
        const { nombres, idsValidos, noEncontrados } = obtenerNombresPorIds(ids, hojaCaza)
        const { idsPermitidos, idsRepetidos } = filtrarIdsRepetidos(idsValidos, base, key)
        actuales = idsPermitidos
        idsAgregados = idsPermitidos
        idsOmitidosNoEncontrados = noEncontrados
        idsOmitidosRepetidos = idsRepetidos
      }

      const { nombres: nombresFinales } = obtenerNombresPorIds(actuales, hojaCaza)
      base[key].ids = joinIds(sortIds(actuales))
      base[key].nombresDeCuentas = sortStrings(nombresFinales).join(', ')
      base[key].ownerId = ownerId

      guardarMulticuentas(base)

      let respuesta = `📌 *Multicuentas de ${nombreDado} actualizadas* 📌\n\n`
      if (action === '+') respuesta += `➕ IDs agregados: ${idsAgregados.join(', ') || 'Ninguno'}\n`
      if (action === '-') respuesta += `➖ IDs eliminados: ${idsEliminados.join(', ') || 'Ninguno'}\n`
      if (action === '=') respuesta += `🔄 Todos los IDs reemplazados\n`
      respuesta += `🆔 IDs actuales: ${joinIds(sortIds(actuales))}\n💻 Nombres encontrados: ${sortStrings(nombresFinales).join(', ') || 'Ninguno'}\n`
      if (idsOmitidosNoEncontrados.length) respuesta += `⚠️ No encontrados: ${idsOmitidosNoEncontrados.join(', ')}\n`
      if (idsOmitidosRepetidos.length) respuesta += `⚠️ IDs omitidos (ya registrados):\n${idsOmitidosRepetidos.map(r => `🆔 ${r.id} → ${r.usuario}`).join('\n')}\n`

      await sock.sendMessage(chatId, { text: respuesta })

    } catch (err) {
      console.error('❌ Error en /editcuentas:', err)
      await sock.sendMessage(chatId, { text: '❌ Ocurrió un error al ejecutar el comando.' })
    }
  }
}
