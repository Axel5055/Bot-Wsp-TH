// src/utils/isAdmin.js - Verifica si un JID es admin según la configuración
const { admins } = require('../config/settings')

module.exports = (jid) => {
  if (!jid) return false

  // Limpia :device si existe
  const cleanJid = jid.split(':')[0]

  return admins.includes(cleanJid)
}
