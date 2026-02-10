const xlsx = require('xlsx')
const path = require('path')

const FILE_PATH = path.join(__dirname, '../../media/excel/caza.xlsx')

let workbook = null

function loadWorkbook() {
  if (!workbook) {
    console.log('📊 Cargando Excel en memoria...')
    workbook = xlsx.readFile(FILE_PATH)
  }
  return workbook
}

function getSheet(indexOrName) {
  const wb = loadWorkbook()
  return typeof indexOrName === 'number'
    ? wb.Sheets[wb.SheetNames[indexOrName]]
    : wb.Sheets[indexOrName]
}

function clearCache() {
  workbook = null
}

module.exports = {
  loadWorkbook,
  getSheet,
  clearCache,
}
