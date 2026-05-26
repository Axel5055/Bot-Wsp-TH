'use strict'

const fs   = require('fs')
const path = require('path')
const xlsx = require('xlsx')
const { getSheet } = require('../cache/excelCache')

// ─── Rutas ───────────────────────────────────────────────────────────────────
const FILE_MULTICUENTAS = path.join(__dirname, '../data/multicuentas.json')

// ─── Texto del mensaje ────────────────────────────────────────────────────────
/**
 * Extrae el texto plano de cualquier tipo de mensaje de WhatsApp.
 * @param {object} msg
 * @returns {string}
 */
function getText(msg) {
  return (
    msg.message?.conversation                    ||
    msg.message?.extendedTextMessage?.text       ||
    msg.message?.imageMessage?.caption           ||
    msg.message?.videoMessage?.caption           ||
    ''
  )
}

// ─── Strings / IDs ───────────────────────────────────────────────────────────
/** Normaliza un nombre a clave de objeto (minúsculas, sin espacios extremos). */
function normalizeKey(name) {
  return String(name ?? '').trim().toLowerCase()
}

/** Convierte un string "id1, id2, id3" en un array limpio. */
function parseIds(raw) {
  return String(raw ?? '')
    .split(',')
    .map(i => i.trim())
    .filter(Boolean)
}

/** Une un array de IDs en un string separado por comas. */
function joinIds(ids) {
  return ids.join(', ')
}

/** Ordena strings alfabéticamente (sin mutar el original). */
function sortStrings(arr) {
  return arr.slice().sort((a, b) => a.localeCompare(b))
}

/** Ordena IDs numérico-alfabéticamente (sin mutar el original). */
function sortIds(arr) {
  return arr.slice().sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  )
}

// ─── Persistencia JSON ───────────────────────────────────────────────────────
/**
 * Carga el JSON de multicuentas. Devuelve {} si no existe o está corrupto.
 * @returns {object}
 */
function cargarMulticuentas() {
  if (!fs.existsSync(FILE_MULTICUENTAS)) return {}
  try {
    return JSON.parse(fs.readFileSync(FILE_MULTICUENTAS, 'utf8'))
  } catch (err) {
    console.error('❌ [multicuentas] Error al leer JSON:', err.message)
    return {}
  }
}

/**
 * Guarda el objeto en el JSON de multicuentas de forma atómica
 * (escribe a un archivo temporal y luego renombra para evitar corrupción).
 * @param {object} base
 */
function guardarMulticuentas(base) {
  const tmp = FILE_MULTICUENTAS + '.tmp'
  try {
    fs.writeFileSync(tmp, JSON.stringify(base, null, 2), 'utf8')
    fs.renameSync(tmp, FILE_MULTICUENTAS)
  } catch (err) {
    console.error('❌ [multicuentas] Error al guardar JSON:', err.message)
    // Intentar limpiar el archivo temporal si existe
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp)
    throw err // Propagar para que el comando informe al usuario
  }
}

// ─── Excel (cache) ───────────────────────────────────────────────────────────
/**
 * Devuelve las filas de la hoja "Caza" desde el cache en memoria.
 * Retorna [] si la hoja no está disponible.
 * @returns {object[]}
 */
function cargarCazaDesdeCache() {
  const sheet = getSheet('Caza')
  if (!sheet) return []
  return xlsx.utils.sheet_to_json(sheet, { defval: '' })
}

// ─── Validaciones de IDs ──────────────────────────────────────────────────────
/**
 * Busca en la hoja Caza los nombres que corresponden a cada ID.
 * Ignora entradas que empiecen con "@" (menciones de WhatsApp).
 *
 * @param {string[]} ids
 * @param {object[]} hoja  Filas de la hoja Caza
 * @returns {{ nombres: string[], idsValidos: string[], noEncontrados: string[] }}
 */
function obtenerNombresPorIds(ids, hoja) {
  // Índice para búsqueda O(1) en lugar de O(n) por ID
  const mapaIGG = new Map(
    hoja.map(r => [String(r['IGG ID']).trim(), String(r['Nombre'] || 'Desconocido').trim()])
  )

  const nombres       = []
  const idsValidos    = []
  const noEncontrados = []

  for (const id of ids) {
    if (id.startsWith('@')) continue
    const nombre = mapaIGG.get(id)
    if (nombre !== undefined) {
      nombres.push(nombre)
      idsValidos.push(id)
    } else {
      noEncontrados.push(id)
    }
  }

  return { nombres, idsValidos, noEncontrados }
}

/**
 * Busca el nombre de un único ID en la hoja Caza.
 * Retorna null si no existe o si el ID comienza con "@".
 *
 * @param {string}   id
 * @param {object[]} hojaCaza
 * @returns {string|null}
 */
function obtenerNombrePorId(id, hojaCaza) {
  if (id.startsWith('@')) return null
  const reg = hojaCaza.find(r => String(r['IGG ID']).trim() === id)
  return reg ? String(reg['Nombre'] || 'Desconocido').trim() : null
}

/**
 * Separa IDs en "permitidos" (no duplicados en otros usuarios) y "repetidos".
 * El parámetro `usuarioActual` (clave normalizada) se excluye de la comprobación
 * para no reportar sus propios IDs como repetidos durante una edición.
 *
 * @param {string[]} ids
 * @param {object}   base
 * @param {string}   [usuarioActual='']
 * @returns {{ permitidos: string[], repetidos: {id:string, usuario:string}[] }}
 */
function filtrarIdsRepetidos(ids, base, usuarioActual = '') {
  // Pre-construir mapa id → nombreDado para O(1) lookup
  const mapaIdUsuario = new Map()
  for (const [key, entry] of Object.entries(base)) {
    if (key === usuarioActual) continue
    for (const id of parseIds(entry.ids)) {
      mapaIdUsuario.set(id, entry.nombreDado)
    }
  }

  const permitidos = []
  const repetidos  = []

  for (const id of ids) {
    const dueno = mapaIdUsuario.get(id)
    if (dueno) {
      repetidos.push({ id, usuario: dueno })
    } else {
      permitidos.push(id)
    }
  }

  return { permitidos, repetidos }
}

/**
 * Construye pares {id, nombre} ordenados alfabéticamente por nombre.
 * IDs sin match van al final con nombre "Desconocido".
 *
 * @param {string[]} ids
 * @param {object[]} hojaCaza
 * @returns {{ idsOrdenados: string, nombresOrdenados: string, idsNoEncontrados: string[] }}
 */
function construirParesOrdenados(ids, hojaCaza) {
  const encontrados   = []
  const noEncontrados = []

  for (const id of ids) {
    const nombre = obtenerNombrePorId(id, hojaCaza)
    if (nombre) {
      encontrados.push({ id, nombre })
    } else {
      noEncontrados.push(id)
    }
  }

  encontrados.sort((a, b) => a.nombre.localeCompare(b.nombre))

  const todosPares = [
    ...encontrados,
    ...noEncontrados.map(id => ({ id, nombre: 'Desconocido' }))
  ]

  return {
    idsOrdenados:     todosPares.map(p => p.id).join(', '),
    nombresOrdenados: todosPares.map(p => p.nombre).join(', '),
    idsNoEncontrados: noEncontrados,
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────
module.exports = {
  FILE_MULTICUENTAS,
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
  obtenerNombrePorId,
  filtrarIdsRepetidos,
  construirParesOrdenados,
}
