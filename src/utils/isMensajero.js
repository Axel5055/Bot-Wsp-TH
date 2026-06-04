// src/utils/isMensajero.js - Verifica si un JID es mensajero según la configuración
const { mensajeros } = require('../config/settings')

module.exports = (jid) => {
  if (!jid) return false

  // Limpia :device si existe
  const cleanJid = jid.split(':')[0]

  return mensajeros.includes(cleanJid)
}