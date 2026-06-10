// src/database/escudos.db.js
// Capa de datos para el módulo de escudos
// Reemplaza: escudos.utils.js + escudo.timer.js (la parte de persistencia)

const { getDb, saveDb } = require('./db')

// ─────────────────────────────────────────────
// UTILIDADES DE TIMEZONE (igual que antes)
// ─────────────────────────────────────────────

const LADAS_TIMEZONE = [
  { lada: '521',  tz: 'America/Mexico_City',            pais: '🇲🇽 México' },
  { lada: '52',   tz: 'America/Mexico_City',            pais: '🇲🇽 México' },
  { lada: '58',   tz: 'America/Caracas',                pais: '🇻🇪 Venezuela' },
  { lada: '57',   tz: 'America/Bogota',                 pais: '🇨🇴 Colombia' },
  { lada: '549',  tz: 'America/Argentina/Buenos_Aires', pais: '🇦🇷 Argentina' },
  { lada: '54',   tz: 'America/Argentina/Buenos_Aires', pais: '🇦🇷 Argentina' },
  { lada: '56',   tz: 'America/Santiago',               pais: '🇨🇱 Chile' },
  { lada: '51',   tz: 'America/Lima',                   pais: '🇵🇪 Perú' },
  { lada: '593',  tz: 'America/Guayaquil',              pais: '🇪🇨 Ecuador' },
  { lada: '591',  tz: 'America/La_Paz',                 pais: '🇧🇴 Bolivia' },
  { lada: '595',  tz: 'America/Asuncion',               pais: '🇵🇾 Paraguay' },
  { lada: '598',  tz: 'America/Montevideo',             pais: '🇺🇾 Uruguay' },
  { lada: '507',  tz: 'America/Panama',                 pais: '🇵🇦 Panamá' },
  { lada: '506',  tz: 'America/Costa_Rica',             pais: '🇨🇷 Costa Rica' },
  { lada: '502',  tz: 'America/Guatemala',              pais: '🇬🇹 Guatemala' },
  { lada: '504',  tz: 'America/Tegucigalpa',            pais: '🇭🇳 Honduras' },
  { lada: '503',  tz: 'America/El_Salvador',            pais: '🇸🇻 El Salvador' },
  { lada: '505',  tz: 'America/Managua',                pais: '🇳🇮 Nicaragua' },
  { lada: '1809', tz: 'America/Santo_Domingo',          pais: '🇩🇴 Rep. Dominicana' },
  { lada: '1829', tz: 'America/Santo_Domingo',          pais: '🇩🇴 Rep. Dominicana' },
  { lada: '1849', tz: 'America/Santo_Domingo',          pais: '🇩🇴 Rep. Dominicana' },
  { lada: '53',   tz: 'America/Havana',                 pais: '🇨🇺 Cuba' },
  { lada: '34',   tz: 'Europe/Madrid',                  pais: '🇪🇸 España' },
  { lada: '1',    tz: 'America/Chicago',                pais: '🇺🇸 Estados Unidos' },
]

function detectarInfo(numero) {
  const ordenadas = [...LADAS_TIMEZONE].sort((a, b) => b.lada.length - a.lada.length)
  for (const { lada, tz, pais } of ordenadas) {
    if (String(numero).startsWith(lada)) return { tz, pais }
  }
  return { tz: 'America/Mexico_City', pais: '🌍 Desconocido' }
}

