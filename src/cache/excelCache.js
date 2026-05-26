// cache/excelCache.js
// ✅ OPTIMIZADO: manejo de errores claro, recarga segura

const xlsx = require('xlsx')
const path = require('path')
const fs   = require('fs')

const FILE_PATH = path.join(__dirname, '../../media/excel/caza.xlsx')

let workbook = null

// ─────────────────────────────────────────────
// 📊 Cargar libro de Excel en memoria
// ─────────────────────────────────────────────
function loadWorkbook() {
  if (!fs.existsSync(FILE_PATH)) {
    throw new Error(`Archivo Excel no encontrado: ${FILE_PATH}`)
  }

  console.log('📊 Cargando Excel en memoria...')
  workbook = xlsx.readFile(FILE_PATH)
  console.log(`✅ Excel cargado. Hojas: ${workbook.SheetNames.join(', ')}`)
  return workbook
}

// ─────────────────────────────────────────────
// 📋 Obtener una hoja por nombre o índice
// ─────────────────────────────────────────────
function getSheet(indexOrName) {
  if (!workbook) {
    loadWorkbook() // Carga bajo demanda si aún no está en memoria
  }

  if (typeof indexOrName === 'number') {
    const sheetName = workbook.SheetNames[indexOrName]
    if (!sheetName) {
      throw new Error(`Índice de hoja fuera de rango: ${indexOrName}`)
    }
    return workbook.Sheets[sheetName]
  }

  const sheet = workbook.Sheets[indexOrName]
  if (!sheet) {
    throw new Error(`Hoja no encontrada: "${indexOrName}". Disponibles: ${workbook.SheetNames.join(', ')}`)
  }

  return sheet
}

// ─────────────────────────────────────────────
// 🗑️ Limpiar caché para forzar recarga
// ─────────────────────────────────────────────
function clearCache() {
  workbook = null
  console.log('🗑️ Caché de Excel limpiada')
}

module.exports = {
  loadWorkbook,
  getSheet,
  clearCache,
}
