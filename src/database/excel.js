// src/database/excel.js
const XLSX = require('xlsx')
const path = require('path')

const EXCEL_PATH = process.env.EXCEL_PATH
  ? path.join(process.cwd(), process.env.EXCEL_PATH)
  : path.join(__dirname, '../../media/excel/caza.xlsx')

function leerCaza() {
  try {
    const wb = XLSX.readFile(EXCEL_PATH)
    const ws = wb.Sheets['Caza']
    if (!ws) {
      console.error('[excel] ❌ Hoja "Caza" no encontrada')
      return []
    }

    const filas = XLSX.utils.sheet_to_json(ws, { range: 2, defval: '' })

    return filas
      .filter(f => {
        const id = f['IGG ID']
        return id && !isNaN(Number(id)) && String(id).trim() !== '' && Number(id) !== 0
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

function leerNumeros() {
  try {
    const wb     = XLSX.readFile(EXCEL_PATH)
    const wsNum  = wb.Sheets['Numeros']
    const wsCaza = wb.Sheets['Caza']
    if (!wsNum || !wsCaza) {
      console.error('[excel] ❌ Hoja Numeros o Caza no encontrada')
      return []
    }

    const filasC = XLSX.utils.sheet_to_json(wsCaza, { range: 2, defval: '' })
    const mapaNombres = {}
    for (const f of filasC) {
      const id = f['IGG ID']
      if (id && !isNaN(Number(id)) && Number(id) !== 0) {
        mapaNombres[String(id).trim()] = String(f['Nombre']).trim()
      }
    }

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

function buscarEnCazaPorId(igg_id) {
  const caza = leerCaza()
  return caza.find(f => f.igg_id === String(igg_id).trim()) || null
}

function buscarEnNumerosPorTelefono(numero) {
  const numeros = leerNumeros()
  const limpio  = String(numero).replace(/\D/g, '')

  return numeros.filter(f => {
    const excelNum = f.numero.replace(/\D/g, '')
    const digitos  = Math.min(excelNum.length, limpio.length)
    return digitos >= 8 && excelNum.slice(-digitos) === limpio.slice(-digitos)
  })
}

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