function formatearFechaEnTz(timestamp, tz) {
  return new Date(timestamp).toLocaleString('es-MX', {
    timeZone: tz || 'America/Mexico_City',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function validarTelefono(numero) {
  return /^\d{7,15}$/.test(numero)
}

function ultimosCuatroDigitos(numero) {
  return String(numero).slice(-4)
}

// ─────────────────────────────────────────────
// JUGADORES — operaciones CRUD
// ─────────────────────────────────────────────

// Devuelve todos los jugadores
async function todosLosJugadores() {
  const db = await getDb()
  const result = db.exec('SELECT * FROM jugadores ORDER BY id')
  if (!result.length) return []
  const [cols, ...rows] = [result[0].columns, ...result[0].values]
  return rows.map(row => {
    const obj = {}
    cols.forEach((col, i) => obj[col] = row[i])
    return obj
  })
}

// Busca jugadores por JID (puede tener varias cuentas)
async function jugadoresPorJid(jid) {
  const db = await getDb()
  const result = db.exec(
    'SELECT * FROM jugadores WHERE jid = ? ORDER BY id',
    [jid]
  )
  if (!result.length) return []
  const cols = result[0].columns
  return result[0].values.map(row => {
    const obj = {}
    cols.forEach((col, i) => obj[col] = row[i])
    return obj
  })
}

// Busca un jugador por ID
async function jugadorPorId(id) {
  const db = await getDb()
  const result = db.exec('SELECT * FROM jugadores WHERE id = ?', [parseInt(id)])
  if (!result.length || !result[0].values.length) return null
  const cols = result[0].columns
  const obj = {}
  cols.forEach((col, i) => obj[col] = result[0].values[0][i])
  return obj
}

// Busca jugadores por nombre (exacto, sin importar mayúsculas)
async function jugadoresPorNombre(nombre) {
  const db = await getDb()
  const result = db.exec(
    'SELECT * FROM jugadores WHERE LOWER(nombre) = LOWER(?)',
    [nombre]
  )
  if (!result.length) return []
  const cols = result[0].columns
  return result[0].values.map(row => {
    const obj = {}
    cols.forEach((col, i) => obj[col] = row[i])
    return obj
  })
}

// Busca jugadores por tag (últimos 4 dígitos)
async function jugadoresPorTag(tag) {
  const db = await getDb()
  const result = db.exec('SELECT * FROM jugadores WHERE tag = ?', [tag])
  if (!result.length) return []
  const cols = result[0].columns
  return result[0].values.map(row => {
    const obj = {}
    cols.forEach((col, i) => obj[col] = row[i])
    return obj
  })
}

// Registra un nuevo jugador
async function agregarJugador({ jid, nombre, numero, igg_id = '' }) {
  const db = await getDb()
  const { tz, pais } = detectarInfo(numero)
  const tag = ultimosCuatroDigitos(numero)

  db.run(
    `INSERT INTO jugadores (jid, nombre, numero, tag, igg_id, timezone, pais)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [jid, nombre, numero, tag, igg_id, tz, pais]
  )

  const idResult = db.exec('SELECT last_insert_rowid() as id')
  const nuevoId  = idResult[0].values[0][0]
  saveDb()

  const result = db.exec('SELECT * FROM jugadores WHERE id = ?', [nuevoId])
  if (!result.length || !result[0].values.length) return null
  const cols = result[0].columns
  const obj  = {}
  cols.forEach((col, i) => obj[col] = result[0].values[0][i])
  return obj
}

// Elimina un jugador por ID
async function eliminarJugador(id) {
  const db = await getDb()
  db.run('DELETE FROM jugadores WHERE id = ?', [parseInt(id)])
  saveDb()
}

// Edita nombre o número de un jugador
async function editarJugador(id, campos) {
  const db = await getDb()
  const sets = []
  const vals = []

  if (campos.nombre) { sets.push('nombre = ?');   vals.push(campos.nombre) }
  if (campos.numero) {
    const { tz, pais } = detectarInfo(campos.numero)
    const tag = ultimosCuatroDigitos(campos.numero)
    sets.push('numero = ?', 'tag = ?', 'timezone = ?', 'pais = ?')
    vals.push(campos.numero, tag, tz, pais)
  }

  if (!sets.length) return

  vals.push(parseInt(id))
  db.run(`UPDATE jugadores SET ${sets.join(', ')} WHERE id = ?`, vals)
  saveDb()
}

// ─────────────────────────────────────────────
// ESCUDOS ACTIVOS — operaciones CRUD
// ─────────────────────────────────────────────

async function todosLosEscudosActivos() {
  const db = await getDb()
  const result = db.exec('SELECT * FROM escudos_activos')
  if (!result.length) return []
  const cols = result[0].columns
  return result[0].values.map(row => {
    const obj = {}
    cols.forEach((col, i) => obj[col] = row[i])
    // Convertir avisado de 0/1 a boolean
    obj.avisado = obj.avisado === 1
    return obj
  })
}

async function escudoActivoPorJugadorId(jugadorId) {
  const db = await getDb()
  const result = db.exec(
    'SELECT * FROM escudos_activos WHERE jugador_id = ?',
    [parseInt(jugadorId)]
  )
  if (!result.length || !result[0].values.length) return null
  const cols = result[0].columns
  const obj = {}
  cols.forEach((col, i) => obj[col] = result[0].values[0][i])
  obj.avisado = obj.avisado === 1
  return obj
}

async function guardarEscudoActivo(escudo) {
  const db = await getDb()
  // INSERT OR REPLACE: si ya existe para ese jugador_id, lo reemplaza
  db.run(
    `INSERT OR REPLACE INTO escudos_activos
     (jugador_id, jid, nombre, numero, timezone, pais, tipo, puesto_en, vence_en, avisado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      escudo.jugador_id,
      escudo.jid,
      escudo.nombre,
      escudo.numero,
      escudo.timezone,
      escudo.pais,
      escudo.tipo,
      escudo.puesto_en,
      escudo.vence_en,
      escudo.avisado ? 1 : 0
    ]
  )
  saveDb()
}

async function marcarEscudoAvisado(jugadorId) {
  const db = await getDb()
  db.run(
    'UPDATE escudos_activos SET avisado = 1 WHERE jugador_id = ?',
    [parseInt(jugadorId)]
  )
  saveDb()
}

async function eliminarEscudoActivo(jugadorId) {
  const db = await getDb()
  db.run(
    'DELETE FROM escudos_activos WHERE jugador_id = ?',
    [parseInt(jugadorId)]
  )
  saveDb()
}

// ─────────────────────────────────────────────
// HELPER: buscar jugador por ID, nombre o tag
// Usado por varios comandos (#escudo, #miescudo, #delescudo)
// ─────────────────────────────────────────────

async function buscarJugador(parametro) {
  // ID: dígitos pero no exactamente 4
  if (/^\d+$/.test(parametro) && parametro.length !== 4) {
    const jugador = await jugadorPorId(parametro)
    return { jugador, tipo: 'id' }
  }

  // Tag: exactamente 4 dígitos
  if (/^\d{4}$/.test(parametro)) {
    const coincidencias = await jugadoresPorTag(parametro)
    if (coincidencias.length > 1) return { jugador: null, tipo: 'tag_duplicado', coincidencias }
    return { jugador: coincidencias[0] || null, tipo: 'tag' }
  }

  // Nombre
  const coincidencias = await jugadoresPorNombre(parametro)
  if (coincidencias.length > 1) return { jugador: coincidencias[0], tipo: 'nombre' }
  return { jugador: coincidencias[0] || null, tipo: 'nombre' }
}

module.exports = {
  // Utilidades
  detectarInfo,
  formatearFechaEnTz,
  validarTelefono,
  ultimosCuatroDigitos,
  // Jugadores
  todosLosJugadores,
  jugadoresPorJid,
  jugadorPorId,
  jugadoresPorNombre,
  jugadoresPorTag,
  agregarJugador,
  eliminarJugador,
  editarJugador,
  buscarJugador,
  // Escudos activos
  todosLosEscudosActivos,
  escudoActivoPorJugadorId,
  guardarEscudoActivo,
  marcarEscudoAvisado,
  eliminarEscudoActivo,
}