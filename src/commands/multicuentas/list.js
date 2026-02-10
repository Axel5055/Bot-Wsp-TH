const fs = require('fs')
const path = require('path')
const xlsx = require('xlsx')
const { getSheet } = require('../../cache/excelCache')

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

function sortStrings(arr) {
  return arr.slice().sort((a, b) => a.localeCompare(b))
}

// ======================
// DATA
// ======================
function cargarMulticuentas() {
  if (!fs.existsSync(FILE_MULTICUENTAS)) return {}
  try {
    return JSON.parse(fs.readFileSync(FILE_MULTICUENTAS, 'utf8'))
  } catch (err) {
    console.error('❌ Error al leer multicuentas.json:', err)
    return {}
  }
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
// VALIDACIÓN
// ======================
function obtenerNombresPorIds(ids, hoja) {
  const nombres = []
  const noEncontrados = []

  ids.forEach(id => {
    if (id.startsWith('@')) return // ignorar menciones
    const reg = hoja.find(r => String(r['IGG ID']).trim() === id)
    if (reg) nombres.push(String(reg['Nombre'] || 'Desconocido').trim())
    else noEncontrados.push(id)
  })

  return {
    nombres: sortStrings(nombres),
    noEncontrados
  }
}

// ======================
// COMANDO
// ======================
module.exports = {
  name: 'listcuentas',
  admin: false,
  description: 'Lista nombres de usuarios o detalle de un usuario',

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid
    const body = getText(msg).trim()
    if (!body) return

    try {
      // 🔹 quitar comando (#listcuentas)
      const args = body.replace(/^[!/#.]\w+/i, '').trim()

      const base = cargarMulticuentas()
      const hojaCaza = cargarCazaDesdeCache()

      if (!Object.keys(base).length) {
        await sock.sendMessage(chatId, { text: '⚠️ No hay usuarios registrados.' })
        return
      }

      let respuesta = ''

      // ======================
      // USUARIO ESPECÍFICO
      // ======================
      if (args) {
        const key = normalizeKey(args)
        if (!base[key]) {
          await sock.sendMessage(chatId, { text: `⚠️ Usuario *${args}* no encontrado.` })
          return
        }

        const user = base[key]
        const ids = parseIds(user.ids)
        const { nombres, noEncontrados } = obtenerNombresPorIds(ids, hojaCaza)

        respuesta += `📋 *Detalle de ${user.nombreDado}*\n`
        respuesta += `🆔 IDs: ${ids.join(', ') || 'Ninguno'}\n`
        respuesta += `💻 Nombres de cuentas: ${nombres.join(', ') || 'Ninguno'}\n`
        if (noEncontrados.length)
          respuesta += `⚠️ No encontrados en Excel: ${noEncontrados.join(', ')}`

      // ======================
      // LISTA TODOS LOS USUARIOS
      // ======================
      } else {
        respuesta += '📋 *Usuarios registrados:*\n'
        Object.values(base).forEach(u => {
          respuesta += `- ${u.nombreDado}\n`
        })
      }

      await sock.sendMessage(chatId, { text: respuesta })

    } catch (err) {
      console.error('❌ Error en /listcuentas:', err)
      await sock.sendMessage(chatId, {
        text: '❌ Ocurrió un error al ejecutar el comando.'
      })
    }
  }
}
