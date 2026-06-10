const fs = require('fs')
const path = require('path')

const ESCUDOS_PATH = path.join(__dirname, '../data/escudos.json')

const LADAS_TIMEZONE = [
  { lada: '521',  tz: 'America/Mexico_City',                  pais: '🇲🇽 México' },
  { lada: '52',   tz: 'America/Mexico_City',                  pais: '🇲🇽 México' },
  { lada: '58',   tz: 'America/Caracas',                      pais: '🇻🇪 Venezuela' },
  { lada: '57',   tz: 'America/Bogota',                       pais: '🇨🇴 Colombia' },
  { lada: '549',  tz: 'America/Argentina/Buenos_Aires',       pais: '🇦🇷 Argentina' },
  { lada: '54',   tz: 'America/Argentina/Buenos_Aires',       pais: '🇦🇷 Argentina' },
  { lada: '56',   tz: 'America/Santiago',                     pais: '🇨🇱 Chile' },
  { lada: '51',   tz: 'America/Lima',                         pais: '🇵🇪 Perú' },
  { lada: '593',  tz: 'America/Guayaquil',                    pais: '🇪🇨 Ecuador' },
  { lada: '591',  tz: 'America/La_Paz',                       pais: '🇧🇴 Bolivia' },
  { lada: '595',  tz: 'America/Asuncion',                     pais: '🇵🇾 Paraguay' },
  { lada: '598',  tz: 'America/Montevideo',                   pais: '🇺🇾 Uruguay' },
  { lada: '507',  tz: 'America/Panama',                       pais: '🇵🇦 Panamá' },
  { lada: '506',  tz: 'America/Costa_Rica',                   pais: '🇨🇷 Costa Rica' },
  { lada: '502',  tz: 'America/Guatemala',                    pais: '🇬🇹 Guatemala' },
  { lada: '504',  tz: 'America/Tegucigalpa',                  pais: '🇭🇳 Honduras' },
  { lada: '503',  tz: 'America/El_Salvador',                  pais: '🇸🇻 El Salvador' },
  { lada: '505',  tz: 'America/Managua',                      pais: '🇳🇮 Nicaragua' },
  { lada: '1809', tz: 'America/Santo_Domingo',                pais: '🇩🇴 Rep. Dominicana' },
  { lada: '1829', tz: 'America/Santo_Domingo',                pais: '🇩🇴 Rep. Dominicana' },
  { lada: '1849', tz: 'America/Santo_Domingo',                pais: '🇩🇴 Rep. Dominicana' },
  { lada: '53',   tz: 'America/Havana',                       pais: '🇨🇺 Cuba' },
  { lada: '34',   tz: 'Europe/Madrid',                        pais: '🇪🇸 España' },
  { lada: '1',    tz: 'America/Chicago',                      pais: '🇺🇸 Estados Unidos' },
]

function detectarInfo(numero) {
  const ordenadas = [...LADAS_TIMEZONE].sort((a, b) => b.lada.length - a.lada.length)
  for (const { lada, tz, pais } of ordenadas) {
    if (numero.startsWith(lada)) return { tz, pais }
  }
  return { tz: 'America/Mexico_City', pais: '🌍 Desconocido' }
}

// Mantener detectarTimezone por compatibilidad con código existente
function detectarTimezone(numero) {
  return detectarInfo(numero).tz
}

function formatearFechaEnTz(timestamp, tz) {
  return new Date(timestamp).toLocaleString('es-MX', {
    timeZone: tz || 'America/Mexico_City',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

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
  siguienteId, ultimosCuatroDigitos, validarTelefono,
  detectarTimezone, detectarInfo, formatearFechaEnTz
}