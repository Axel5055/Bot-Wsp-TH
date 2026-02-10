const { admins } = require('../config/settings')

module.exports = (jid) => {
  if (!jid) return false

  // Limpia :device si existe
  const cleanJid = jid.split(':')[0]

  return admins.includes(cleanJid)
}
