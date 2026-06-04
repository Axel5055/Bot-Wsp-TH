const fs = require('fs')
const path = require('path')

const ESCUDOS_PATH = path.join(__dirname, '../data/escudos.json')

function cargarRegistros() {
  try {
    return JSON.parse(fs.readFileSync(ESCUDOS_PATH, 'utf8'))
  } catch {
    return []
  }
}

function guardarRegistros(registros) {
  fs.writeFileSync(ESCUDOS_PATH, JSON.stringify(registros, null, 2))
}

function buscarPorJid(jid) {
  return cargarRegistros().find(r => r.jid === jid) || null
}

function buscarPorNombre(nombre) {
  return cargarRegistros().find(
    r => r.nombre.toLowerCase() === nombre.toLowerCase()
  ) || null
}

function buscarPorId(id) {
  return cargarRegistros().find(r => r.id === parseInt(id)) || null
}

function siguienteId(registros) {
  if (registros.length === 0) return 1
  return Math.max(...registros.map(r => r.id)) + 1
}

function ultimosCuatroDigitos(numero) {
  return numero.slice(-4)
}

function validarTelefono(numero) {
  return /^\d{7,15}$/.test(numero)
}

module.exports = {
  cargarRegistros, guardarRegistros,
  buscarPorJid, buscarPorNombre, buscarPorId,
  siguienteId, ultimosCuatroDigitos, validarTelefono
}