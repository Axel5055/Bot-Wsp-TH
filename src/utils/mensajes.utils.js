const fs = require('fs')
const path = require('path')

const MENSAJES_PATH = path.join(__dirname, '../data/mensajes.json')

function cargarMensajes() {
  try {
    return JSON.parse(fs.readFileSync(MENSAJES_PATH, 'utf8'))
  } catch {
    return []
  }
}

function guardarMensajes(mensajes) {
  fs.writeFileSync(MENSAJES_PATH, JSON.stringify(mensajes, null, 2))
}

function siguienteId(mensajes) {
  if (mensajes.length === 0) return 1
  return Math.max(...mensajes.map(m => m.id)) + 1
}

module.exports = { cargarMensajes, guardarMensajes, siguienteId }