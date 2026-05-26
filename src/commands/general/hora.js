// commands/general/hora.js
// Comando: #hora <código_país>
// Muestra la hora actual de cualquier país de LATAM
// Ejemplo: #hora mx | #hora ar | #hora co | #hora vz

const PAISES_LATAM = {
  // ── Códigos cortos ──────────────────────────────────────────────────────────
  mx:  { nombre: 'México',              zona: 'America/Mexico_City',    bandera: '🇲🇽' },
  ar:  { nombre: 'Argentina',           zona: 'America/Argentina/Buenos_Aires', bandera: '🇦🇷' },
  co:  { nombre: 'Colombia',            zona: 'America/Bogota',         bandera: '🇨🇴' },
  ve:  { nombre: 'Venezuela',           zona: 'America/Caracas',        bandera: '🇻🇪' },
  vz:  { nombre: 'Venezuela',           zona: 'America/Caracas',        bandera: '🇻🇪' }, // alias popular
  cl:  { nombre: 'Chile',               zona: 'America/Santiago',       bandera: '🇨🇱' },
  pe:  { nombre: 'Perú',                zona: 'America/Lima',           bandera: '🇵🇪' },
  ec:  { nombre: 'Ecuador',             zona: 'America/Guayaquil',      bandera: '🇪🇨' },
  bo:  { nombre: 'Bolivia',             zona: 'America/La_Paz',         bandera: '🇧🇴' },
  py:  { nombre: 'Paraguay',            zona: 'America/Asuncion',       bandera: '🇵🇾' },
  uy:  { nombre: 'Uruguay',             zona: 'America/Montevideo',     bandera: '🇺🇾' },
  br:  { nombre: 'Brasil',              zona: 'America/Sao_Paulo',      bandera: '🇧🇷' },
  gt:  { nombre: 'Guatemala',           zona: 'America/Guatemala',      bandera: '🇬🇹' },
  hn:  { nombre: 'Honduras',            zona: 'America/Tegucigalpa',    bandera: '🇭🇳' },
  sv:  { nombre: 'El Salvador',         zona: 'America/El_Salvador',    bandera: '🇸🇻' },
  ni:  { nombre: 'Nicaragua',           zona: 'America/Managua',        bandera: '🇳🇮' },
  cr:  { nombre: 'Costa Rica',          zona: 'America/Costa_Rica',     bandera: '🇨🇷' },
  pa:  { nombre: 'Panamá',              zona: 'America/Panama',         bandera: '🇵🇦' },
  cu:  { nombre: 'Cuba',                zona: 'America/Havana',         bandera: '🇨🇺' },
  do:  { nombre: 'República Dominicana',zona: 'America/Santo_Domingo',  bandera: '🇩🇴' },
  pr:  { nombre: 'Puerto Rico',         zona: 'America/Puerto_Rico',    bandera: '🇵🇷' },
  ht:  { nombre: 'Haití',               zona: 'America/Port-au-Prince', bandera: '🇭🇹' },
  jm:  { nombre: 'Jamaica',             zona: 'America/Jamaica',        bandera: '🇯🇲' },
  tt:  { nombre: 'Trinidad y Tobago',   zona: 'America/Port_of_Spain',  bandera: '🇹🇹' },
  gf:  { nombre: 'Guyana Francesa',     zona: 'America/Cayenne',        bandera: '🇬🇫' },
  gy:  { nombre: 'Guyana',              zona: 'America/Guyana',         bandera: '🇬🇾' },
  sr:  { nombre: 'Surinam',             zona: 'America/Paramaribo',     bandera: '🇸🇷' },
  bz:  { nombre: 'Belice',              zona: 'America/Belize',         bandera: '🇧🇿' },

  // ── Aliases por nombre (en minúsculas) ──────────────────────────────────────
  mexico:      { nombre: 'México',              zona: 'America/Mexico_City',    bandera: '🇲🇽' },
  argentina:   { nombre: 'Argentina',           zona: 'America/Argentina/Buenos_Aires', bandera: '🇦🇷' },
  colombia:    { nombre: 'Colombia',            zona: 'America/Bogota',         bandera: '🇨🇴' },
  venezuela:   { nombre: 'Venezuela',           zona: 'America/Caracas',        bandera: '🇻🇪' },
  chile:       { nombre: 'Chile',               zona: 'America/Santiago',       bandera: '🇨🇱' },
  peru:        { nombre: 'Perú',                zona: 'America/Lima',           bandera: '🇵🇪' },
  perú:        { nombre: 'Perú',                zona: 'America/Lima',           bandera: '🇵🇪' },
  ecuador:     { nombre: 'Ecuador',             zona: 'America/Guayaquil',      bandera: '🇪🇨' },
  bolivia:     { nombre: 'Bolivia',             zona: 'America/La_Paz',         bandera: '🇧🇴' },
  paraguay:    { nombre: 'Paraguay',            zona: 'America/Asuncion',       bandera: '🇵🇾' },
  uruguay:     { nombre: 'Uruguay',             zona: 'America/Montevideo',     bandera: '🇺🇾' },
  brasil:      { nombre: 'Brasil',              zona: 'America/Sao_Paulo',      bandera: '🇧🇷' },
  brazil:      { nombre: 'Brasil',              zona: 'America/Sao_Paulo',      bandera: '🇧🇷' },
  guatemala:   { nombre: 'Guatemala',           zona: 'America/Guatemala',      bandera: '🇬🇹' },
  honduras:    { nombre: 'Honduras',            zona: 'America/Tegucigalpa',    bandera: '🇭🇳' },
  nicaragua:   { nombre: 'Nicaragua',           zona: 'America/Managua',        bandera: '🇳🇮' },
  panama:      { nombre: 'Panamá',              zona: 'America/Panama',         bandera: '🇵🇦' },
  panamá:      { nombre: 'Panamá',              zona: 'America/Panama',         bandera: '🇵🇦' },
  cuba:        { nombre: 'Cuba',                zona: 'America/Havana',         bandera: '🇨🇺' },
}

