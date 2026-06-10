// src/database/multicuentas.db.js
// Capa de datos para multicuentas — reemplaza multiManager.js

const { getDb, saveDb } = require('./db')

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function normalizeKey(nombre) {
  return String(nombre ?? '').trim().toLowerCase()
}

function parseIds(raw) {
  return String(raw ?? '')
    .split(',')
    .map(i => i.trim())
    .filter(Boolean)
}

function joinIds(ids) {
  return ids.join(', ')
}

function sortStrings(arr) {
  return arr.slice().sort((a, b) => a.localeCompare(b))
}

function sortIds(arr) {
  return arr.slice().sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  )
}

function rowToObj(cols, row) {
  const obj = {}
  cols.forEach((col, i) => obj[col] = row[i])
  return obj
}

// ─────────────────────────────────────────────
// CONSULTAS
// ─────────────────────────────────────────────

async function todosLosUsuarios() {
  const db = await getDb()
  const result = db.exec('SELECT * FROM multicuentas ORDER BY nombre_dado')
  if (!result.length) return []
  const cols = result[0].columns
  return result[0].values.map(row => rowToObj(cols, row))
}

async function usuarioPorKey(key) {
  const db = await getDb()
  const result = db.exec(
    'SELECT * FROM multicuentas WHERE key_nombre = ?',
    [normalizeKey(key)]
  )
  if (!result.length || !result[0].values.length) return null
  return rowToObj(result[0].columns, result[0].values[0])
}

async function usuarioPorJid(jid) {
  const db = await getDb()
  const result = db.exec(
    'SELECT * FROM multicuentas WHERE owner_jid = ?',
    [jid]
  )
  if (!result.length || !result[0].values.length) return null
  return rowToObj(result[0].columns, result[0].values[0])
}

// ─────────────────────────────────────────────
// ESCRITURA
// ─────────────────────────────────────────────

async function agregarUsuario({ key_nombre, nombre_dado, owner_jid, ids_juego, nombres_cuentas }) {
  const db = await getDb()
  db.run(
    `INSERT INTO multicuentas (key_nombre, nombre_dado, owner_jid, ids_juego, nombres_cuentas)
     VALUES (?, ?, ?, ?, ?)`,
    [
      normalizeKey(key_nombre),
      nombre_dado,
      owner_jid,
      joinIds(sortIds(ids_juego)),
      sortStrings(nombres_cuentas).join(', ')
    ]
  )
  saveDb()
  return usuarioPorKey(key_nombre)
}

async function actualizarUsuario(key, { ids_juego, nombres_cuentas, owner_jid }) {
  const db = await getDb()
  const sets = []
  const vals = []

  if (ids_juego !== undefined) {
    sets.push('ids_juego = ?')
    vals.push(joinIds(sortIds(ids_juego)))
  }
  if (nombres_cuentas !== undefined) {
    sets.push('nombres_cuentas = ?')
    vals.push(sortStrings(nombres_cuentas).join(', '))
  }
  if (owner_jid !== undefined) {
    sets.push('owner_jid = ?')
    vals.push(owner_jid)
  }

  if (!sets.length) return

  vals.push(normalizeKey(key))
  db.run(`UPDATE multicuentas SET ${sets.join(', ')} WHERE key_nombre = ?`, vals)
  saveDb()
}

async function eliminarUsuario(key) {
  const db = await getDb()
  db.run('DELETE FROM multicuentas WHERE key_nombre = ?', [normalizeKey(key)])
  saveDb()
}

module.exports = {
  normalizeKey,
  parseIds,
  joinIds,
  sortStrings,
  sortIds,
  todosLosUsuarios,
  usuarioPorKey,
  usuarioPorJid,
  agregarUsuario,
  actualizarUsuario,
  eliminarUsuario,
}