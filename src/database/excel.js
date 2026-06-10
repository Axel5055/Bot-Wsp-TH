// src/database/excel.js
// Fuente de verdad del Excel — todos los módulos leen desde aquí

const XLSX = require('xlsx')
const path = require('path')

const EXCEL_PATH = process.env.EXCEL_PATH
  ? path.join(process.cwd(), process.env.EXCEL_PATH)
  : path.join(__dirname, '../../media/excel/caza.xlsx')

// ─────────────────────────────────────────────
// Leer hoja Caza — devuelve array de { igg_id, nombre }
// Datos desde fila 5, col C = IGG ID, col D = Nombre
// ─────────────────────────────────────────────
function leerCaza() {
  try {
    const wb = XLSX.readFile(EXCEL_PATH)
    const ws = wb.Sheets['Caza']
    if (!ws) {
      console.error('[excel] ❌ Hoja "Caza" no encontrada')
      return []
    }

    // Leer con encabezados de fila 1, sin range
    const filas = XLSX.utils.sheet_to_json(ws, { defval: '' })

    return filas
      .filter(f => {
        const id = f['IGG ID']
        // Solo filas donde IGG ID sea un número válido
        return id && !isNaN(Number(id)) && String(id).trim() !== ''
      })
      .map(f => ({
        igg_id: String(f['IGG ID']).trim(),
        nombre: String(f['Nombre']).trim(),
      }))
      .filter(f => f.igg_id && f.nombre)

  } catch (err) {
    console.error('[excel] ❌ Error leyendo hoja Caza:', err)
    return []
  }
}

// ─────────────────────────────────────────────
// Leer hoja Numeros — devuelve array de { igg_id, nombre, numero }
// Datos desde fila 2, col A = IGG ID, col B = Nombre, col C = Numero
// ─────────────────────────────────────────────
function leerNumeros() {
  try {
    const wb      = XLSX.readFile(EXCEL_PATH)
    const wsNum   = wb.Sheets['Numeros']
    const wsCaza  = wb.Sheets['Caza']
    if (!wsNum || !wsCaza) {
      console.error('[excel] ❌ Hoja Numeros o Caza no encontrada')
      return []
    }

    // Leer Caza para resolver nombres por IGG ID
    const filasC = XLSX.utils.sheet_to_json(wsCaza, { defval: '' })
    const mapaNombres = {}
    for (const f of filasC) {
      const id = f['IGG ID']
      if (id && !isNaN(Number(id))) {
        mapaNombres[String(id).trim()] = String(f['Nombre']).trim()
      }
    }

    // Leer Numeros — solo IGG ID y Numero (ignorar Nombre porque es fórmula)
    const filasN = XLSX.utils.sheet_to_json(wsNum, { defval: '' })

    return filasN
      .filter(f => f['IGG ID'] && f['Numero'])
      .map(f => {
        const igg_id = String(f['IGG ID']).trim()
        const numero = String(f['Numero']).replace(/\D/g, '')
        const nombre = mapaNombres[igg_id] || ''
        return { igg_id, nombre, numero }
      })
      .filter(f => f.igg_id && f.numero && f.nombre)

  } catch (err) {
    console.error('[excel] ❌ Error leyendo hoja Numeros:', err)
    return []
  }
}

// ─────────────────────────────────────────────
// Buscar en Caza por IGG ID
// ─────────────────────────────────────────────
function buscarEnCazaPorId(igg_id) {
  const caza = leerCaza()
  return caza.find(f => f.igg_id === String(igg_id).trim()) || null
}

// ─────────────────────────────────────────────
// Buscar en Numeros por número de teléfono
// Tolerante a diferencias de lada (compara por sufijo)
// ─────────────────────────────────────────────
function buscarEnNumerosPorTelefono(numero) {
  const numeros = leerNumeros()
  const limpio  = String(numero).replace(/\D/g, '')

  return numeros.filter(f => {
    const excelNum = f.numero.replace(/\D/g, '')
    const digitos  = Math.min(excelNum.length, limpio.length)
    return digitos >= 8 && excelNum.slice(-digitos) === limpio.slice(-digitos)
  })
}

// ─────────────────────────────────────────────
// Buscar en Numeros por IGG ID
// ─────────────────────────────────────────────
function buscarEnNumerosPorId(igg_id) {
  const numeros = leerNumeros()
  return numeros.find(f => f.igg_id === String(igg_id).trim()) || null
}

module.exports = {
  leerCaza,
  leerNumeros,
  buscarEnCazaPorId,
  buscarEnNumerosPorTelefono,
  buscarEnNumerosPorId,
}