// Lista bonita de países disponibles (sin duplicados/alias)
const LISTA_PAISES = [
  '🇦🇷 *ar* → Argentina',
  '🇧🇿 *bz* → Belice',
  '🇧🇴 *bo* → Bolivia',
  '🇧🇷 *br* → Brasil',
  '🇨🇱 *cl* → Chile',
  '🇨🇴 *co* → Colombia',
  '🇨🇷 *cr* → Costa Rica',
  '🇨🇺 *cu* → Cuba',
  '🇩🇴 *do* → Rep. Dominicana',
  '🇪🇨 *ec* → Ecuador',
  '🇸🇻 *sv* → El Salvador',
  '🇬🇹 *gt* → Guatemala',
  '🇬🇾 *gy* → Guyana',
  '🇬🇫 *gf* → Guyana Francesa',
  '🇭🇹 *ht* → Haití',
  '🇭🇳 *hn* → Honduras',
  '🇯🇲 *jm* → Jamaica',
  '🇲🇽 *mx* → México',
  '🇳🇮 *ni* → Nicaragua',
  '🇵🇦 *pa* → Panamá',
  '🇵🇾 *py* → Paraguay',
  '🇵🇪 *pe* → Perú',
  '🇵🇷 *pr* → Puerto Rico',
  '🇸🇷 *sr* → Surinam',
  '🇹🇹 *tt* → Trinidad y Tobago',
  '🇺🇾 *uy* → Uruguay',
  '🇻🇪 *vz* → Venezuela',
]

function getHora(zona) {
  const ahora = new Date()
  const opciones = {
    timeZone: zona,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }
  return new Intl.DateTimeFormat('es-ES', opciones).format(ahora)
}

module.exports = {
  name: 'hora',
  admin: false,

  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid

    // Sin argumento → mostrar lista de países
    if (!args || args.length === 0) {
      const lista = LISTA_PAISES.join('\n')
      return sock.sendMessage(jid, {
        text:
          `🌎 *Hora en LATAM*\n\n` +
          `Usa: *#hora <código>*\nEjemplo: *#hora vz* o *#hora mx*\n\n` +
          `📋 *Países disponibles:*\n${lista}`
      })
    }

    const input = args[0].toLowerCase().trim()
    const pais = PAISES_LATAM[input]

    if (!pais) {
      return sock.sendMessage(jid, {
        text:
          `❌ País *"${args[0]}"* no encontrado.\n\n` +
          `Escribe *#hora* sin argumentos para ver la lista completa de países disponibles.`
      })
    }

    const horaFormateada = getHora(pais.zona)

    return sock.sendMessage(jid, {
      text:
        `${pais.bandera} *${pais.nombre}*\n\n` +
        `🕐 ${horaFormateada}`
    })
  }
}