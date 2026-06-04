// src/config/settings.js

// Para agregar admins: en el .env pon:
// ADMIN_JIDS=242652851216536@lid,278391760654361@lid
const adminsFromEnv = process.env.ADMIN_JIDS
  ? process.env.ADMIN_JIDS.split(',').map(s => s.trim()).filter(Boolean)
  : []

const adminsFallback = [
  '242652851216536@lid',
  '278391760654361@lid',
]

// Para agregar mensajeros: en el .env pon:
// MENSAJERO_JIDS=176871115358316@lid,otrojid@lid
const mensajerosFromEnv = process.env.MENSAJERO_JIDS
  ? process.env.MENSAJERO_JIDS.split(',').map(s => s.trim()).filter(Boolean)
  : []

const mensajerosFallback = [
  '176871115358316@lid',
  '128398097682444@lid',
]

module.exports = {
  prefix: process.env.BOT_PREFIX || '#',
  admins: adminsFromEnv.length > 0 ? adminsFromEnv : adminsFallback,
  mensajeros: mensajerosFromEnv.length > 0 ? mensajerosFromEnv : mensajerosFallback,

   // ID del grupo donde el bot notifica cuando alguien responde al spam de escudo
  // Para obtenerlo escribe #grupoid en tu grupo y copia el ID que responde el bot
  gruposAlerta: ['120363376810768678@g.us'] // <- reemplaza esto
}