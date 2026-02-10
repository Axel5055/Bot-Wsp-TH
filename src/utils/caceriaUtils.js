const moment = require('moment-timezone')

function getText(message) {
  return (
    message.message?.conversation ||
    message.message?.extendedTextMessage?.text ||
    message.message?.imageMessage?.caption ||
    message.message?.videoMessage?.caption ||
    ''
  )
}

function normalizarTexto(texto = '') {
  return String(texto).trim().toLowerCase()
}

function getRandomIcono() {
  const iconos = ['🐉','🦁','🐺','🐗','🐻','🐊','🦄','🐲','🦌','🕊️']
  return iconos[Math.floor(Math.random() * iconos.length)]
}

function getMesActual() {
  return new Intl.DateTimeFormat('es-ES', {
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

module.exports = {
  getText,
  normalizarTexto,
  getRandomIcono,
  getMesActual,
}
