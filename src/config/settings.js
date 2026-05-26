// config/settings.js
// ✅ OPTIMIZADO: admins cargados desde .env (sin tocar código para cambiarlos)

// Para agregar admins: en el .env pon:
// ADMIN_JIDS=242652851216536@lid,278391760654361@lid
const adminsFromEnv = process.env.ADMIN_JIDS
  ? process.env.ADMIN_JIDS.split(',').map(s => s.trim()).filter(Boolean)
  : []

// Lista de respaldo hardcodeada (se usa si no hay .env)
const adminsFallback = [
  '242652851216536@lid',
  '278391760654361@lid',
]

module.exports = {
  prefix: process.env.BOT_PREFIX || '#',
  admins: adminsFromEnv.length > 0 ? adminsFromEnv : adminsFallback,
}
